import requests

url = 'http://localhost:5000/send'
data = {
    'url': 'https://drive.google.com/file/d/0B4j7m1FLhDOvdmNuQWZtU0lKR1lvamhlMUFCZ19DMlFVR21B/view?usp=sharing',
    'email': 'm.zdanowicz@gmail.com',
    'gdrive': True
}
req = requests.post(url, json=data)
if req.ok:
    print(req.json())
