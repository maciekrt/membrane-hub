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
    filepath: str
    resultpath: str

    Attributes:
    viewer: ViewerModel 
        ...
    """

    def __init__(self, filepath, maskpath, resultpath):
        self.viewer = ViewerModel()
        self.headlessRenderer = HeadlessRenderer(self.viewer)
        print("Headless Renderer instantiated..")
        self.filepath = Path(filepath)
        if maskpath:
            self.maskpath = Path(maskpath)
        else:
            self.maskpath = None
        self.resultpath = Path(resultpath)

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
            data = data[0,...]
        # .lsm requires transposing it is in (TZCYX) format.
        if name.suffix == '.lsm':
            data = np.moveaxis(data,0,1)
        print(f"load_data[shape, end]: {data.shape}")
        return data

    def load_segm(self, name):
        n = len(self.viewer.layers)
        self.viewer.open(str(name))
        data = self.viewer.layers[n].data
        self.viewer.layers.pop(n)
        if len(data.shape) == 4:
            print(f"load_segm[data.shape[0]]: Equal to {data.shape[0]}.")
            data = data[0,...]
        print(f"load_segm[shape]: {data.shape}")
        return data

    def prepareCanvas(self):
        """
        prepareCanvas
        """
        # Image
        dataImage = self.load_data(self.filepath)
        self.viewer.add_image(dataImage, colormap='turbo')
        # Mask
        self.channels, self.z = dataImage.shape[:2]
        if self.maskpath:
            data = self.load_segm(self.maskpath)
            dataMask = np.repeat(data[None, ...], self.channels, axis=0)
            self.viewer.add_labels(dataMask, name="segmentation")
            self.viewer.layers[1].visible = False
        # self.viewer.dims.ndisplay = 2
        size = self.viewer.layers[0].extent.data[1].astype(np.int64)[::-1]
        self.headlessRenderer.canvas.size = 1 + size
        self.headlessRenderer.camera.zoom = 1.0

    def save(self, img, nameBase, folders = "", scales=[1], sizes=[]):
        pathBase = self.resultpath / folders
        pathBase.mkdir(parents=True, exist_ok=True)
        for scale in scales:
            name = f"{nameBase}_x{scale}.png"
            path = pathBase / name
            imgRescaled = transform.rescale(img, 1/scale, anti_aliasing=True,
                                            preserve_range=True, multichannel=True)
            io.write_png(str(path), imgRescaled.astype(np.uint8))
        for size in sizes:
            x, y = size
            name = f"{nameBase}_{x}x{y}.png"
            path = pathBase / name
            imgResized = transform.resize(img, size, anti_aliasing=True,
                                            preserve_range=True)
            io.write_png(str(path), imgResized.astype(np.uint8))

    def process(self, **kwargs):
        """
        filepath: Path
        """
        # The path for the results of the processing
        print(f"process: Processing {self.resultpath}..")

        # Iterated channels and z
        for c in tqdm(list(range(self.channels))):
            for z in tqdm(list(range(self.z))):
                resName = str(z).zfill(2)
                resMaskedName = (resName + "_masked")
                # There are some iterable dims
                self.viewer.dims.set_point(0, c)
                self.viewer.dims.set_point(1, z)
                # Unmasked
                img = self.headlessRenderer.render()
                # print(f"Rendered {Path(folder) / resName}.")
                # This renders all the sizes and scales provided in **kwargs
                self.save(img, resName, folders=str(c), **kwargs)
                # Masked
                if self.maskpath:
                    self.viewer.layers[1].visible = True
                    img = self.headlessRenderer.render()
                    # print(f"Rendered {Path(folder) / resMaskedName}.")
                    # This renders all the sizes and scales provided in **kwargs
                    self.save(img, resMaskedName, folders=str(c), **kwargs)
        print("Done.")
        # Return the longest visualised dimension
        # Returning some metadata
        resultMetadata = {}
        resultMetadata['masked'] = not (self.maskpath is None)
        resultMetadata['z'] = self.z
        resultMetadata['channels'] = self.channels
        return resultMetadata


def processImage(filepath, maskpath, resultpath, scales = [1], sizes=[]):
    tmpDir = tempfile.mkdtemp()
    os.chmod(tmpDir, 0o775)
    renderer = ImageRenderer(filepath,maskpath,tmpDir)
    renderer.prepareCanvas()
    # Returning metadata
    metadata = renderer.process(scales=scales, sizes=sizes)
    print(f"processImage: Moving from {tmpDir} to {resultpath}.")
    # TAKE A LOOK AT THAT
    shutil.rmtree(resultpath, ignore_errors=True)
    shutil.move(tmpDir, resultpath)
    return metadata

# '0.4.1a2.dev24+gc278fb4'
# It's working with the following commit ab1e371cb132201347a87be64314fbbe6c2f8b29
# processImage(
#     "/home/ubuntu/Projects/data/uploads/example/image.lsm",
#     "/home/ubuntu/Projects/data/uploads/example/segmentation.tif",
#     "/home/ubuntu/Projects/data/images/example/",
#     scales = [1,2],
#     sizes=[(100,100)]
# )
