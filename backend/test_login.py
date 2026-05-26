import requests
import base64
import json

# 登录获取token
response = requests.post(
    "http://127.0.0.1:8000/api/v1/auth/token",
    data={"username": "admin", "password": "admin123"}
)

print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

if response.status_code == 200:
    token = response.json()["access_token"]
    
    # 解码JWT payload
    parts = token.split('.')
    payload = parts[1]
    # 添加padding
    payload += '=' * (4 - len(payload) % 4) if len(payload) % 4 else ''
    decoded = base64.urlsafe_b64decode(payload)
    payload_data = json.loads(decoded)
    
    print(f"\nDecoded JWT Payload:")
    print(json.dumps(payload_data, indent=2))
    
    # 测试学生API
    headers = {"Authorization": f"Bearer {token}"}
    student_response = requests.get(
        "http://127.0.0.1:8000/api/v1/students/",
        params={"page": 1, "page_size": 10},
        headers=headers
    )
    
    print(f"\nStudent API Status: {student_response.status_code}")
    if student_response.status_code == 200:
        print(f"Students: {student_response.json()}")
    else:
        print(f"Error: {student_response.text}")
