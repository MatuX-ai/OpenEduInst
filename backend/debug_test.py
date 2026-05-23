import requests
import traceback

BASE_URL = "http://localhost:8000"

print("测试创建示例数据...")
try:
    r = requests.post(f"{BASE_URL}/stem-test/create-sample-data", timeout=10)
    print(f"状态码: {r.status_code}")
    print(f"响应头: {dict(r.headers)}")
    print(f"响应内容: {r.text[:1000]}")
except Exception as e:
    print(f"请求异常: {e}")
    traceback.print_exc()