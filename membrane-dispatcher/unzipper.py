import zipfile 
from pathlib import Path

path = Path("./dataset.zip")
dest = Path("./")
destDataset = Path("./dataset")

exts = ['.czi', '.lsm']

def unzipDataset(path, dest):
   with zipfile.ZipFile(str(path), 'r') as zip_ref:
      zip_ref.extractall(str(dest))

def recurseDataset(path):
   listFiles = []
   def _recurse(path):
      childDirs = [x for x in path.iterdir() if x.is_dir()]
      childFiles = [x for x in path.iterdir() if x.is_file() and x.suffix in exts]
      listFiles.extend(childFiles)
      print(f"{path}: {childFiles}")
      for folder in childDirs:
         _recurse(folder)
   _recurse(path)
   return listFiles

print(f"Extracting {path} to {dest}.")
# unzipDataset(path, dest)
res = recurseDataset(destDataset)
print(f"Result: {res}")
