"""
深度API测试 - 创建组织后测试所有功能
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def create_test_organization():
    """创建测试组织"""
    print("\n[步骤1] 创建测试组织")
    org_data = {
        "name": "深度测试STEM机构",
        "type": "training",
        "contact_email": "deep_test@example.com",
        "contact_phone": "13900139000",
        "address": "测试地址"
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/organizations", json=org_data)
    if response.status_code == 200:
        org = response.json()
        org_id = org.get('id')
        print(f"    [OK] 组织创建成功: ID={org_id}, 名称={org.get('name')}")
        return org_id
    else:
        print(f"    [FAIL] 组织创建失败: {response.status_code}")
        print(f"    响应: {response.text}")
        return None

def test_all_modules(org_id):
    """测试所有模块"""
    print(f"\n[步骤2] 测试所有模块 (org_id={org_id})")
    
    modules = [
        ("消息中心-列表", f"/api/v1/notifications/?org_id={org_id}"),
        ("消息中心-统计", f"/api/v1/notifications/stats?org_id={org_id}"),
        ("营销中心-活动", f"/api/v1/marketing/campaigns?org_id={org_id}"),
        ("营销中心-优惠券", f"/api/v1/marketing/coupons?org_id={org_id}"),
        ("竞赛认证-列表", f"/api/v1/competitions/?org_id={org_id}"),
        ("竞赛认证-统计", f"/api/v1/competitions/stats?org_id={org_id}"),
        ("教学资源-列表", f"/api/v1/resources/?org_id={org_id}"),
        ("教学资源-分类", f"/api/v1/resources/categories?org_id={org_id}"),
        ("家长中心-反馈", f"/api/v1/parent-portal/student/1/feedbacks?org_id={org_id}"),
        ("家长中心-荣誉", f"/api/v1/parent-portal/student/1/achievements?org_id={org_id}"),
        ("招生线索-列表", f"/api/v1/leads/?org_id={org_id}"),
        ("招生线索-统计", f"/api/v1/leads/stats?org_id={org_id}"),
    ]
    
    passed = 0
    failed = 0
    
    for name, endpoint in modules:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}")
            if response.status_code == 200:
                print(f"    [OK] {name}")
                passed += 1
            else:
                print(f"    [WARN] {name}: {response.status_code}")
                failed += 1
        except Exception as e:
            print(f"    [ERROR] {name}: {e}")
            failed += 1
    
    print(f"\n    结果: {passed}通过, {failed}警告")
    return passed, failed

def test_crud_operations(org_id):
    """测试CRUD操作"""
    print(f"\n[步骤3] 测试CRUD操作 (org_id={org_id})")
    
    # 测试创建通知
    print("    测试创建通知...")
    notification_data = {
        "title": "测试通知",
        "content": "这是一条测试通知",
        "type": "system",
        "priority": "low"
    }
    response = requests.post(
        f"{BASE_URL}/api/v1/notifications/?org_id={org_id}",
        params=notification_data
    )
    if response.status_code == 200:
        print("    [OK] 创建通知成功")
        notif_id = response.json().get('notification', {}).get('id')
        
        # 测试标记已读
        if notif_id:
            response = requests.put(f"{BASE_URL}/api/v1/notifications/{notif_id}/read?org_id={org_id}")
            if response.status_code == 200:
                print("    [OK] 标记已读成功")
            else:
                print(f"    [WARN] 标记已读: {response.status_code}")
    else:
        print(f"    [WARN] 创建通知: {response.status_code}")
    
    # 测试创建优惠券
    print("    测试创建优惠券...")
    coupon_data = {
        "code": "TEST2026",
        "name": "测试优惠券",
        "discount_type": "fixed",
        "discount_value": 100,
        "total_quantity": 50,
        "expiry_date": "2026-12-31T23:59:59"
    }
    response = requests.post(
        f"{BASE_URL}/api/v1/marketing/coupons?org_id={org_id}",
        params=coupon_data
    )
    if response.status_code == 200:
        print("    [OK] 创建优惠券成功")
    else:
        print(f"    [WARN] 创建优惠券: {response.status_code}")

def main():
    print("=" * 70)
    print("STEM培训机构云托管版 - 深度API测试")
    print("=" * 70)
    
    # 检查API健康
    print("\n[步骤0] API健康检查")
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("    [OK] API服务正常")
        else:
            print(f"    [FAIL] API异常: {response.status_code}")
            return
    except Exception as e:
        print(f"    [ERROR] 无法连接API: {e}")
        return
    
    # 创建测试组织
    org_id = create_test_organization()
    if not org_id:
        print("\n[终止] 无法创建测试组织")
        return
    
    # 测试所有模块
    passed, failed = test_all_modules(org_id)
    
    # 测试CRUD操作
    test_crud_operations(org_id)
    
    # 总结
    print("\n" + "=" * 70)
    print("深度测试完成！")
    print(f"总计: {passed}个模块正常, {failed}个模块需关注")
    print("=" * 70)

if __name__ == "__main__":
    main()
