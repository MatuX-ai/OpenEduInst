import requests

# 测试学员列表API
try:
    response = requests.get("http://localhost:8000/students/", params={"org_id": 1})
    print(f"状态码: {response.status_code}")
    print(f"响应内容: {response.text}")
except Exception as e:
    print(f"请求错误: {e}")
