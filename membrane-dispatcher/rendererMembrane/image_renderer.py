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

from cellpose import utils


class ImageRenderer(object):

    def __init__(self, file_path, mask_path):
        """Constructor of a ImageRenderer. 

        Keyword arguments:
        file_path: Path -- input image path
        mask_path: Path -- input masks path
        """
        self.viewer = ViewerModel()
        self.headless_renderer = HeadlessRenderer(self.viewer)
        print("Headless Renderer instantiated..")
        self.file_path = file_path
        if mask_path:
            self.mask_path = mask_path
        else:
            self.mask_path = None
        # Everything will be rendered to temp
        # and can be then moved to the right place
        # determined by the dataset logic.
        tmpDir = tempfile.mkdtemp()
        os.chmod(tmpDir, 0o775)
        self.result_path = Path(tmpDir)

    def load_data(self, path_image):
        n = len(self.viewer.layers)
        if path_image.suffix == '.czi':
            data = AICSImage(str(path_image)).data
        else:
            self.viewer.open(str(path_image), layer_type='image')
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
        if path_image.suffix == '.lsm':
            data = np.moveaxis(data, 0, 1)
        print(f"load_data[shape, end]: {data.shape}")
        return data

    def load_segm(self, path_mask):
        if path_mask.suffix == '.npy':
            mask = np.load(path_mask)
        else:
            n = len(self.viewer.layers)
            self.viewer.open(str(path_mask))
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

    # def render(self, rendering_mode='image only', filename_modifier="", **kwargs):
    #     """Rendering the file.  The output is saved to a temporary 
    #     directory which is returned along with some metadata.

    #     Keyword arguments:
    #     rendering_mode --  'image only' / 'mask 2D' / 'mask 3D'
    #     **kwargs -- scales and sizes for the renderer. For example
    #         scales = [1,2], sizes = [(100,100)] makes the function
    #         render the images in the original size, magnified 2 times 
    #         and with 100x100 thumbnals.

    #     Returns:
    #     {
    #         z: int, 
    #         channels: int, 
    #         output_path: Path, 
    #         masked: bool
    #         masked3d: bool
    #     }
    #     """

    #     # The path for the results of the processing
    #     print(
    #         f"ImageRenderer.render: Processing {self.result_path} in mode {rendering_mode}..")
    #     assert (self.mask_path is not None) or (rendering_mode == 'image only')
        
    #     modifier = ""
    #     if rendering_mode == 'mask 2D':
    #         modifier = f"_masked{filename_modifier}"
    #     if rendering_mode == 'mask 3D':
    #         modifier = f"_masked{filename_modifier}"
    #     if rendering_mode == 'outlines':
    #         modifier = f"_outlines{filename_modifier}"

    #     # Iterated channels and z
    #     for c in tqdm(list(range(self.channels))):
    #         for z in tqdm(list(range(self.z))):
    #             # There are some iterable dims
    #             self.viewer.dims.set_point(0, c)
    #             self.viewer.dims.set_point(1, z)
    #             # Unmasked
    #             result_name = str(z)
    #             if rendering_mode == 'image only':
    #                 img = self.headless_renderer.render()
    #                 # This renders all the sizes and scales provided in **kwargs
    #                 self.save(img, result_name+f"{filename_modifier}", folders=str(c), **kwargs)
    #             # rendering_mode
    #             if rendering_mode == 'mask 2D':
    #                 result_masked_name = (
    #                     result_name + f"_masked{filename_modifier}")
    #                 self.viewer.layers[1].visible = True
    #                 img = self.headless_renderer.render()
    #                 # This renders all the sizes and scales provided in **kwargs
    #                 self.save(img, result_masked_name,
    #                           folders=str(c), **kwargs)
    #             if rendering_mode == 'mask 3D':
    #                 result_masked3d_name = (result_name + f"_masked3d{filename_modifier}")
    #                 self.viewer.layers[1].visible = True
    #                 img = self.headless_renderer.render()
    #                 # This renders all the sizes and scales provided in **kwargs
    #                 self.save(img, result_masked3d_name,
    #                           folders=str(c), **kwargs)
    #     print("ImageRenderer.render: Done.")
    #     # Returning some metadata
    #     result_metadata = {
    #         'masked': (self.mask_path is not None) and rendering_mode == 'mask 2D',
    #         'masked3d': (self.mask_path is not None) and rendering_mode == 'mask 3D',
    #         'z': self.z,
    #         'channels': self.channels,
    #         'output_path': self.result_path
    #     }
    #     return result_metadata
    
    def render(self, rendering_mode='image only', filename_modifier="", **kwargs):
        """Rendering the file.  The output is saved to a temporary 
        directory which is returned along with some metadata.

        Keyword arguments:
        rendering_mode --  'image only' / 'mask 2D' / 'mask 3D'
        **kwargs -- scales and sizes for the renderer. For example
            scales = [1,2], sizes = [(100,100)] makes the function
            render the images in the original size, magnified 2 times 
            and with 100x100 thumbnals.

        Returns:
        {
            z: int, 
            channels: int, 
            output_path: Path, 
            masked: bool
            masked3d: bool
        }
        """

        # The path for the results of the processing
        print(
            f"ImageRenderer.render: Processing {self.result_path} in mode {rendering_mode}..")
        assert (self.mask_path is not None) or (rendering_mode == 'image only')
        
        modifier = ""
        if rendering_mode == 'mask 2D':
            self.viewer.layers[1].visible = True
            modifier = f"_masked{filename_modifier}"
        if rendering_mode == 'mask 3D':
            self.viewer.layers[1].visible = True
            modifier = f"_masked3d{filename_modifier}"
        if rendering_mode == 'outlines':
            self.viewer.layers[1].opacity = 1
            self.viewer.layers[1].visible = True
            modifier = f"_outlines{filename_modifier}"
            masks = self.viewer.layers[1].data[0]
            outlines = utils.masks_to_outlines(masks)
            outZ, outY, outX = np.nonzero(outlines)
            self.viewer.layers[1].data[...] = 0
            for i in range(-1,1,1):
                for j in range(-1,1,1):
                    idY = np.maximum(0,np.minimum(outY+i,masks.shape[-2]))
                    idX = np.maximum(0,np.minimum(outX+j,masks.shape[-1]))
                    self.viewer.layers[1].data[...,outZ, idY, idX] = 19

        # Iterated channels and z
        for c in tqdm(list(range(self.channels))):
            for z in tqdm(list(range(self.z))):
                # There are some iterable dims
                self.viewer.dims.set_point(0, c)
                self.viewer.dims.set_point(1, z)
                # Unmasked
                result_name = f"{z}{modifier}"
                img = self.headless_renderer.render()
                # This renders all the sizes and scales provided in **kwargs
                self.save(img, result_name, folders=str(c), **kwargs)
        print("ImageRenderer.render: Done.")
        # Returning some metadata
        result_metadata = {
            'masked': (self.mask_path is not None) and rendering_mode == 'mask 2D',
            'masked3d': (self.mask_path is not None) and rendering_mode == 'mask 3D',
            'outlines': (self.mask_path is not None) and rendering_mode == 'outlines',
            'z': self.z,
            'channels': self.channels,
            'output_path': self.result_path
        }
        return result_metadata


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
        "/home/ubuntu/Projects/data/uploads/grzegorz.kossakowski@gmail.com/FISH1_BDNF488_1_cLTP_3_CA-gkk FISH1_BDNF488_1_cLTP_2_CA-gkk/FISH1_BDNF488_1_cLTP_2_CA-gkk.czi")
    path_mask = Path(
        "/home/ubuntu/Projects/data/segmentation/grzegorz.kossakowski@gmail.com/masks_3D_conv_clipped_FISH1_BDNF488_1_cLTP_2_CA-gkk.npy")
    path_result = Path("/home/ubuntu/Projects/data/images/example/")

    renderer = ImageRenderer(path_file, path_mask)
    metadata = renderer.prepare_canvas()
    print(f"metadata1: {metadata}")
    rendered_output = renderer.render_outlines(
        rendering_mode='outlines', scales=[1], sizes=[])
    print(f"metadata2: {rendered_output}")

# '0.4.1a2.dev24+gc278fb4'
# It's working with the following commit ab1e371cb132201347a87be64314fbbe6c2f8b29
# processImage(
#     "/home/ubuntu/Projects/data/uploads/example/image.lsm",
#     "/home/ubuntu/Projects/data/uploads/example/segmentation.tif",
#     "/home/ubuntu/Projects/data/images/example/",
#     scales = [1,2],
#     sizes=[(100,100)]
# )
