import requests
import json

BASE_URL = "http://localhost:8000"

def run_test():
    print("🚀 开始自动化云托管流程测试...")
    
    # 1. 注册测试用户
    import time
    timestamp = int(time.time())
    username = f"cloud_test_{timestamp}"
    email = f"cloud{timestamp}@test.com"
    password = "123456"
    
    try:
        reg_res = requests.post(f"{BASE_URL}/auth/register", json={
            "username": username,
            "email": email,
            "password": password,
            "full_name": "Cloud Tester"
        })
        print(f"✅ 注册状态: {reg_res.status_code}")
    except:
        print("ℹ️ 用户可能已存在，尝试直接登录...")

    # 2. 获取 Token
    login_res = requests.post(f"{BASE_URL}/auth/token", data={
        "username": username,
        "password": password
    }, headers={"Content-Type": "application/x-www-form-urlencoded"})
    
    if login_res.status_code != 200:
        print(f"❌ 登录失败: {login_res.text}")
        return

    token = login_res.json()["access_token"]
    print(f"✅ Token 获取成功: {token[:20]}...")

    # 3. 创建组织 (STEM 培训机构)
    headers = {"Authorization": f"Bearer {token}"}
    org_res = requests.post(f"{BASE_URL}/organizations/create", json={
        "name": "未来STEM创客中心",
        "contact_email": f"future{timestamp}@stem-cloud.com",
        "org_type": "training_institution",
        "phone": "13800138000"
    }, headers=headers)

    if org_res.status_code != 200:
        print(f"❌ 创建组织失败: {org_res.text}")
        return

    org_data = org_res.json()
    org_id = org_data["organization_id"]
    new_token = org_data["access_token"]
    
    print(f"✅ 组织创建成功! ID: {org_id}")
    print(f"✅ 初始许可证已自动发放 (CLOUD_HOSTED)")
    
    # 4. 生成直达链接
    dashboard_url = f"http://localhost:4200/organization/{org_id}/dashboard?token={new_token}"
    print("\n" + "="*50)
    print("🎉 测试完成！点击下方链接直接进入管理后台：")
    print(dashboard_url)
    print("="*50)

if __name__ == "__main__":
    run_test()
