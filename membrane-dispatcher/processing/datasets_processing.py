import json
from pathlib import Path
import hashlib
import shutil

import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


"""
Here's some information about metadata.json for a dataset (i.e. a folder in images)
It contains the following field:
    z: int | the size of z dimension or number of images in a 2D dataset
    channels: int | number of channels
    images: list of str
    dims: "2D" / "3D" | two or three dimensional>
    sources: str or list of str | list of str if dataset is in scratchpad mode
    active: bool | is the set active or is it a a mock placeholder   
    masked: bool
    masked3d: bool
"""
def load_metadata(path_dataset):
    """
    Load the metadata of the dataset included in path_dataset.
    """
    try:
        with open(path_dataset / "metadata.json", 'r') as in_file:
            data = json.load(in_file)
            return data
    except:
        raise "datasets_processing.load_metadata: Unexpected error :/"
    return None


def save_metadata(path_dataset, metadata):
    """
    Save the metadata of the dataset path_dataset.
    """
    with open(path_dataset / "metadata.json", 'w') as out_file:
        json.dump(metadata, out_file)


# TODO Write docstring here.
def initialize_dataset(path_dataset, z=0, channels=1, dims="2D", source="", images=[]):
    path_dataset.mkdir(exist_ok=True)
    metadata = {'active': False, 'z': z, 'channels': channels,
                'dims': dims, 'masked': False, 'masked3d': False}
    metadata['source'] = source
    metadata['images'] = [str(n) for n in range(z)]
    save_metadata(path_dataset, metadata)
    return metadata


def initialize_mock(path_datasets, url):
    """Initializing a mock dataset. Returning its path along with
    temporary metadata.
    """
    print(f"initialize_mock: {path_datasets} {url}")
    hashed_name = hashlib.sha224(url.encode('utf-8')).hexdigest()
    path = path_datasets / hashed_name
    path.mkdir(exist_ok=True)
    metadata_mock = {"url": url, "active": False}
    save_metadata(path, metadata_mock)
    return path, metadata_mock


def finalize_mock(path_dataset):
    print(f"datasets_processing.finalize_mock: {path_dataset}")
    shutil.rmtree(str(path_dataset), ignore_errors=True)


# TODO Write docstring here
def extend_dataset(list_files, metadata):
    """
    Extending the data 
    """
    metadata['images'].extend(list_files)
    metadata['z'] += len(list_files)


def populate_dataset(path_dataset, path_output_rendered, segmentation=False):
    """Copies the rendered images to the dataset's folder.

    Keyword arguments:
    path_dataset: Path -- path to the dataset
    path_output_rendered -- path to the result of rendering
    """
    print(f"datasets_processing.populate_dataset[segmentation = {segmentation}]: Copying data "
          f"from {path_output_rendered} to {path_dataset}.")
    shutil.copytree(
        src=path_output_rendered,
        dst=path_dataset,
        dirs_exist_ok=True
    )


def add_outline(img_filename, outline_filename, metadata):
    """
    Metadata processing when masks are rendered
    """
    metadata['outlines'][img_filename] = outline_filename


# path = Path("/home/ubuntu/Projects/data/images/m.zdanowicz@gmail.com/default")
# metadata = initialize_dataset()
# save_metadata(path, metadata)
# names = propose_names(10, metadata)
# print(f"names: {names}")
# extend_dataset(names, metadata)
# save_metadata(path, metadata)
