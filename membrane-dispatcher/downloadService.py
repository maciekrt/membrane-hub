from rendererMembrane import processImage
from rq import Queue, get_current_job
from redis import Redis
from GoogleDriveAPI import downloader
import time
import sys

from flask import Flask, request, jsonify
app = Flask(__name__)
app.config.from_pyfile('config.py')

redis_conn = Redis()
q = Queue(connection=redis_conn)  # no args implies the default queue

def workerProcessImage():
    current_job = get_current_job()
    job = current_job.dependency
    # email = job.result['email']
    pathfile = app.config['UPLOADSPATH'] + "/grzegorz.kossakowski@gmail.com/" + job.result
    print(f"pathfile[workerProcessImage]: {pathfile}")
    pathres = app.config['IMAGESPATH'] + "/grzegorz.kossakowski@gmail.com/" + job.result
    print(f"pathres[workerProcessImage]: {pathres}")
    # assert path.exists()
    processImage(pathfile,None,pathres)
    print("processImage HAPPINESS")

def workHard():
    processImage(
        "/home/ubuntu/Projects/data/uploads/example/image.lsm",
        "/home/ubuntu/Projects/data/uploads/example/segmentation.tif",
        "/home/ubuntu/Projects/data/images/example/",
        scales=[1, 2],
        sizes=[(100, 100)]
    )

# https://www.twilio.com/blog/first-task-rq-redis-python
@app.route('/send',  methods=['POST'])
def send():
    if request.method == 'POST':
        content = request.json
        print("Downloading the file..")
        print(f"url: {content['url']}")
        print(f"gdrive: {content['gdrive']}")
        # print(f"email: {content['email']}")
        job = q.enqueue(
            downloader.downloadFile, 
            app.config['TOKENPATH'], 
            app.config['CREDENTIALSPATH'], 
            content['url'],
            app.config['UPLOADSPATH'] + "/grzegorz.kossakowski@gmail.com"
        )
        q.enqueue(workerProcessImage,depends_on=job)
    return jsonify({'feedback': 'SUCCESS :)'})


@app.route('/render',  methods=['POST'])
def render():
    if request.method == 'POST':
        content = request.json
        print("Rendering..")
        redis_conn = Redis()
        q = Queue(connection=redis_conn)  # no args implies the default queue
        job = q.enqueue(workHard, job_timeout='1h')
    return jsonify({'feedback': 'SUCCESS :)'})

@app.route('/')
def index():
    return "Welcome to Membrane Dispatcher."
