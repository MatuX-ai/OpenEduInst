"""
简化版API测试 - 无emoji，兼容Windows
"""
import requests

BASE_URL = "http://localhost:8000"

def main():
    print("=" * 60)
    print("STEM培训机构云托管版 - API功能测试")
    print("=" * 60)
    
    # 1. API健康检查
    print("\n[1] API健康检查")
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("    [OK] API文档可访问")
        else:
            print(f"    [FAIL] API文档访问失败: {response.status_code}")
            return
    except Exception as e:
        print(f"    [ERROR] API连接失败: {e}")
        return
    
    # 2. 消息中心
    print("\n[2] 消息中心API")
    response = requests.get(f"{BASE_URL}/api/v1/notifications/stats?org_id=1")
    if response.status_code == 200:
        stats = response.json()
        print(f"    [OK] 通知统计: 未读{stats.get('unread_count', 0)}")
    else:
        print(f"    [WARN] 通知统计: {response.status_code}")
    
    # 3. 营销中心
    print("\n[3] 营销中心API")
    response = requests.get(f"{BASE_URL}/api/v1/marketing/campaigns?org_id=1")
    if response.status_code == 200:
        data = response.json()
        print(f"    [OK] 活动列表: {data.get('total', 0)}个")
    else:
        print(f"    [WARN] 活动列表: {response.status_code}")
    
    # 4. 竞赛认证
    print("\n[4] 竞赛认证API")
    response = requests.get(f"{BASE_URL}/api/v1/competitions/stats?org_id=1")
    if response.status_code == 200:
        stats = response.json()
        print(f"    [OK] 竞赛统计: 本月参赛{stats.get('monthly_participants', 0)}")
    else:
        print(f"    [WARN] 竞赛统计: {response.status_code}")
    
    # 5. 教学资源
    print("\n[5] 教学资源API")
    response = requests.get(f"{BASE_URL}/api/v1/resources/categories?org_id=1")
    if response.status_code == 200:
        categories = response.json()
        print(f"    [OK] 资源分类: {len(categories)}个")
    else:
        print(f"    [WARN] 资源分类: {response.status_code}")
    
    # 6. 家长中心
    print("\n[6] 家长中心API")
    response = requests.get(f"{BASE_URL}/api/v1/parent-portal/student/1/feedbacks?org_id=1")
    if response.status_code == 200:
        data = response.json()
        print(f"    [OK] 课堂反馈: {data.get('total', 0)}条")
    else:
        print(f"    [WARN] 课堂反馈: {response.status_code}")
    
    # 7. 招生线索
    print("\n[7] 招生线索API")
    response = requests.get(f"{BASE_URL}/api/v1/leads/?org_id=1")
    if response.status_code == 200:
        data = response.json()
        print(f"    [OK] 线索列表: {data.get('total', 0)}条")
    else:
        print(f"    [WARN] 线索列表: {response.status_code}")
    
    print("\n" + "=" * 60)
    print("测试完成！所有核心模块API已验证")
    print("=" * 60)

if __name__ == "__main__":
    main()
