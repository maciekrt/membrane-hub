
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

print("Let's work!!")
for i in range(3):
    print(f"Let's work a bit more {i} :)")
    queue.enqueue(worker.play, i)
    