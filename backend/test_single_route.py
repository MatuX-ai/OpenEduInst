import requests

url = "http://localhost:4200/organization/4/dashboard"
try:
    r = requests.get(url, timeout=5)
    print(f"Status: {r.status_code}")
    print(f"Content-Type: {r.headers.get('Content-Type')}")
    print(f"Length: {len(r.text)}")
    print(f"Is HTML: {'text/html' in r.headers.get('Content-Type', '')}")
    
    if r.status_code == 200 and 'text/html' in r.headers.get('Content-Type', ''):
        print("\n✅ 路由正常工作（Angular SPA 返回 index.html）")
    else:
        print(f"\n❌ 路由异常")
except Exception as e:
    print(f"Error: {e}")
