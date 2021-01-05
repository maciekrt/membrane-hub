from rendererMembrane import ImageRenderer
from rq import Queue, get_current_job
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

from flask import Flask, request, jsonify
app = Flask(__name__)
app.config.from_pyfile('config.py')

redis_conn = Redis()
queue_dispatcher = Queue('dispatcherMembrane', connection=redis_conn,
                         timeout=3600)  # no args implies the default queue


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
    for file in list_files:
        queue_dispatcher.enqueue(
            process_image,
            file,
            email
        )

"""
   
    metadata1 = renderer.prepare_canvas()
    print(f"metadata1: {metadata1}")
    names = [str(x) for x in range(metadata1['z'])]
    metadata2 = renderer.process(names=names, masked='yes', scales=[1], sizes=[])
    print(f"metadata2: {metadata1}")
    renderer.copy_results(path_result)
"""

def process_image(path_file, email):
    # Path(app.config['IMAGESPATH']) / email / file.name
    print(f"process_image[path_file]: {path_file}")
    renderer = ImageRenderer(path_file, None)
    image_data = renderer.prepare_canvas()
    print(f"process_image[metadata]: {image_data}")
    if image_data['z'] == 1:
        # Two dimensional set so for now let's just process scratchpad data
        print(f"process_image: Processing 2D set")
        scratchpad_dataset = Path(app.config['IMAGESPATH']) / email / "scratchpad"
        metadata = datasets_processing.load_metadata(scratchpad_dataset)
        datasets_processing.extend_dataset([])
        datasets_processing.save_metadata(scratchpad_dataset, metadata)
    else:
        # Three dimensional set 
        print(f"process_image: Processing 3D set")
        path_dataset = Path(app.config['IMAGESPATH']) / email / path_file.name
        metadata = datasets_processing.initialize_dataset(
            path_dataset,
            channels=image_data['channels'],
            dims="3D"
        )
        proposed_names = datasets_processing.propose_names(image_data['z'], metadata)
        renderer.process(
            names=proposed_names, 
            masked='no', 
            scales=[1], 
            sizes=[(100,100)]
        )
        renderer.copy_results(path_dataset)
        datasets_processing.extend_dataset(proposed_names, metadata)
        metadata['active'] = True
        datasets_processing.save_metadata(path_dataset, metadata)
        
    # Process meta data.. CHANGE IT URGENTLY!!
    # metadata["active"] = True
    # metadata["source"] = str(path_file)
    # with open(path_result / "metadata.json", 'w') as out_file:
    #     json.dump(metadata, out_file)
    print("process_image: Done.")


def initialize(path_result, url):
    print(f"initialize: {path_result} {url}")
    hashed_name = hashlib.sha224(url.encode('utf-8')).hexdigest()
    path = path_result / hashed_name
    path.mkdir()
    metadata_JSON = {"url": url, "active": False}
    with open(path / "metadata.json", 'w') as out_file:
        json.dump(metadata_JSON, out_file)
    return hashed_name


def finalize(path):
    print(f"finalize: {path}")
    shutil.rmtree(str(path), ignore_errors=True)


def trigger_segmentation():
    run_segmentation.main()

# https://www.twilio.com/blog/first-task-rq-redis-python
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
# curl -d '{"notebook_file_name": "run_quick.ipynb"}' -H 'Content-Type: application/json' localhost:5000/segmentation


@app.route('/segmentation',  methods=['POST'])
def segmentation():
    if request.method == 'POST':
        req_payload = request.json
        # content['notebook_file_name']
        notebook_file_name = 'run_cellpose_GPU_membrane.ipynb'
        print(f'Schedule jupyter notebook run: {notebook_file_name}')
        notebook_path = Path(
            '/home/ubuntu/Projects/dispatcherMembrane/segmentation/') / notebook_file_name
        assert notebook_path.is_file() and notebook_path.exists, notebook_path
        basedir_out = '/home/ubuntu/tmp/'
        # '/home/ubuntu/Projects/data/uploads/grzegorz.kossakowski@gmail.com/FISH1_BDNF488_1_cLTP_3_CA.czi'
        input_file_path = req_payload['input_file_path']
        jobDownload = queue_dispatcher.enqueue(
            run_segmentation.main,
            notebook_path,
            basedir_out,
            input_file_path,
            job_timeout='15m'
        )
    return jsonify({'result': 'SCHEDULED'})


@app.route('/')
def index():
    return "Welcome to Membrane Dispatcher."
