import requests

url = 'http://localhost:5001/send'
data = {
    'url': 'https://drive.google.com/file/d/18LH5EnCuIkX-XJfFigvp2HMv0yhclEQ1/view?usp=sharing',
    'email': 'm.zdanowicz@gmail.com',
    'gdrive': True
}

req = requests.post(url, json=data)
if req.ok:
    print(req.json())
