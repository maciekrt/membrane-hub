# import logging
import config
from processing import datasets_processing
from pathlib import Path
from rq import Queue, Retry, get_current_job
from redis import Redis
from tqdm import tqdm
import standalone_processing

# logger = logging.getLogger('standalone_segmentation')
# logger.setLevel(logging.DEBUG)
# # formatter = logging.Formatter(
# #     '%(asctime)s | %(levelname)-8s | %(name)s.%(funcName)s: %(message)s')
# ch = logging.StreamHandler()
# ch.setLevel(logging.DEBUG)
# # ch.setFormatter(formatter)
# logger.addHandler(ch)

redis_conn = Redis(host="hubbox", port=6379)
queue_dispatcher_high = Queue(config.QUEUE_NAME_HIGH, connection=redis_conn,
                              default_timeout=3600)  # no args implies the default queue
queue_dispatcher_default = Queue(config.QUEUE_NAME_DEFAULT, connection=redis_conn,
                                 default_timeout=3600)  # no args implies the default queue
queue_dispatcher_low = Queue(config.QUEUE_NAME_LOW, connection=redis_conn,
                             default_timeout=3600)  # no args implies the default queue
queue = Queue("gpuboxWorkers", connection=redis_conn, default_timeout=3600)  
queueHigh = Queue("gpuboxWorkersHigh", connection=redis_conn, default_timeout=3600)

results_path_remote = Path("/home/membrane/coding/membrane-hub/tmp/results")
downloads_path_remote = Path(
    "/home/membrane/coding/membrane-hub/tmp/downloads")
segm_notebook_filename = 'run_cellpose_GPU_membrane_3d.ipynb'
# segm_notebook_filename = 'run_cellpose_GPU_membrane_conv.ipynb'
bucket_name = "membranehubbucket"


configs_for_segmentations = [
{
    "notebook_name": "run_cellpose_GPU_membrane_3d.ipynb",
    "rendering_mode": "outlines",
    "modifier": "",
    "mode": "outlines"
},
{
    "notebook_name": "run_cellpose_GPU_membrane_conv.ipynb",
    "rendering_mode": "outlines",
    "modifier": "_conv_clipped",
    "mode": "outlines_conv_clipped"
}]


def main():
    name = "a.magalska@nencki.edu.pl"
    base_path = Path(config.IMAGESPATH) / name
    # Already downloaded
    downloaded_remotely = False
    print(f"I'm running: {base_path}.")
    # test = [Path("/home/ubuntu/Projects/data/images/m.zdanowicz@gmail.com/FISH1_BDNF488_1_cLTP_1_CA_origina_Dec1.czi")]
    # for dataset in test:
    # test = [Path("/home/ubuntu/Projects/data/images/m.zdanowicz@gmail.com/") / name for name in test_names]
    
    for dataset in tqdm(base_path.iterdir()):
        if dataset.is_dir() and dataset.stem != 'scratchpad':
            metadata = datasets_processing.load_metadata(dataset)
            if 'source' in metadata.keys():
                image_path = Path(metadata['source'])
                remote_path = downloads_path_remote / image_path.name
                # Upload flattens the whole directory structure just keeping names.
                for config_segm in configs_for_segmentations:
                    if metadata[config_segm['mode']] == False:
                        print(f"{config_segm['mode']} for {dataset} requires work..")
                        kwargs_additional = {}
                        if not downloaded_remotely:
                            upload_job = queue_dispatcher_high.enqueue(
                                standalone_processing.upload_file_to_s3,
                                bucket_name,
                                image_path
                            )
                            download_job = queueHigh.enqueue(
                                standalone_processing.download_file_from_s3,
                                bucket_name,
                                image_path.name,
                                remote_path,
                                depends_on=upload_job
                            )
                            kwargs_additional = {'depends_on': download_job}
                        # Computing segmentations remotely
                        compute_job = queue.enqueue(
                            standalone_processing.compute_segmentation,
                            config_segm['notebook_name'],
                            remote_path,
                            job_timeout='60m',
                            result_ttl=86400,
                            **kwargs_additional
                        )
                        # Copying the result to the right folder remotely
                        s3_upload = queueHigh.enqueue(
                            standalone_processing.finalize_segmentation_remotely,
                            bucket_name,
                            depends_on=compute_job
                        )
                        finalize_job = queue_dispatcher_high.enqueue(
                            standalone_processing.finalize_locally,
                            bucket_name,
                            Path(config_segm.SEGMENTATIONPATH) / name,
                            depends_on=s3_upload
                        )
                        render_job = queue_dispatcher_default.enqueue(
                            standalone_processing.render_segmentation,
                            image_path,
                            rendering_mode=config_segm['rendering_mode'],
                            modifier=config_segm['modifier'],
                            depends_on=finalize_job
                        )
                        queue_dispatcher_high.enqueue(
                            standalone_processing.copy_renderings,
                            dataset,
                            mode=config['mode'],
                            depends_on=render_job,
                            at_front=True
                        )


if __name__ == '__main__':
    main()
