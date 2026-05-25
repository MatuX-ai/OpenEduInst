import requests

# 测试登录 API
url = "http://127.0.0.1:8000/api/v1/auth/token"

# 准备表单数据（OAuth2PasswordRequestForm 需要 form-data 格式）
data = {
    "username": "zhao_admin",
    "password": "demo123456"
}

print("正在测试登录 API...")
print(f"URL: {url}")
print(f"用户名: zhao_admin")
print(f"密码: demo123456")
print()

try:
    response = requests.post(url, data=data)
    print(f"状态码: {response.status_code}")
    print(f"响应内容: {response.text}")
    
    if response.status_code == 200:
        print("\n✓ 登录成功！")
        token_data = response.json()
        print(f"Access Token: {token_data['access_token'][:50]}...")
    else:
        print(f"\n✗ 登录失败")
except Exception as e:
    print(f"请求出错: {e}")
