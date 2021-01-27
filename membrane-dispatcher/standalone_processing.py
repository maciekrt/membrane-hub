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

segm_notebook_filename = 'run_cellpose_GPU_membrane_conv.ipynb'


def compute_segmentation(input_path_czi):
    print("Computing segmentation..")
    notebook_file_name = segm_notebook_filename
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


def render_segmentation(source_image_path):
    current_job = get_current_job()
    job = current_job.dependency
    segmentation_path, _ = job.result
    print(f"Rendering {source_image_path} with masks {segmentation_path}.")
    renderer = ImageRenderer(source_image_path, segmentation_path)
    image_data = renderer.prepare_canvas()
    rendered_output = renderer.render(
        rendering_mode='mask 3D',
        filename_modifier="_conv_clipped",
        scales=[1],
        sizes=[(100, 100)]
    )
    datasets_processing.populate_dataset(
        dataset, rendered_output['output_path'])
    metadata = datasets_processing.load_metadata(dataset)
    metadata['mask_3D_conv_clipped'] = True
    datasets_processing.save_metadata(dataset, metadata)
