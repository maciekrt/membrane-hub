from pathlib import Path
from processing import datasets_processing
import os
from tqdm import tqdm

path = Path("/home/ubuntu/Projects/data/images")
email = "m.zdanowicz@gmail.com"
base_path = path / email

states = { "outlines_conv_clipped": "outlines_conv_clipped",
           "mask_3D_conv_clipped": "masked3d_conv_clipped",
           "masked3d": "_masked3d_x1",
           "outlines": "outlines_x1"}

for dataset in base_path.iterdir():
    if dataset.is_dir() and dataset.stem != 'scratchpad':
        # print(dataset)
        metadata = datasets_processing.load_metadata(dataset)
        # print(metadata)
        # Contain "outlines_conv_clipped"
        for state in states.keys():
            flag = False
            metadata[state] = False
            for file in (dataset / "0").iterdir():
                if states[state] in str(file):
                    # print(file)
                    flag = True
            if flag:
                print(f"Correcting metadata for {state} and file {dataset}.")
                metadata[state] = True
                datasets_processing.save_metadata(dataset, metadata)