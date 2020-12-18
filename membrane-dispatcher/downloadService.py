from rendererMembrane import processImage
from rq import Queue, get_current_job
from redis import Redis
from GoogleDriveAPI import downloader
import time
import sys
import pandas as pd
import json

from flask import Flask, request, jsonify
app = Flask(__name__)
app.config.from_pyfile('config.py')

redis_conn = Redis()
q = Queue(connection=redis_conn)  # no args implies the default queue

def workerProcessImage(pathfile, pathres):
    current_job = get_current_job()
    job = current_job.dependency
    # email = job.result['email']
    print(f"jobresult[workerProcessImage]: {job.result}")
    print(f"pathfile[workerProcessImage]: {pathfile}")
    print(f"pathres[workerProcessImage]: {pathres}")
    # assert path.exists()
    len_z = processImage(
        pathfile+job.result,
        None,
        pathres+job.result,
        scales=[1],
        sizes=[(100,100)]
    )
    # Process meta data.. CHANGE IT URGENTLY!!
    metadata = {"z" : str(len_z), "masked": "False"}
    with open(pathres + f"{job.result}/metadata.json", 'w') as outfile:
        json.dump(metadata, outfile)
    print("processImage HAPPINESS")

# https://www.twilio.com/blog/first-task-rq-redis-python
@app.route('/send',  methods=['POST'])
def send():
    if request.method == 'POST':
        content = request.json
        print("Downloading the file..")
        print(f"url: {content['url']}")
        print(f"gdrive: {content['gdrive']}")
        print(f"email: {content['email']}")
        job = q.enqueue(
            downloader.downloadFile, 
            app.config['TOKENPATH'], 
            app.config['CREDENTIALSPATH'], 
            content['url'],
            app.config['UPLOADSPATH'] + f"/{content['email']}"
        )
        q.enqueue(
            workerProcessImage, 
            app.config['UPLOADSPATH'] + f"/{content['email']}/",
            app.config['IMAGESPATH'] + f"/{content['email']}/",
            depends_on=job)
    return jsonify({'feedback': 'SUCCESS :)'})

@app.route('/')
def index():
    return "Welcome to Membrane Dispatcher."
