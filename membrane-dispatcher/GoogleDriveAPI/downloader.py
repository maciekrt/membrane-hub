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

def parseGDriveName(name):
    s = name.split("/")
    return s[5]

def downloadFile(token_path, credentials_path, url, outputFolder):
    creds = None
    # The file token.pickle stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists(token_path):
        with open(token_path, 'rb') as token:
            creds = pickle.load(token)
        print("downloadFile: Credentials successfully loaded.")
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                credentials_path, SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open(token_path, 'wb') as token:
            pickle.dump(creds, token)

    service = build('drive', 'v3', credentials=creds)

    file_id = parseGDriveName(url)
    request = service.files().get(fileId=file_id)
    file = request.execute()
    request = service.files().get_media(fileId=file_id)
    fh = io.FileIO(Path(outputFolder) / file['name'], 'wb')
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    print(f"downloadFile[file_name]: {file['name']}.")
    print(f"downloadFile[file_id]: {file_id}.")
    while done is False:
        try:
            status, done = downloader.next_chunk()
            print(f"Download {int(status.progress() * 100)}%.")
        except:
            fh.close()
    return file['name']


# time python downloader.py token.pickle 
# https://drive.google.com/file/d/1ZTKw5y7vQl0Tz_TFSTih6S06q_nCw3sR/view?usp=sharing

def main():
    """Shows basic usage of the Drive v3 API.
    Prints the names and ids of the first 10 files the user has access to.
    https://googleapis.github.io/google-api-python-client/docs/epy/googleapiclient.http.HttpRequest-class.html
    https://developers.google.com/drive/api/v3/reference/files/get
    https://developers.google.com/drive/api/v3/quickstart/python
    """
    parser = argparse.ArgumentParser()
    parser.add_argument('token', help='Google Token file.')
    parser.add_argument('url', help='Google Drive url.')
    args = parser.parse_args()
    url = args.url
    token_path = args.token
    downloadFile(token_path, url)

if __name__ == '__main__':
    main()
