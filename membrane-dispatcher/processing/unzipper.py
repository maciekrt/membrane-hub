import zipfile 
from pathlib import Path

path = Path("./dataset.zip")
dest = Path("./")
dest_dataset = Path("./dataset")

exts = ['.czi', '.lsm']

def unzip_dataset(path, dest):
   """
   Unzip file {path} into {dest}.
   path: Path 
   dest: Path
   """
   with zipfile.ZipFile(str(path), 'r') as zip_ref:
      zip_ref.extractall(str(dest))

def recurse_dataset(path):
   listFiles = []
   def _recurse(path):
      childDirs = [x for x in path.iterdir() if x.is_dir()]
      # Ignoring hidden files (MacOS creates hidden files while zipping)
      childFiles = [x for x in path.iterdir() if x.is_file() and x.suffix in exts 
         and not x.name.startswith(".")]
      listFiles.extend(childFiles)
      print(f"{path}: {childFiles}")
      for folder in childDirs:
         _recurse(folder)
   _recurse(path)
   return listFiles

# print(f"Extracting {path} to {dest}.")
# # unzipDataset(path, dest)
# res = recurseDataset(destDataset)
# print(f"Result: {res}")
