import requests

url = 'http://localhost:5000/send'
data = {
    'url': 'https://drive.google.com/file/d/1dicZ3jju6IU3GBpTTomkolzXyvkq6pBR/view?usp=sharing',
    'email': 'm.zdanowicz@gmail.com',
    'gdrive': True
}
req = requests.post(url, json=data)
if req.ok:
    print(req.json())
