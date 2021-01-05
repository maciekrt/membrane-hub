import itertools
from pathlib import Path
import tempfile
import shutil
import os
from tqdm import tqdm

import numpy as np
from PIL import Image
from skimage import data, color
import skimage.transform as transform  # rescale, resize, downscale_local_mean
from aicsimageio import AICSImage

import napari
from napari.components import ViewerModel
from .headless_renderer import HeadlessRenderer
import vispy.io as io
from vispy import app
app.use_app('osmesa')


class ImageRenderer(object):
    """
    Parameters:
    file_path: str
    result_path: str

    Attributes:
    viewer: ViewerModel 
        ...
    """

    def __init__(self, file_path, mask_path):
        self.viewer = ViewerModel()
        self.headless_renderer = HeadlessRenderer(self.viewer)
        print("Headless Renderer instantiated..")
        self.file_path = Path(file_path)
        if mask_path:
            self.mask_path = Path(mask_path)
        else:
            self.mask_path = None
        # Everything will be rendered to temp
        # and can be then moved to the right place
        # determined by the dataset logic.
        tmpDir = tempfile.mkdtemp()
        os.chmod(tmpDir, 0o775)
        self.result_path = Path(tmpDir)

    def __del__(self):
        # Remove temp dir mate
        shutil.rmtree(str(self.result_path), ignore_errors=True)

    def load_data(self, name):
        n = len(self.viewer.layers)
        if name.suffix == '.czi':
            data = AICSImage(str(name)).data
        else:
            self.viewer.open(str(name), layer_type='image')
            data = self.viewer.layers[n].data
            self.viewer.layers.pop(n)
        d = len(data.shape)
        print(f"load_data[shape, start]: {data.shape}")
        # Reducing to 4 dimensions (CZYX).
        # This is an arbitrary choice if the S (scene) or T (time) dimension
        # is non-trivial, we just use the first frames.
        if d == 7:
            if data.shape[0] > 1:
                print(f"load_data[data.shape[0]]: Equal to {data.shape[0]}.")
            if data.shape[1] > 1:
                print(f"load_data[data.shape[1]]: Equal to {data.shape[1]}.")
            if data.shape[2] > 1:
                print(f"load_data[data.shape[2]]: Equal to {data.shape[2]}.")
            data = data[0, 0, 0, ...]
        if d == 6:
            if data.shape[0] > 1:
                print(f"load_data[data.shape[0]]: Equal to {data.shape[0]}.")
            if data.shape[1] > 1:
                print(f"load_data[data.shape[1]]: Equal to {data.shape[1]}.")
            data = data[0, 0, ...]
        if d == 5:
            if data.shape[0] > 1:
                print(f"load_data[data.shape[0]]: Equal to {data.shape[0]}.")
            data = data[0, ...]
        # .lsm requires transposing it is in (TZCYX) format.
        if name.suffix == '.lsm':
            data = np.moveaxis(data, 0, 1)
        print(f"load_data[shape, end]: {data.shape}")
        return data

    def load_segm(self, name):
        if name.suffix == '.npy':
            mask = np.load(name)
        else:
            n = len(self.viewer.layers)
            self.viewer.open(str(name))
            data = self.viewer.layers[n].data
            self.viewer.layers.pop(n)
            if len(data.shape) == 4:
                print(f"load_segm[data.shape[0]]: Equal to {data.shape[0]}.")
                mask = data[0, ...]
            print(f"load_segm[shape]: {mask.shape}")
        return mask

    def prepare_canvas(self):
        """
        Prepare canvas and return z and number of channels.
        This is the core of the processing work.
        """
        # Image
        data_image = self.load_data(self.file_path)
        self.viewer.add_image(data_image, colormap='turbo')
        # Mask
        self.channels, self.z = data_image.shape[:2]
        if self.mask_path:
            data = self.load_segm(self.mask_path)
            data_mask = np.repeat(data[None, ...], self.channels, axis=0)
            self.viewer.add_labels(data_mask, name="segmentation")
            self.viewer.layers[1].visible = False
        # self.viewer.dims.ndisplay = 2
        size = self.viewer.layers[0].extent.data[1].astype(np.int64)[::-1]
        self.headless_renderer.canvas.size = 1 + size
        self.headless_renderer.camera.zoom = 1.0
        return {'channels': self.channels, 'z': self.z}

    def save(self, img, name_base, folders="", scales=[1], sizes=[]):
        path_base = self.result_path / folders
        path_base.mkdir(parents=True, exist_ok=True)
        for scale in scales:
            name = f"{name_base}_x{scale}.png"
            path = path_base / name
            img_rescaled = transform.rescale(img, 1/scale, anti_aliasing=True,
                                             preserve_range=True, multichannel=True)
            io.write_png(str(path), img_rescaled.astype(np.uint8))
        for size in sizes:
            x, y = size
            name = f"{name_base}_{x}x{y}.png"
            path = path_base / name
            imgResized = transform.resize(img, size, anti_aliasing=True,
                                          preserve_range=True)
            io.write_png(str(path), imgResized.astype(np.uint8))

    
    # TODO Change possible values for rendering_mode
    def process(self, names, rendering_mode='no', **kwargs):
        """Process 
        
        Keyword arguments:
        file_path: Path -- path to the file
        names -- list of names for consecutive layers
        rendering_mode -- 'yes' / 'no' / 'both'
        """ 
        
        # The path for the results of the processing
        print(f"process: Processing {self.result_path}..")
        assert (self.mask_path is not None) or (rendering_mode == 'no')

        # Iterated channels and z
        for c in tqdm(list(range(self.channels))):
            for z in tqdm(list(range(self.z))):
                result_name = names[z]
                result_masked_name = (result_name + "_masked")
                # There are some iterable dims
                self.viewer.dims.set_point(0, c)
                self.viewer.dims.set_point(1, z)
                # Unmasked
                if rendering_mode in ['no', 'both']:
                    img = self.headless_renderer.render()
                    # This renders all the sizes and scales provided in **kwargs
                    self.save(img, result_name, folders=str(c), **kwargs)
                # rendering_mode
                if rendering_mode in ['yes', 'both']:
                    self.viewer.layers[1].visible = True
                    img = self.headless_renderer.render()
                    # This renders all the sizes and scales provided in **kwargs
                    self.save(img, result_masked_name,
                              folders=str(c), **kwargs)
        print("Done.")
        # Returning some metadata
        result_metadata = {
            'masked': (self.mask_path is not None),
            'z': self.z, 
            'channels': self.channels
        }
        return result_metadata

    def copy_results(self, path_result):
        print(
            f"ImageRenderer.copy_results: Copying {self.result_path} to {path_result}"
        )
        shutil.copytree(self.result_path, path_result, dirs_exist_ok=True)


# def process_image(file_path, mask_path, result_path, scales=[1], sizes=[]):
#     """
#     file_path: file to render
#     mask_path: mask to be applied
#     result_path: folder where to put the result
#     """
#     tmpDir = tempfile.mkdtemp()
#     os.chmod(tmpDir, 0o775)
#     renderer = ImageRenderer(file_path, mask_path, tmpDir)
#     renderer.prepare_canvas()
#     # Returning metadata
#     metadata = renderer.process(scales=scales, sizes=sizes)
#     print(f"processImage: Moving from {tmpDir} to {result_path}.")
#     # TAKE A LOOK AT THAT
#     shutil.rmtree(result_path, ignore_errors=True)
#     shutil.move(tmpDir, result_path)
#     return metadata

def func():
    path_file = Path(
        "/home/ubuntu/Projects/data/uploads/manual-zip-download/FISH_BDNF_romi_CA/FISH1_BDNF488_10_DMSO_romi_4_CA.czi")
    path_mask = Path(
        "/home/ubuntu/tmp/masks_2D_stitched_FISH1_BDNF488_10_DMSO_romi_4_CA.npy")
    path_result = Path("/home/ubuntu/Projects/data/images/example/")

    renderer = ImageRenderer(path_file, None)
    metadata1 = renderer.prepare_canvas()
    print(f"metadata1: {metadata1}")
    names = [str(x) for x in range(metadata1['z'])]
    metadata2 = renderer.process(names=names, rendering_mode='no', scales=[1], sizes=[])
    print(f"metadata2: {metadata1}")
    renderer.copy_results(path_result)

# '0.4.1a2.dev24+gc278fb4'
# It's working with the following commit ab1e371cb132201347a87be64314fbbe6c2f8b29
# processImage(
#     "/home/ubuntu/Projects/data/uploads/example/image.lsm",
#     "/home/ubuntu/Projects/data/uploads/example/segmentation.tif",
#     "/home/ubuntu/Projects/data/images/example/",
#     scales = [1,2],
#     sizes=[(100,100)]
# )
