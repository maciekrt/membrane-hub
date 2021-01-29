from rendererMembrane import ImageRenderer
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

def upload_file_to_s3(bucket_name, file_path, result_path=None):
    # It's a bit ad hoc.. In particular we don't care about files being replaced on S3
    print(f"Uploading.. {file_path}")
    s3_resource = boto3.resource('s3')
    if result_path is None:
        s3_resource.meta.client.upload_file(str(file_path), bucket_name, file_path.name)
    else:
        s3_resource.meta.client.upload_file(str(file_path), bucket_name, str(result_path))
    print(f"Done.. {file_path}")


def download_file_from_s3(bucket_name, s3_path, result_path):
    print(f"Downloading.. {s3_path}")
    s3_resource = boto3.resource('s3')
    s3_resource.Object(bucket_name, str(s3_path)).download_file(str(result_path))
    print(f"Done.. {s3_path}")


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


def finalize_segmentation_remotely(bucket_name):
    current_job = get_current_job()
    job = current_job.dependency
    segmentation_path, trace_path = job.result
    print(
        f"Copying segmentation trace from {trace_path} to s3.")
    upload_file_to_s3(bucket_name, trace_path, Path("segmentation") / trace_path.name)
    print(
        f"Copying segmentation .npy from {segmentation_path} to s3.")
    upload_file_to_s3(bucket_name, segmentation_path, Path("segmentation") / segmentation_path.name)
    return Path("segmentation") / segmentation_path.name, Path("segmentation") / trace_path.name


def finalize_locally(bucket_name, local_path):
    current_job = get_current_job()
    job = current_job.dependency
    segmentation_path, trace_path = job.result
    download_file_from_s3(bucket_name,segmentation_path, local_path / segmentation_path.name)
    download_file_from_s3(bucket_name,trace_path, local_path / trace_path.name)
    return local_path / segmentation_path.name


def render_segmentation(source_image_path,mode):
    current_job = get_current_job()
    job = current_job.dependency
    segmentation_path = job.result
    print(f"Rendering {source_image_path} with masks {segmentation_path}.")
    renderer = ImageRenderer(source_image_path, segmentation_path)
    renderer.prepare_canvas()
    rendered_output = renderer.render(
        rendering_mode='outlines',
        filename_modifier="_conv_clipped",
        scales=[1],
        sizes=[(100, 100)]
    )
    return rendered_output
    
    
def copy_renderings(dataset):
    current_job = get_current_job()
    job = current_job.dependency
    rendered_output = job.result
    datasets_processing.populate_dataset(
        dataset, rendered_output['output_path'])
    metadata = datasets_processing.load_metadata(dataset)
    metadata['mask_3D_conv_clipped'] = True
    datasets_processing.save_metadata(dataset, metadata)
