import time
import boto3


def download(file_name):
    bucket_name = "membranehubbucket"
    print("Downloading..")
    s3_resource = boto3.resource('s3')
    s3_resource.Object(bucket_name, file_name).download_file(f"./DOWNLOADED_{file_name}")
    print("Done..")
            
# def make_bucket(name, acl):
#     s3_resource = boto3.resource('s3')
#     return s3_resource.create_bucket(Bucket="membranehubboto3test",
#                           CreateBucketConfiguration={'LocationConstraint': 'eu-central-1'})

if __name__=="__main__":
    file_name = "FISH3_BDNF488_7_cLTP_romi_4_CA.czi"
    bucket_name = "membranehubbucket"
    s3_resource = boto3.resource('s3')
    s3_resource.Object(bucket_name, file_name).download_file(f"./DOWNLOADED_{file_name}")
