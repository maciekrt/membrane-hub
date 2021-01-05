import json
from pathlib import Path
import hashlib
import shutil


"""
Here's some information about metadata.json for a dataset (i.e. a folder in images)
It contains the following field:
    z: int | the size of z dimension or number of images in a 2D dataset
    channels: int | number of channels
    images: list of str
    dims: "2D" / "3D" | two or three dimensional>
    sources: str or list of str | list of str if dataset is in scratchpad mode
    active: bool | is the set active or is it a a mock placeholder   
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
        print('Unexpected error :/')
    return None


def save_metadata(path_dataset, metadata):
    """
    Save the metadata of the dataset path_dataset.
    """
    with open(path_dataset / "metadata.json", 'w') as out_file:
        json.dump(metadata, out_file)


def initialize_dataset(path_dataset, z=0, channels=1, dims="2D", sources=[], images=[]):
    path_dataset.mkdir()
    metadata = {'active': False, 'z': z, 'channels': channels, 'dims': dims}
    metadata['sources'] = []
    metadata['images'] = []
    save_metadata(path_dataset, metadata)
    return metadata


def initialize_mock(path_datasets, url):
    """
    Initializing a mock dataset. Returning its path along with
    temporary metadata.
    """
    print(f"initialize_mock: {path_datasets} {url}")
    hashed_name = hashlib.sha224(url.encode('utf-8')).hexdigest()
    path = path_datasets / hashed_name
    path.mkdir()
    metadata_mock = {"url": url, "active": False}
    save_metadata(path, metadata_mock)
    return path, metadata_mock


def finalize_mock(path):
    print(f"finalize_mock: {path}")
    shutil.rmtree(str(path), ignore_errors=True)


def propose_names(num, metadata, files=None):
    """
    Propose the names for the extension of the dataset.  
    Currently, we are just increasing numbers (but we might be taking care of the 
    actual names and other image level metadata).
    """
    z = 0
    if metadata['active']:
        z = metadata['z']
    return [str(x) for x in range(z, z+num)]


def extend_dataset(list_files, metadata):
    """
    Extending the data 
    """
    metadata['images'].extend(list_files)
    metadata['z'] += len(list_files)


def add_masks(metadata):
    """
    Metadata processing when masks are rendered
    """
    pass


# path = Path("/home/ubuntu/Projects/data/images/m.zdanowicz@gmail.com/default")
# metadata = initialize_dataset()
# save_metadata(path, metadata)
# names = propose_names(10, metadata)
# print(f"names: {names}")
# extend_dataset(names, metadata)
# save_metadata(path, metadata)
