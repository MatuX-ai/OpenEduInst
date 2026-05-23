"""
测试三个新页面的路由是否正确
"""
import requests
import time

BASE_URL = "http://localhost:4200"

# 测试 Token（从之前的会话中获取）
TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwib3JnX2lkIjo0LCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MTY0NjA4MDAsImV4cCI6MTcxNjQ2NDQwMH0.mock_signature"

def test_page_access(page_name: str, org_id: int = 4):
    """测试页面是否可以访问"""
    url = f"{BASE_URL}/organization/{org_id}/{page_name}?token={TEST_TOKEN}"
    
    try:
        response = requests.get(url, timeout=5)
        status = "✅" if response.status_code == 200 else "❌"
        print(f"{status} {page_name}: HTTP {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ {page_name}: 访问失败 - {e}")
        return False

def main():
    print("=" * 60)
    print("测试三个新页面的路由")
    print("=" * 60)
    print()
    
    # 测试三个页面
    pages = [
        "licenses",          # 许可证管理
        "purchase-tokens",   # 购买 Token
        "users"              # 用户管理
    ]
    
    results = []
    for page in pages:
        result = test_page_access(page)
        results.append(result)
        time.sleep(0.5)
    
    print()
    print("=" * 60)
    if all(results):
        print("✅ 所有页面路由配置正确！")
    else:
        print("❌ 部分页面存在问题，请检查")
    print("=" * 60)

if __name__ == "__main__":
    main()
