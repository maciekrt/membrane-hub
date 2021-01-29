# from rendererMembrane import ImageRenderer
from segmentation import run_segmentation
# import logging
import tempfile
import os
import config
from processing import datasets_processing
from pathlib import Path
from rq import Queue, Retry, get_current_job
from redis import Redis
import shutil
import boto3


def download_remotely(bucket_name, downloads_path, file_name):
    print(f"Downloading.. small_czi/{file_name}")
    s3_resource = boto3.resource('s3')
    s3_resource.Object(bucket_name, "small_czi/" + file_name).download_file(str(downloads_path / file_name))
    print(f"Done.. {file_name}")


def compute_segmentation(notebook_file_name, input_path_czi):
    print("Computing segmentation..")
    print(f"Schedule jupyter notebook run: {notebook_file_name}.")
    notebook_path = Path('./segmentation/') / notebook_file_name
    assert notebook_path.is_file() and notebook_path.exists, notebook_path
    basedir_out = tempfile.mkdtemp()
    os.chmod(basedir_out, 0o775)
    # segmentation_path_npy = '/home/ubuntu/Projects/data/segmentation/m.zdanowicz@gmail.com/masks_2D_stitched_FISH3_BDNF488_7_cLTP_romi_4_CA.npy'
    # trace_path = './'
    segmentation_path_npy, trace_path = run_segmentation.main(notebook_path,
                                                              basedir_out,
                                                              str(input_path_czi))
    # run_segmentation.main now works with strings instead of paths!
    return Path(segmentation_path_npy), Path(trace_path)


def finalize_segmentation_remotely(result_dir):
    current_job = get_current_job()
    job = current_job.dependency
    segmentation_path, trace_path = job.result
    segmentation_trace_path = result_dir / segmentation_path.name
    segmentation_output_path = result_dir / trace_path.name
    print(
        f"Copying segmentation trace from {trace_path} to {segmentation_trace_path}.")
    shutil.copy(trace_path, segmentation_trace_path)
    print(
        f"Copying segmentation .npy from {segmentation_path} to {segmentation_output_path}.")
    shutil.copy(segmentation_path, segmentation_output_path)


# def render_segmentation(source_image_path):
#     current_job = get_current_job()
#     job = current_job.dependency
#     segmentation_path, _ = job.result
#     print(f"Rendering {source_image_path} with masks {segmentation_path}.")
#     renderer = ImageRenderer(source_image_path, segmentation_path)
#     image_data = renderer.prepare_canvas()
#     rendered_output = renderer.render(
#         rendering_mode='mask 3D',
#         filename_modifier="_conv_clipped",
#         scales=[1],
#         sizes=[(100, 100)]
#     )
#     return rendered_output
    
    
# def copy_renderings(dataset):
#     current_job = get_current_job()
#     job = current_job.dependency
#     rendered_output = job.result
#     datasets_processing.populate_dataset(
#         dataset, rendered_output['output_path'])
#     metadata = datasets_processing.load_metadata(dataset)
#     metadata['mask_3D_conv_clipped'] = True
#     datasets_processing.save_metadata(dataset, metadata)
