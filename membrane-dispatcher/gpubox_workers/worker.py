import time
import boto3
from pathlib import Path

downloads_path = Path("/home/membrane/coding/membrane-hub/tmp/downloads")
results_path = Path("/home/membrane/coding/membrane-hub/tmp/results")
bucket_name = "membranehubbucket"

def download(file_name):
    print(f"Downloading.. {file_name}")
    s3_resource = boto3.resource('s3')
    s3_resource.Object(bucket_name, file_name).download_file(str(downloads_path / file_name))
    print(f"Done.. {file_name}")
            
# def make_bucket(name, acl):
#     s3_resource = boto3.resource('s3')
#     return s3_resource.create_bucket(Bucket="membranehubboto3test",
#                           CreateBucketConfiguration={'LocationConstraint': 'eu-central-1'})

if __name__=="__main__":
    file_name = "small_czi/FISH3_BDNF488_7_cLTP_romi_4_CA.czi"
    download(file_name)
