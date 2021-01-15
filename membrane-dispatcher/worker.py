import sys
from rq import Connection, Worker
from redis import Redis
import config

# Infinite loop problems with PM2
# https://github.com/Unitech/PM2/issues/821
# Provide queue names to listen to as arguments to this script,
# similar to rq worker
queues = [config.QUEUE_NAME_HIGH,
          config.QUEUE_NAME_DEFAULT,
          config.QUEUE_NAME_LOW]

redis = Redis()
with Connection(redis):
    w = Worker(queues, connection=redis)
    w.work()
