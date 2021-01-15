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
from segmentation import run_segmentation_2d
from processing import unzipper
from processing import datasets_processing
import tempfile
import os
import logging
from rendererMembrane import func

logger = logging.getLogger('dispatcher')
logger.setLevel(logging.DEBUG)
formatter = logging.Formatter(
    '%(asctime)s | %(levelname)-8s | %(name)s.%(funcName)s: %(message)s')
# FileHandler for logging
fh = logging.FileHandler('/home/ubuntu/membrane-hub/logs/dispatcher.log')
fh.setLevel(logging.DEBUG)
fh.setFormatter(formatter)
logger.addHandler(fh)
# Console for logging
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
ch.setFormatter(formatter)
logger.addHandler(ch)


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
    logger.info(f"Processing {path_downloaded}.")
    if path_downloaded.suffix == '.zip':
        path_unzipped = path_downloaded.parent / path_downloaded.stem
        logger.info(f"Unzipping .zip file into {path_unzipped}.")
        unzipper.unzip_dataset(
            path_downloaded,
            path_unzipped
        )
        list_files.extend(unzipper.recurse_dataset(path_unzipped))
        logger.debug(f"list_files: {list_files}")
    elif path_downloaded.suffix in ['.czi', '.lsm']:
        logger.info(f"Processing {path_downloaded.suffix} file.")
        list_files.extend([path_downloaded])
    else:
        logger.warning("What's happening here, mate!?")
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
            mode="mask 2D",  # Important this is 
            depends_on=segmentation_job
        )
        # Doing a similar job for a 3D segmentation
        segmentation_3d_job = queue_dispatcher_default.enqueue(
            trigger_segmentation_3d_after_upload,
            file_path,
            job_timeout='60m',
            result_ttl=86400
        )
        queue_dispatcher_high.enqueue(
            render_segmentation,
            file_path,
            email,
            mode="mask 3D",
            depends_on=segmentation_3d_job
        )


# Note this assumes the dataset is 3-dimensional
def generate_metadata(file_path, email):
    """Generating using ImageRenderer as an image analysis tool.
        It collects some basic info (z, channels) concerning the image.

    Keyword arguments:
    file_path: Path -- Path to the image file
    email: str -- ..
    """
    logger.info(f"Generating metadata for {file_path}")
    renderer = ImageRenderer(file_path, None)
    image_data = renderer.prepare_canvas()
    path_dataset = Path(app.config['IMAGESPATH']) / email / file_path.name
    metadata = datasets_processing.initialize_dataset(
        path_dataset,
        z=image_data['z'],
        channels=image_data['channels'],
        dims="3D",
        source = str(file_path)
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
    logger.info(f"Processing 3D set {file_path}")
    renderer = ImageRenderer(file_path, None)
    image_data = renderer.prepare_canvas()
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
    logger.info("Done.")


# TODO Write docstring here
def render_segmentation(source_image_path, email, mode="mask 2D"):
    """
    Keyword arguments:
    source_image_path: Path -- ..
    email: str -- ..
    """
    logger.info(f"Rendering segmentation in mode {mode} for {source_image_path}.")
    current_job = get_current_job()
    job = current_job.dependency
    segmentation_path, trace_path = job.result
    logger.info(f"The masks are in {segmentation_path}.")
    renderer = ImageRenderer(source_image_path, segmentation_path)
    image_data = renderer.prepare_canvas()
    rendered_output = renderer.render(
        rendering_mode=mode,
        scales=[1],
        sizes=[(100, 100)]
    )
    rendered_output_path = rendered_output['output_path']
    path_dataset = Path(app.config['IMAGESPATH']) / \
        email / source_image_path.name
    logger.info(
        f"Copying masks from {rendered_output_path} to {path_dataset}.")
    datasets_processing.populate_dataset(
        path_dataset,
        rendered_output_path,
        segmentation=True
    )
    segmentation_output_path = Path(
        app.config['SEGMENTATIONPATH']) / email / trace_path.name
    print(
        f"Copying segmentation trace from {trace_path} to {segmentation_output_path}.")
    shutil.copy(trace_path, segmentation_output_path)
    # Setting masks to true, however without activation
    metadata = datasets_processing.load_metadata(path_dataset)
    if mode == 'mask 2D':
        metadata['masked'] = True
    if mode == 'mask 3D':
        metadata['masked3d'] = True
    datasets_processing.save_metadata(path_dataset, metadata)


# TODO Write docstring here
def initialize(path_result, url):
    logger.info(f"Initializing {path_result} {url}.")
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
    logger.info(f"Schedule jupyter notebook run: {notebook_file_name}.")
    notebook_path = Path('./segmentation/') / notebook_file_name
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
    logger.info(f"Schedule jupyter notebook run: {notebook_file_name}")
    notebook_path = Path('./segmentation/') / notebook_file_name
    assert notebook_path.is_file() and notebook_path.exists, notebook_path
    basedir_out = tempfile.mkdtemp()
    os.chmod(basedir_out, 0o775)
    # '/home/ubuntu/Projects/data/uploads/grzegorz.kossakowski@gmail.com/FISH1_BDNF488_1_cLTP_3_CA.czi'
    segmentation_path_npy, trace_path = run_segmentation.main(notebook_path,
                                                              basedir_out,
                                                              str(input_path_czi))
    # run_segmentation.main now works with strings instead of paths!
    return Path(segmentation_path_npy), Path(trace_path)


# Remember about timeout 15m
def trigger_outline_2d_image_after_upload(input_path_png):
    """Computes the segmentation masks for the input .png file.

    Keyword arguments:
    input_path_czi: Path -- input path to a .czi file

    Returns:
    a path to the output segmentation .png file
    """
    notebook_file_name = 'run_cellpose_GPU_membrane-2d-single-image.ipynb'
    logger.info(f"Schedule jupyter notebook run: {notebook_file_name}")
    notebook_path = Path('./segmentation/') / notebook_file_name
    assert notebook_path.is_file() and notebook_path.exists, notebook_path
    # '/home/ubuntu/Projects/data/uploads/grzegorz.kossakowski@gmail.com/FISH1_BDNF488_1_cLTP_3_CA.czi'
    outline_file_path = run_segmentation_2d.main(notebook_path, str(input_path_png))
    # run_segmentation.main now works with strings instead of paths!
    return Path(outline_file_path)


def outline_2d_adjust_metadata(path_scratchpad, path_file_image):
    logger.info(f"Adjusting metadata for {path_scratchpad}.")
    current_job = get_current_job()
    job = current_job.dependency
    path_outline = job.result
    logger.debug(f"path_file_image={path_file_image} path_outline={path_outline}.")
    metadata = datasets_processing.load_metadata(path_scratchpad)
    datasets_processing.add_outline(path_file_image.name, path_outline.name, metadata)
    datasets_processing.save_metadata(path_scratchpad, metadata)


# curl -F email=m.zdanowicz@gmail.com -F 'image=@/home/ubuntu/Projects/data/uploads/28.png'  localhost:5000/extend_scratchpad
@app.route('/extend_scratchpad',  methods=['POST'])
def extend_scratchpad():
    if request.method == 'POST':
        if 'file' not in request.files:
            logger.warning("No file in files.")
            return make_response(jsonify({'feedback': 'Error: no files here :/'}), 401)
        else:
            # Add a file to the scratchpad
            logger.debug("File is present.")
            file = request.files['file']
            email = request.form['email']
            logger.info(f"Processing {file.filename} from {email}.")
            filename = secure_filename(file.filename)
            path_scratchpad = Path(app.config['IMAGESPATH']) / \
                email / "scratchpad"
            logger.info(f"Saving file at {path_scratchpad}.")
            path_files = path_scratchpad / "0"
            path_file_image = path_files / filename
            file.save(path_file_image)
            job_outline = queue_dispatcher_high.enqueue(
                trigger_outline_2d_image_after_upload,
                path_file_image,
                at_front=True
            )
            metadata = datasets_processing.load_metadata(path_scratchpad)
            datasets_processing.extend_dataset([filename], metadata)
            datasets_processing.save_metadata(path_scratchpad, metadata)
            queue_dispatcher_high.enqueue(
                outline_2d_adjust_metadata,
                path_scratchpad,
                path_file_image,
                depends_on=job_outline,
                at_front=True
            )
        logger.info(f"Finished processing file.")
    return make_response(jsonify({'feedback': 'Success :)'}), 200)


# Try this up using the following (be careful that's a 20GB file)
# json='{"url": "https://drive.google.com/file/d/1mtHLzrfkmJc6MpDbw8qux5L3Z7poWkRQ/view?usp=sharing", "email": "m.zdanowicz@gmail.com", "gdrive": true}'; curl -d "$json" -H 'Content-Type: application/json' localhost:5001/send
# Alternative test with small.czi (6 .czi files zipped together)
# json='{"url": "https://drive.google.com/file/d/1aui6RFMQakxBzZ1E0GB-UKGlu0CNwnSS/view?usp=sharing", "email": "m.zdanowicz@gmail.com", "gdrive": true}'; curl -d "$json" -H 'Content-Type: application/json' localhost:5001/send
@app.route('/send',  methods=['POST'])
def send():
    if request.method == 'POST':
        content = request.json
        logger.info("Downloading the file..")
        logger.debug(f"url= {content['url']}")
        logger.debug(f"gdrive={content['gdrive']}")
        logger.debug(f"email={content['email']}")
        hashed_name = initialize(
            Path(app.config['IMAGESPATH']) / content['email'],
            content['url'])
        # Result ttl set high because the data is necessary for the process_download
        # which might happen later down the road (e.g., a lot of segmentations from
        # other process). Should be adjusted once queues are prioritized
        logger.info(f"Starting the download..")
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


@app.route('/test_rendering',  methods=['POST'])
def segmentation():
    if request.method == 'POST':
        func()
    return jsonify({'result': 'SCHEDULED'})



@app.route('/')
def index():
    return "Welcome to Membrane Dispatcher."


if __name__ == '__main__':
    app.run(host='localhost', port=app.config['PORT'])
