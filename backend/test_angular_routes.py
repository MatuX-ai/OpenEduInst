"""
测试 Angular 子页面路由是否正确配置
"""

import requests
import time

BASE_URL = "http://localhost:4200"
ORG_ID = 4
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbG91ZF90ZXN0XzE3Nzk1MjI5NzciLCJvcmdfaWQiOjQsImV4cCI6MTc3OTYwOTM4NH0.qOVl5QSR9RxOhNhWm7iBTe0PMKxjBvHh-gPys1B3MX4"

# 定义所有需要测试的路由
routes_to_test = [
    ("仪表盘", f"/organization/{ORG_ID}/dashboard"),
    ("财务管理", f"/organization/{ORG_ID}/finance"),
    ("教室管理", f"/organization/{ORG_ID}/classrooms"),
    ("微信客服", f"/organization/{ORG_ID}/wechat-cs"),
    ("教师管理", f"/organization/{ORG_ID}/teachers"),
    ("学生管理", f"/organization/{ORG_ID}/students"),
    ("排课管理", f"/organization/{ORG_ID}/schedule"),
    ("批量排课", f"/organization/{ORG_ID}/schedule/batch"),
    ("角色权限", f"/organization/{ORG_ID}/roles"),
    ("数据分析", f"/organization/{ORG_ID}/analytics"),
]

def test_route(name, path):
    """测试单个路由是否可访问"""
    url = f"{BASE_URL}{path}?token={TOKEN}"
    try:
        # 等待一下让 Angular 路由加载
        time.sleep(0.5)
        
        # 由于 Angular 是 SPA，所有路由都返回 index.html
        # 我们只能检查 HTTP 状态码是否为 200
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            # 检查返回的是否为 HTML（Angular SPA）
            if 'text/html' in response.headers.get('Content-Type', ''):
                print(f"✅ {name:12} - {path:40} [OK]")
                return True
            else:
                print(f"⚠️  {name:12} - {path:40} [返回非HTML内容]")
                return False
        else:
            print(f"❌ {name:12} - {path:40} [HTTP {response.status_code}]")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ {name:12} - {path:40} [连接失败 - Angular 服务未启动]")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ {name:12} - {path:40} [请求超时]")
        return False
    except Exception as e:
        print(f"❌ {name:12} - {path:40} [异常: {str(e)}]")
        return False

def main():
    print("=" * 80)
    print("🧪 Angular 子页面路由测试")
    print("=" * 80)
    print(f"\n📍 测试目标: http://localhost:4200")
    print(f"🏢 组织 ID: {ORG_ID}")
    print(f"🔑 Token: {TOKEN[:30]}...\n")
    
    results = []
    for name, path in routes_to_test:
        result = test_route(name, path)
        results.append((name, path, result))
    
    # 统计结果
    print("\n" + "=" * 80)
    total = len(results)
    passed = sum(1 for _, _, r in results if r)
    failed = total - passed
    
    print(f"📊 测试结果: {passed}/{total} 通过")
    
    if failed > 0:
        print(f"\n❌ 失败的路由:")
        for name, path, result in results:
            if not result:
                print(f"   - {name}: {path}")
    else:
        print(f"\n✅ 所有路由测试通过！")
    
    print("=" * 80)
    
    # 提供手动测试链接
    print("\n🔗 手动测试链接（复制到浏览器）:")
    for name, path in routes_to_test:
        full_url = f"{BASE_URL}{path}?token={TOKEN}"
        print(f"   {name:12}: {full_url}")
    
    print("\n💡 提示: 由于 Angular 是单页应用，所有路由都会返回相同的 index.html")
    print("   真正的路由验证需要在浏览器中查看控制台是否有 404 错误或组件加载失败")

if __name__ == "__main__":
    main()
