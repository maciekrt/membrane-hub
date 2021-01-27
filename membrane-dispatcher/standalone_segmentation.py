import dispatcher
# import logging
import config
from processing import datasets_processing
from pathlib import Path
from rq import Queue, Retry, get_current_job
from redis import Redis
from tqdm import tqdm
from standalone_processing import compute_segmentation, render_segmentation, copy_segmentations


# logger = logging.getLogger('standalone_segmentation')
# logger.setLevel(logging.DEBUG)
# # formatter = logging.Formatter(
# #     '%(asctime)s | %(levelname)-8s | %(name)s.%(funcName)s: %(message)s')
# ch = logging.StreamHandler()
# ch.setLevel(logging.DEBUG)
# # ch.setFormatter(formatter)
# logger.addHandler(ch)

redis_conn = Redis()
queue_dispatcher_high = Queue(config.QUEUE_NAME_HIGH, connection=redis_conn,
                              default_timeout=3600)  # no args implies the default queue
queue_dispatcher_default = Queue(config.QUEUE_NAME_DEFAULT, connection=redis_conn,
                                 default_timeout=3600)  # no args implies the default queue
queue_dispatcher_low = Queue(config.QUEUE_NAME_LOW, connection=redis_conn,
                             default_timeout=3600)  # no args implies the default queue


def main():
    name = "a.magalska@nencki.edu.pl"
    base_path = Path(config.IMAGESPATH) / name
    print(f"I'm running: {base_path}.")
    for dataset in tqdm(base_path.iterdir()):
        if dataset.is_dir() and dataset.stem != 'scratchpad':
            metadata = datasets_processing.load_metadata(dataset)
            if 'source' in metadata.keys():
                print(f"Source is present. Processing {dataset}.")
                file_path = Path(metadata['source'])
                compute_job = queue_dispatcher_low.enqueue(
                    compute_segmentation,
                    file_path,
                    job_timeout='60m',
                    result_ttl=86400
                )
                render_job = queue_dispatcher_default.enqueue(
                    render_segmentation,
                    file_path,
                    depends_on=compute_job
                )
                queue_dispatcher_high.enqueue(
                    copy_segmentations,
                    dataset,
                    depends_on=render_job,
                    at_front=True
                )


if __name__ == '__main__':
    main()
