import pickle
import os.path
import argparse
import io, sys
from pathlib import Path

from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.http import MediaIoBaseDownload

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly',
          'https://www.googleapis.com/auth/drive']

def parse_gdrive_name(name):
    s = name.split("/")
    return s[5]

def download_file(token_path, credentials_path, url, output_folder):
    """
    Parameters:
    token_path: Path
    credentials_path: Path
    url: str
    output_folder: Path

    Output: Path
    The path
    """

    creds = None
    # The file token.pickle stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if token_path.exists():
        with open(str(token_path), 'rb') as token:
            creds = pickle.load(token)
        print("download_file: Credentials successfully loaded.")
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                str(credentials_path), SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open(str(token_path), 'wb') as token:
            pickle.dump(creds, token)

    service = build('drive', 'v3', credentials=creds)

    file_id = parse_gdrive_name(url)
    request = service.files().get(fileId=file_id)
    file = request.execute()
    request = service.files().get_media(fileId=file_id)
    output_path = output_folder / file['name']
    fh = io.FileIO(output_path, 'wb')
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    print(f"download_file[file_name]: {file['name']}.")
    print(f"download_file[file_id]: {file_id}.")
    while done is False:
        try:
            status, done = downloader.next_chunk()
            print(f"Download {int(status.progress() * 100)}%.")
        except:
            fh.close()
    return output_path


# time python downloader.py token.pickle
URL = 'https://drive.google.com/file/d/1mtHLzrfkmJc6MpDbw8qux5L3Z7poWkRQ/view?usp=sharing'
TOKENPATH = '../secrets/token.pickle'
CREDENTIALSPATH = '../secrets/credentials.json'
HERE = './'

def main():
    """Shows basic usage of the Drive v3 API.
    Prints the names and ids of the first 10 files the user has access to.
    https://googleapis.github.io/google-api-python-client/docs/epy/googleapiclient.http.HttpRequest-class.html
    https://developers.google.com/drive/api/v3/reference/files/get
    https://developers.google.com/drive/api/v3/quickstart/python
    """
    # parser = argparse.ArgumentParser()
    # parser.add_argument('token', help='Google Token file.')
    # parser.add_argument('url', help='Google Drive url.')
    # args = parser.parse_args()
    # url = args.url
    # token_path = args.token
    download_file(
        Path(TOKENPATH), 
        Path(CREDENTIALSPATH),
        URL,
        Path(HERE)
    )
    
if __name__ == '__main__':
    main()
