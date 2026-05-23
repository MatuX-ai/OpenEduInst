import requests
import json

# 测试学员列表API
try:
    response = requests.get("http://localhost:8000/students/", params={"org_id": 1})
    print(f"状态码: {response.status_code}")
    print(f"响应头: {dict(response.headers)}")
    print(f"响应内容: {response.text[:500]}")  # 只显示前500字符
    
    if response.status_code == 500:
        print("\n详细错误信息:")
        try:
            error_detail = response.json()
            print(json.dumps(error_detail, indent=2, ensure_ascii=False))
        except:
            print(response.text)
            
except Exception as e:
    print(f"请求错误: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
