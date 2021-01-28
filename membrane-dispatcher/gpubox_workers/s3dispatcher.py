
from rq import Queue, Retry, get_current_job
from redis import Redis

import worker

import time
import sys
import pandas as pd
import json
import hashlib
from pathlib import Path
import shutil
import os

redis_conn = Redis(host="hubbox",port=6379)
queue = Queue("gpuboxWorkers", connection=redis_conn,
                         default_timeout=3600)  # no args implies the default queue

file_name = "FISH3_BDNF488_7_cLTP_romi_4_CA.czi"

if __name__="__main__":
    print("Let's download remotely!!")
    queue.enqueue(worker.download, file_name)
    