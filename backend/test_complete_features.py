"""
完整功能测试脚本
测试所有主要模块的API端点
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_api_health():
    """测试API健康状态"""
    print("\n=== 1. API健康检查 ===")
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ API文档可访问")
            return True
        else:
            print(f"❌ API文档访问失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API连接失败: {e}")
        return False


def create_test_org():
    """创建测试组织"""
    print("\n=== 0. 创建测试组织 ===")
    try:
        # 先尝试获取现有组织
        response = requests.get(f"{BASE_URL}/api/v1/organizations/my?user_id=1")
        if response.status_code == 200:
            org = response.json()
            print(f"✅ 使用现有组织: {org.get('name', 'N/A')} (ID={org.get('id')})")
            return org.get('id', 1)
        
        # 如果不存在，创建新组织
        org_data = {
            "name": "测试STEM机构",
            "type": "training",
            "contact_email": "test@example.com",
            "contact_phone": "13800138000"
        }
        response = requests.post(f"{BASE_URL}/api/v1/organizations", json=org_data)
        if response.status_code == 200:
            org = response.json()
            print(f"✅ 创建测试组织成功: {org.get('name')} (ID={org.get('id')})")
            return org.get('id')
        else:
            print(f"⚠️ 创建组织失败: {response.status_code}, 使用默认ID=1")
            return 1
    except Exception as e:
        print(f"⚠️ 组织操作异常: {e}, 使用默认ID=1")
        return 1


def test_notifications_api(org_id=1):
    """测试消息中心API"""
    print("\n=== 2. 消息中心API测试 ===")
    
    # 获取通知列表
    try:
        response = requests.get(f"{BASE_URL}/api/v1/notifications/?org_id={org_id}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 获取通知列表成功 (共{data.get('total', 0)}条)")
        else:
            print(f"⚠️ 获取通知列表: {response.status_code}")
    except Exception as e:
        print(f"❌ 通知API错误: {e}")
    
    # 获取通知统计
    try:
        response = requests.get(f"{BASE_URL}/api/v1/notifications/stats?org_id={org_id}")
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ 通知统计: 未读{stats.get('unread_count', 0)}, 高优先级{stats.get('high_priority_count', 0)}")
        else:
            print(f"⚠️ 通知统计: {response.status_code}")
    except Exception as e:
        print(f"❌ 通知统计错误: {e}")


def test_marketing_api():
    """测试营销中心API"""
    print("\n=== 3. 营销中心API测试 ===")
    
    # 获取活动列表
    try:
        response = requests.get(f"{BASE_URL}/api/v1/marketing/campaigns?org_id=1")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 获取活动列表成功 (共{data.get('total', 0)}个)")
        else:
            print(f"⚠️ 活动列表: {response.status_code}")
    except Exception as e:
        print(f"❌ 活动API错误: {e}")
    
    # 获取优惠券列表
    try:
        response = requests.get(f"{BASE_URL}/api/v1/marketing/coupons?org_id=1")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 获取优惠券列表成功 (共{data.get('total', 0)}种)")
        else:
            print(f"⚠️ 优惠券列表: {response.status_code}")
    except Exception as e:
        print(f"❌ 优惠券API错误: {e}")


def test_competition_api():
    """测试竞赛认证API"""
    print("\n=== 4. 竞赛认证API测试 ===")
    
    # 获取竞赛列表
    try:
        response = requests.get(f"{BASE_URL}/api/v1/competitions/?org_id=1")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 获取竞赛列表成功 (共{data.get('total', 0)}个)")
        else:
            print(f"⚠️ 竞赛列表: {response.status_code}")
    except Exception as e:
        print(f"❌ 竞赛API错误: {e}")
    
    # 获取竞赛统计
    try:
        response = requests.get(f"{BASE_URL}/api/v1/competitions/stats?org_id=1")
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ 竞赛统计: 本月参赛{stats.get('monthly_participants', 0)}, 累计获奖{stats.get('total_awards', 0)}")
        else:
            print(f"⚠️ 竞赛统计: {response.status_code}")
    except Exception as e:
        print(f"❌ 竞赛统计错误: {e}")


def test_resource_api():
    """测试教学资源API"""
    print("\n=== 5. 教学资源API测试 ===")
    
    # 获取资源列表
    try:
        response = requests.get(f"{BASE_URL}/api/v1/resources/?org_id=1")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 获取资源列表成功 (共{data.get('total', 0)}个)")
        else:
            print(f"⚠️ 资源列表: {response.status_code}")
    except Exception as e:
        print(f"❌ 资源API错误: {e}")
    
    # 获取资源分类
    try:
        response = requests.get(f"{BASE_URL}/api/v1/resources/categories?org_id=1")
        if response.status_code == 200:
            categories = response.json()
            print(f"✅ 获取资源分类成功 (共{len(categories)}个)")
        else:
            print(f"⚠️ 资源分类: {response.status_code}")
    except Exception as e:
        print(f"❌ 资源分类错误: {e}")


def test_parent_portal_api():
    """测试家长中心API"""
    print("\n=== 6. 家长中心API测试 ===")
    
    # 获取课堂反馈（假设student_id=1）
    try:
        response = requests.get(f"{BASE_URL}/api/v1/parent-portal/student/1/feedbacks?org_id=1")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 获取课堂反馈成功 (共{data.get('total', 0)}条)")
        else:
            print(f"⚠️ 课堂反馈: {response.status_code}")
    except Exception as e:
        print(f"❌ 反馈API错误: {e}")
    
    # 获取学员荣誉
    try:
        response = requests.get(f"{BASE_URL}/api/v1/parent-portal/student/1/achievements?org_id=1")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 获取学员荣誉成功 (共{data.get('total', 0)}项)")
        else:
            print(f"⚠️ 学员荣誉: {response.status_code}")
    except Exception as e:
        print(f"❌ 荣誉API错误: {e}")


def test_leads_api():
    """测试招生线索API"""
    print("\n=== 7. 招生线索API测试 ===")
    
    # 获取线索列表
    try:
        response = requests.get(f"{BASE_URL}/api/v1/leads/?org_id=1")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 获取线索列表成功 (共{data.get('total', 0)}条)")
        else:
            print(f"⚠️ 线索列表: {response.status_code}")
    except Exception as e:
        print(f"❌ 线索API错误: {e}")
    
    # 获取线索统计
    try:
        response = requests.get(f"{BASE_URL}/api/v1/leads/stats?org_id=1")
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ 线索统计: 总数{stats.get('total_leads', 0)}, 待跟进{stats.get('pending_leads', 0)}")
        else:
            print(f"⚠️ 线索统计: {response.status_code}")
    except Exception as e:
        print(f"❌ 线索统计错误: {e}")


def main():
    """执行所有测试"""
    print("=" * 60)
    print("STEM培训机构云托管版 - 完整功能测试")
    print("=" * 60)
    
    # 测试API健康状态
    if not test_api_health():
        print("\n❌ API服务未启动，请先启动后端服务")
        return
    
    # 创建测试组织
    org_id = create_test_org()
    
    # 测试各模块API
    test_notifications_api(org_id)
    test_marketing_api(org_id)
    test_competition_api(org_id)
    test_resource_api(org_id)
    test_parent_portal_api(org_id)
    test_leads_api(org_id)
    
    print("\n" + "=" * 60)
    print("测试完成！")
    print("=" * 60)


if __name__ == "__main__":
    main()
