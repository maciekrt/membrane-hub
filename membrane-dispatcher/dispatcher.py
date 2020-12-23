from rendererMembrane import processImage
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

from flask import Flask, request, jsonify
app = Flask(__name__)
app.config.from_pyfile('config.py')

redis_conn = Redis()
queueDispatcher = Queue('dispatcherMembrane', connection=redis_conn,
                        timeout=3600)  # no args implies the default queue


def workerProcessImage(pathfile, pathres):
    current_job = get_current_job()
    job = current_job.dependency
    # email = job.result['email']
    print(f"workerProcessImage[jobresult]: {job.result}")
    print(f"workerProcessImage[pathfile]: {pathfile}")
    print(f"workerProcessImage[pathres]: {pathres}")
    # assert path.exists()
    metadata = processImage(
        pathfile+job.result,
        None,
        pathres+job.result,
        scales=[1],
        sizes=[(100, 100)]
    )
    # Process meta data.. CHANGE IT URGENTLY!!
    metadata["active"] = True
    with open(pathres + f"{job.result}/metadata.json", 'w') as outfile:
        json.dump(metadata, outfile)
    print("workerProcessImage: HAPPINESS!")


def initialize(pathres, url):
    print(f"initialize: {pathres} {url}")
    hashedName = hashlib.sha224(url.encode('utf-8')).hexdigest()
    path = pathres / hashedName
    path.mkdir()
    metadataJSON = {"url": url, "active": False}
    with open(path / "metadata.json", 'w') as outfile:
        json.dump(metadataJSON, outfile)
    return hashedName

def finalize(path):
    print(f"finalize: {path}")
    shutil.rmtree(str(path), ignore_errors=True)

# https://www.twilio.com/blog/first-task-rq-redis-python


@app.route('/send',  methods=['POST'])
def send():
    if request.method == 'POST':
        content = request.json
        print("send: Downloading the file..")
        print(f"send[url]: {content['url']}")
        print(f"send[gdrive]: {content['gdrive']}")
        print(f"send[email]: {content['email']}")
        dirPath = Path(app.config['IMAGESPATH']) / content['email']
        hashedName = initialize(dirPath, content['url'])
        jobDownload = queueDispatcher.enqueue(
            downloader.downloadFile,
            app.config['TOKENPATH'],
            app.config['CREDENTIALSPATH'],
            content['url'],
            app.config['UPLOADSPATH'] + f"/{content['email']}"
        )
        jobRenderer = queueDispatcher.enqueue(
            workerProcessImage,
            app.config['UPLOADSPATH'] + f"/{content['email']}/",
            app.config['IMAGESPATH'] + f"/{content['email']}/",
            depends_on=jobDownload)
        queueDispatcher.enqueue(
            finalize,
            dirPath / hashedName,
            depends_on=jobRenderer
        )
    return jsonify({'feedback': 'SUCCESS :)'})


@app.route('/')
def index():
    return "Welcome to Membrane Dispatcher."
