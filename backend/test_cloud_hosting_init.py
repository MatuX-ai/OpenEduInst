import requests
import json
import sys
import uuid

BASE_URL = "http://127.0.0.1:8000"

def test_cloud_hosting_flow():
    print("--- 开始测试 STEM 云托管版核心流程 ---")

    # 1. 注册/登录获取 Token (使用演示账号或临时注册)
    # 假设我们有一个可以直接登录的接口，或者先注册
    login_data = {"username": "test_cloud_user", "password": "Test123456"}
    
    # 尝试注册（如果已存在会失败，但不影响后续逻辑，我们主要测创建组织）
    try:
        requests.post(f"{BASE_URL}/api/v1/auth/register", json={
            **login_data, 
            "email": f"test_cloud_{uuid.uuid4().hex[:6]}@example.com", 
            "full_name": "Cloud Tester"
        })
    except:
        pass

    # 登录获取 Token
    res = requests.post(f"{BASE_URL}/api/v1/auth/token", data=login_data)
    if res.status_code != 200:
        print(f"❌ 登录失败: {res.text}")
        return
    
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ 步骤 1: 用户登录成功")

    # 2. 创建 STEM 培训机构组织
    unique_id = uuid.uuid4().hex[:6]
    org_data = {
        "name": f"云端测试 STEM 中心 {unique_id}",
        "contact_email": f"cloud_test_{unique_id}@example.com",
        "org_type": "training_institution",
        "phone": "13800138000"
    }
    
    res = requests.post(f"{BASE_URL}/api/v1/organizations/create", json=org_data, headers=headers)
    if res.status_code != 200:
        print(f"❌ 创建组织失败: {res.text}")
        return
    
    org_info = res.json()
    org_id = org_info["organization_id"]
    print(f"✅ 步骤 2: 组织创建成功 (ID: {org_id})")

    # 3. 验证云托管许可证是否自动发放
    res = requests.get(f"{BASE_URL}/api/v1/organizations/{org_id}/licenses", headers=headers)
    if res.status_code == 200:
        licenses = res.json()
        cloud_license = next((l for l in licenses if l["license_type"] == "cloud_hosted"), None)
        
        if cloud_license:
            print("✅ 步骤 3: 云托管许可证 (CLOUD_HOSTED) 已自动发放")
            print(f"   - 许可证 Key: {cloud_license['license_key']}")
            print(f"   - 有效期: {cloud_license['expires_at']}")
            print(f"   - 开启功能: {cloud_license['features']}")
        else:
            print("❌ 步骤 3: 未检测到云托管许可证")
    else:
        print(f"⚠️ 无法直接查询许可证列表: {res.status_code} - {res.text}")

    # 4. 验证租户配置初始化
    res = requests.get(f"{BASE_URL}/tenant/config/{org_id}", headers=headers)
    if res.status_code == 200:
        data = res.json()
        config = data.get("config", {})
        if config.get("cloud_backup_enabled"):
            print("✅ 步骤 4: 云端专属配置 (自动备份) 已启用")
        else:
            print("⚠️ 云端专属配置未正确初始化")
    else:
        print(f"⚠️ 无法查询租户配置: {res.status_code} - {res.text}")

    print("\n--- 测试完成 ---")

if __name__ == "__main__":
    test_cloud_hosting_flow()
