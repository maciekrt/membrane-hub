from rendererMembrane import ImageRenderer
from rq import Queue, Retry, get_current_job
from redis import Redis
from GoogleDriveAPI import downloader
import time
import sys
import pandas as pd
import json
import hashlib
from pathlib import Path
import shutil
from segmentation import run_segmentation
from processing import unzipper
from processing import datasets_processing
import tempfile
import os

from flask import Flask, jsonify, make_response, flash, request, redirect, url_for
from werkzeug.utils import secure_filename
app = Flask(__name__)
app.config.from_pyfile('config.py')

redis_conn = Redis()
QUEUE_NAME_HIGH = app.config['QUEUE_NAME']
QUEUE_NAME_DEFAULT = app.config['QUEUE_NAME']
QUEUE_NAME_LOW = app.config['QUEUE_NAME']
queue_dispatcher = Queue(app.config['QUEUE_NAME'], connection=redis_conn,
                         default_timeout=3600)  # no args implies the default queue
queue_dispatcher_high = Queue(app.config['QUEUE_NAME_HIGH'], connection=redis_conn,
                              default_timeout=3600)  # no args implies the default queue
queue_dispatcher_default = Queue(app.config['QUEUE_NAME_DEFAULT'], connection=redis_conn,
                                 default_timeout=3600)  # no args implies the default queue
queue_dispatcher_low = Queue(app.config['QUEUE_NAME_LOW'], connection=redis_conn,
                             default_timeout=3600)  # no args implies the default queue


# TODO Write docstring here
def process_download(email):
    list_files = []
    current_job = get_current_job()
    job = current_job.dependency
    path_downloaded = job.result
    print(f"process_download[path_downloaded]: {path_downloaded}")
    if path_downloaded.suffix == '.zip':
        path_unzipped = path_downloaded.parent / path_downloaded.stem
        print(f"process_download: Unzipping .zip file into {path_unzipped}")
        unzipper.unzip_dataset(
            path_downloaded,
            path_unzipped
        )
        list_files.extend(unzipper.recurse_dataset(path_unzipped))
        print(f"process_download[list_files]: {list_files}")
    elif path_downloaded.suffix in ['.czi', '.lsm']:
        print(f"process_download: Processing {path_downloaded.suffix} file.")
        list_files.extend([path_downloaded])
    else:
        print("What's happening here, mate!?")
    for file_path in list_files:
        generate_metadata(file_path, email)
        queue_dispatcher_high.enqueue(
            render_image,
            file_path,
            email
        )
        # Result ttl set high because the data is necessary for render_segmentation
        # which might happen later down the road (e.g., a lot of segmentations from
        # other process). Should be adjusted once queues are prioritized
        segmentation_job = queue_dispatcher_default.enqueue(
            trigger_segmentation_after_upload,
            file_path,
            job_timeout='30m',
            result_ttl=86400
        )
        queue_dispatcher_high.enqueue(
            render_segmentation,
            file_path,
            email,
            depends_on=segmentation_job
        )


def generate_metadata(file_path, email):
    """Generating using ImageRenderer as an image analysis tool.
        It collects some basic info (z, channels) concerning the image.

    Keyword arguments:
    file_path: Path -- Path to the image file
    email: str -- ..
    """
    print(f"dispatcher.generate_metadata[file_path]: {file_path}")
    renderer = ImageRenderer(file_path, None)
    image_data = renderer.prepare_canvas()
    path_dataset = Path(app.config['IMAGESPATH']) / email / file_path.name
    metadata = datasets_processing.initialize_dataset(
        path_dataset,
        z=image_data['z'],
        channels=image_data['channels'],
        dims="3D"
    )


# TODO Move the metadata processing to a separate function (most likely in datasets_processing)
def render_image(file_path, email):
    """Rendering the images without masks and populating the corresponding dataset.
        Metadata processing should be moved elsewhere.

    Keyword arguments:
    source_image_path: Path -- ..
    email: str -- ..
    """
    # Path(app.config['IMAGESPATH']) / email / file.name
    print(f"dispatcher.render_image[file_path]: {file_path}")
    renderer = ImageRenderer(file_path, None)
    image_data = renderer.prepare_canvas()
    print(f"dispatcher.render_image: Processing 3D set")
    path_dataset = Path(app.config['IMAGESPATH']) / email / file_path.name
    rendering_output = renderer.render(
        rendering_mode='image only',
        scales=[1],
        sizes=[(100, 100)]
    )
    rendered_output_path = rendering_output['output_path']
    rendered_z = rendering_output['z']
    metadata = datasets_processing.load_metadata(path_dataset)
    assert metadata['z'] == rendered_z
    datasets_processing.populate_dataset(
        path_dataset, rendered_output_path, segmentation=False)
    metadata['active'] = True
    datasets_processing.save_metadata(path_dataset, metadata)
    print("dispatcher.render_image: Done.")


# TODO Write docstring here
def render_segmentation(source_image_path, email):
    """
    Keyword arguments:
    source_image_path: Path -- ..
    email: str -- ..
    """
    print(f"dispatcher.render_segmentation: Rendering segmentation "
          f"for {source_image_path}.")
    current_job = get_current_job()
    job = current_job.dependency
    segmentation_path, trace_path = job.result
    print(
        f"dispatcher.render_segmentation: The masks are in {segmentation_path}.")
    renderer = ImageRenderer(source_image_path, segmentation_path)
    image_data = renderer.prepare_canvas()
    rendered_output = renderer.render(
        rendering_mode='mask only',
        scales=[1],
        sizes=[(100, 100)]
    )
    rendered_output_path = rendered_output['output_path']
    path_dataset = Path(app.config['IMAGESPATH']) / \
        email / source_image_path.name
    print(
        f"dispatcher.render_segmentation: Copying masks from {rendered_output_path} "
        f"to {path_dataset}")
    datasets_processing.populate_dataset(
        path_dataset,
        rendered_output_path,
        segmentation=True
    )
    segmentation_output_path = Path(
        app.config['SEGMENTATIONPATH']) / email / trace_path.name
    print(
        f"dispatcher.render_segmentation: Copying segmentation trace from {trace_path} "
        f"to {segmentation_output_path}")
    shutil.copy(trace_path, segmentation_output_path)
    # Setting masks to true, however without activation
    metadata = datasets_processing.load_metadata(path_dataset)
    metadata['masked'] = True
    datasets_processing.save_metadata(path_dataset, metadata)


# TODO Write docstring here
def initialize(path_result, url):
    print(f"initialize: {path_result} {url}")
    hashed_name = hashlib.sha224(url.encode('utf-8')).hexdigest()
    path = path_result / hashed_name
    path.mkdir(exist_ok=True)
    metadata_JSON = {"url": url, "active": False}
    with open(path / "metadata.json", 'w') as out_file:
        json.dump(metadata_JSON, out_file)
    return hashed_name


def finalize(path):
    print(f"finalize: {path}")
    shutil.rmtree(str(path), ignore_errors=True)


# Remember about timeout 15m
def trigger_segmentation_after_upload(input_path_czi):
    """Computes the segmentation masks for the input .czi file.

    Keyword arguments:
    input_path_czi: Path -- input path to a .czi file

    Returns:
    a path to the output segmentation .npy file
    """
    notebook_file_name = 'run_cellpose_GPU_membrane.ipynb'
    print(f'Schedule jupyter notebook run: {notebook_file_name}')
    notebook_path = Path(
        '/home/ubuntu/Projects/dispatcherMembrane/segmentation/') / notebook_file_name
    assert notebook_path.is_file() and notebook_path.exists, notebook_path
    basedir_out = tempfile.mkdtemp()
    os.chmod(basedir_out, 0o775)
    # '/home/ubuntu/Projects/data/uploads/grzegorz.kossakowski@gmail.com/FISH1_BDNF488_1_cLTP_3_CA.czi'
    segmentation_path_npy, trace_path = run_segmentation.main(notebook_path,
                                                              basedir_out,
                                                              str(input_path_czi))
    # run_segmentation.main now works with strings instead of paths!
    return Path(segmentation_path_npy), Path(trace_path)

def trigger_segmentation_3d_after_upload(input_path_czi):
    """Computes the segmentation masks for the input .czi file.

    Keyword arguments:
    input_path_czi: Path -- input path to a .czi file

    Returns:
    a path to the output segmentation .npy file
    """
    notebook_file_name = 'run_cellpose_GPU_membrane_3d.ipynb'
    print(f'Schedule jupyter notebook run: {notebook_file_name}')
    notebook_path = Path(
        '/home/ubuntu/Projects/dispatcherMembrane/segmentation/') / notebook_file_name
    assert notebook_path.is_file() and notebook_path.exists, notebook_path
    basedir_out = tempfile.mkdtemp()
    os.chmod(basedir_out, 0o775)
    # '/home/ubuntu/Projects/data/uploads/grzegorz.kossakowski@gmail.com/FISH1_BDNF488_1_cLTP_3_CA.czi'
    segmentation_path_npy, trace_path = run_segmentation.main(notebook_path,
                                                              basedir_out,
                                                              str(input_path_czi))
    # run_segmentation.main now works with strings instead of paths!
    return Path(segmentation_path_npy), Path(trace_path)


# curl -F email=m.zdanowicz@gmail.com -F 'image=@/home/ubuntu/Projects/data/uploads/28.png'  localhost:5000/extend_scratchpad
@app.route('/extend_scratchpad',  methods=['POST'])
def extend_scratchpad():
    if request.method == 'POST':
        print(f"dispatcher.extend_scratchpad: Extending scratchpad.")
        print(f"headers: {request.headers}")
        print(f"form: {request.form}")
        print(f"data: {request.data}")

        if 'file' not in request.files:
            print("dispatcher.extend_scratchpad: No file in files.")
            return make_response(jsonify({'feedback': 'Error: no files here :/'}), 401)
        else:
            # Add a file to the scratchpad
            print("dispatcher.extend_scratchpad: file is present.")
            file = request.files['file']
            email = request.form['email']
            print(f"dispatcher.extend_scratchpad[filename]: {file.filename}")
            print(f"dispatcher.extend_scratchpad[email]: {email}")
            filename = secure_filename(file.filename)
            path_scratchpad = Path(app.config['IMAGESPATH']) / \
                email / "scratchpad"
            print(f"extend_scratchpad: Saving file at {path_scratchpad}.")
            path_files = path_scratchpad / "0"
            file.save(path_files / filename)
            metadata = datasets_processing.load_metadata(path_scratchpad)
            datasets_processing.extend_dataset([filename], metadata)
            datasets_processing.save_metadata(path_scratchpad, metadata)
        print(f"dispatcher.extend_scratchpad: Finished processing file.")
    return make_response(jsonify({'feedback': 'Success :)'}), 200)


# Try this up using the following (be careful that's a 20GB file)
# json='{"url": "https://drive.google.com/file/d/1mtHLzrfkmJc6MpDbw8qux5L3Z7poWkRQ/view?usp=sharing", "email": "m.zdanowicz@gmail.com", "gdrive": true}'; curl -d "$json" -H 'Content-Type: application/json' localhost:5001/send
# Alternative test with small.czi (6 .czi files zipped together) 
# https://drive.google.com/file/d/1aui6RFMQakxBzZ1E0GB-UKGlu0CNwnSS/view?usp=sharing
@app.route('/send',  methods=['POST'])
def send():
    if request.method == 'POST':
        content = request.json
        print("send: Downloading the file..")
        print(f"send[url]: {content['url']}")
        print(f"send[gdrive]: {content['gdrive']}")
        print(f"send[email]: {content['email']}")
        hashed_name = initialize(
            Path(app.config['IMAGESPATH']) / content['email'],
            content['url'])
        # Result ttl set high because the data is necessary for the process_download
        # which might happen later down the road (e.g., a lot of segmentations from
        # other process). Should be adjusted once queues are prioritized
        job_download = queue_dispatcher_high.enqueue(
            downloader.download_file,
            Path(app.config['TOKENPATH']),
            Path(app.config['CREDENTIALSPATH']),
            content['url'],
            Path(app.config['UPLOADSPATH']) / content['email'],
            retry=Retry(max=3, interval=[60, 120, 240]),
            result_ttl=86400,
            at_front=True
        )
        job_process = queue_dispatcher_high.enqueue(
            process_download,
            content['email'],
            depends_on=job_download,
            at_front=True
        )
        # That's really quick!
        queue_dispatcher_high.enqueue(
            finalize,
            Path(app.config['IMAGESPATH']) / content['email'] / hashed_name,
            depends_on=job_process,
            at_front=True
        )
    return jsonify({'feedback': 'SUCCESS :)'})


# https://www.twilio.com/blog/first-task-rq-redis-python
@app.route('/upload_file',  methods=['POST'])
def upload_file():
    if request.method == 'POST':
        content = request.json
        print("send: Downloading the file..")
        print(f"send[url]: {content['url']}")
        print(f"send[gdrive]: {content['gdrive']}")
        print(f"send[email]: {content['email']}")
        hashed_name = initialize(
            Path(app.config['IMAGESPATH']) / content['email'],
            content['url'])
        job_download = queue_dispatcher.enqueue(
            downloader.download_file,
            Path(app.config['TOKENPATH']),
            Path(app.config['CREDENTIALSPATH']),
            content['url'],
            Path(app.config['UPLOADSPATH']) / content['email']
        )
        queue_dispatcher.enqueue(
            process_download,
            content['email'],
            depends_on=job_download
        )
        queue_dispatcher.enqueue(
            finalize,
            Path(app.config['IMAGESPATH']) / content['email'] / hashed_name,
            depends_on=job_download)
    return jsonify({'feedback': 'SUCCESS :)'})


# try with:
# json='{"input_file_path": "[your czi name], "email": "email"}'; curl -d "$json" -H 'Content-Type: application/json' localhost:5000/segmentation
@app.route('/segmentation',  methods=['POST'])
def segmentation():
    if request.method == 'POST':
        req_payload = request.json
        # '/home/ubuntu/Projects/data/uploads/grzegorz.kossakowski@gmail.com/FISH1_BDNF488_1_cLTP_3_CA.czi'
        input_file_path = req_payload['input_file_path']
        jobDownload = queue_dispatcher_default.enqueue(
            trigger_segmentation_3d_after_upload,
            input_file_path,
            job_timeout='15m'
        )
    return jsonify({'result': 'SCHEDULED'})


@app.route('/')
def index():
    return "Welcome to Membrane Dispatcher."


if __name__ == '__main__':
    app.run(host='localhost', port=app.config['PORT'])
