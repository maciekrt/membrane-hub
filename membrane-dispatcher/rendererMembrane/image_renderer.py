import itertools
from pathlib import Path
import tempfile
import shutil
from tqdm import tqdm

import numpy as np
from PIL import Image
from skimage import data, color
import skimage.transform as transform  # rescale, resize, downscale_local_mean

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

    def prepareCanvas(self):
        """
        prepareCanvas
        """
        # Image
        self.viewer.open(str(self.filepath),
                         layer_type='image', colormap='inferno')
        # Mask
        if self.maskpath:
            self.viewer.open(str(self.maskpath))
            data = np.expand_dims(self.viewer.layers[1].data,axis=0)
            dataMask = np.stack([data, data], axis=2)
            self.viewer.layers.pop(1)
            self.viewer.add_labels(dataMask, name="segmentation")
            self.viewer.layers[1].visible = False
        # self.viewer.dims.ndisplay = 2
        size = self.viewer.layers[0].extent.data[1].astype(np.int64)[::-1]
        self.headlessRenderer.canvas.size = 1 + size
        self.headlessRenderer.camera.zoom = 1.0

    def save(self, img, nameBase, folders = "", scales=[1], sizes=[]):
        pathFolders = Path(folders)
        pathBase = self.resultpath / folders
        pathBase.mkdir(parents=True, exist_ok=True)
        for scale in scales:
            name = f"{nameBase}_x{scale}.png"
            path = pathBase / name
            self.files.append(str(pathFolders / name))
            imgRescaled = transform.rescale(img, 1/scale, anti_aliasing=True,
                                            preserve_range=True, multichannel=True)
            io.write_png(str(path), imgRescaled.astype(np.uint8))
        for size in sizes:
            x, y = size
            name = f"{nameBase}_{x}x{y}.png"
            path = pathBase / name
            self.files.append(str(pathFolders / name))
            imgResized = transform.resize(img, size, anti_aliasing=True,
                                            preserve_range=True)
            io.write_png(str(path), imgResized.astype(np.uint8))

    def process(self, **kwargs):
        """
        filepath: Path
        """
        # The path for the results of the processing
        print(f"process: Processing {self.resultpath}..")
        print(f"process[dims]: {self.viewer.dims.nsteps}")

        dimZ = self.viewer.dims.nsteps[-4]
        dimChannels = self.viewer.dims.nsteps[-3]
        if len(self.viewer.dims.nsteps) == 5:
            dimTime = self.viewer.dims.nsteps[0]

        # Get all the iterable dimension (note it might be empty)
        iterableDims = [dim for dim in self.viewer.dims.not_displayed
                        if self.viewer.dims.nsteps[dim] > 1]
        iterableSizes = [self.viewer.dims.nsteps[dim] for dim in self.viewer.dims.not_displayed
                        if self.viewer.dims.nsteps[dim] > 1]
        # Generate the ranges for the iterable dimensions
        iterableLists = [list(range(self.viewer.dims.nsteps[dim]))
                         for dim in iterableDims]
        # Just a single element if no iterable dimension available
        folders, arg = [], 0
        if not iterableDims:
            iterableLists = [[0]]
        else:
            n = len(iterableSizes)
            arg = np.argmax(iterableSizes)
            folders = [x for x in range(n) if x != arg]

        # Iterated over all tuples of possible values in iterable dimensions
        self.files = []
        for elem in tqdm(list(itertools.product(*iterableLists))):
            suffix = str(elem[arg]).zfill(2)
            folder = "/".join([str(elem[i]).zfill(2) for i in folders])
            resName = suffix
            resMaskedName = (suffix + "_masked")
            # There are some iterable dims
            for i, dim in enumerate(iterableDims):
                self.viewer.dims.set_point(dim, elem[i])

            # Unmasked
            img = self.headlessRenderer.render()
            # print(f"Rendered {Path(folder) / resName}.")
            # This renders all the sizes and scales provided in **kwargs
            self.save(img, resName, folders=folder, **kwargs)
            # Masked
            if self.maskpath:
                self.viewer.layers[1].visible = True
                img = self.headlessRenderer.render()
                # print(f"Rendered {Path(folder) / resMaskedName}.")
                # This renders all the sizes and scales provided in **kwargs
                self.save(img, resMaskedName, folders=folder, **kwargs)
        print("Done.")
        # Return the longest visualised dimension
        # Returning some metadata
        resultMetadata = {}
        resultMetadata['masked'] = not (self.maskpath is None)
        resultMetadata['channels'] =  
        if not iterableDims:
            resultMetadata['z'] = 0
        else:  
            resultMetadata['z'] = np.max(iterableSizes)
        return resultMetadata


def processImage(filepath, maskpath, resultpath, scales = [1], sizes=[]):
    tmpDir = tempfile.mkdtemp()
    renderer = ImageRenderer(filepath,maskpath,tmpDir)
    renderer.prepareCanvas()
    # Returning metadata
    metadata = renderer.process(scales=scales, sizes=sizes)
    print(f"processImage: Moving from {tmpDir} to {resultpath}.")
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
