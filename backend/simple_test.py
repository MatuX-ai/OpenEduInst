import requests
import json

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("STEM功能测试")
print("=" * 60)

# 测试1: 创建示例数据
print("\n【测试1】创建示例数据...")
try:
    r = requests.post(f"{BASE_URL}/stem-test/create-sample-data")
    print(f"状态码: {r.status_code}")
    if r.status_code == 200:
        print("✅ 成功!")
        print(json.dumps(r.json(), indent=2, ensure_ascii=False))
    else:
        print(f"❌ 失败: {r.text[:200]}")
except Exception as e:
    print(f"❌ 错误: {e}")

# 测试2: 获取统计信息
print("\n【测试2】获取统计信息...")
try:
    r = requests.get(f"{BASE_URL}/stem-test/quick-stats")
    print(f"状态码: {r.status_code}")
    if r.status_code == 200:
        print("✅ 成功!")
        print(json.dumps(r.json(), indent=2, ensure_ascii=False))
    else:
        print(f"❌ 失败: {r.text[:200]}")
except Exception as e:
    print(f"❌ 错误: {e}")

# 测试3: 列出设备
print("\n【测试3】列出设备...")
try:
    r = requests.get(f"{BASE_URL}/stem-test/list-devices")
    print(f"状态码: {r.status_code}")
    if r.status_code == 200:
        print("✅ 成功!")
        devices = r.json()
        print(f"设备数量: {len(devices)}")
        for d in devices[:3]:  # 只显示前3个
            print(f"  - {d['name']} ({d['category']})")
    else:
        print(f"❌ 失败: {r.text[:200]}")
except Exception as e:
    print(f"❌ 错误: {e}")

print("\n" + "=" * 60)
print("测试完成!")
print("=" * 60)