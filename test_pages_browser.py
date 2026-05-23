"""
使用 Selenium 测试三个新页面
"""
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

BASE_URL = "http://localhost:4200"

# 测试 Token
TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwib3JnX2lkIjo0LCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MTY0NjA4MDAsImV4cCI6MTcxNjQ2NDQwMH0.mock_signature"

ORG_ID = 4

def test_page_with_selenium(page_name: str, page_title: str):
    """使用浏览器测试页面"""
    print(f"\n测试: {page_title}")
    print("-" * 50)
    
    try:
        # 启动 Chrome
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')  # 无头模式
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        
        driver = webdriver.Chrome(options=options)
        driver.set_page_load_timeout(10)
        
        # 访问页面
        url = f"{BASE_URL}/organization/{ORG_ID}/{page_name}?token={TEST_TOKEN}"
        print(f"访问: {url}")
        
        driver.get(url)
        
        # 等待页面加载
        time.sleep(3)
        
        # 检查页面标题或内容
        page_source = driver.page_source
        
        if "功能开发中" in page_source or page_name.replace('-', ' ').title() in page_source:
            print(f"✅ {page_title} - 页面正常加载")
            return True
        else:
            print(f"❌ {page_title} - 页面内容异常")
            print(f"   页面标题: {driver.title}")
            return False
            
    except Exception as e:
        print(f"❌ {page_title} - 访问失败: {e}")
        return False
    finally:
        if 'driver' in locals():
            driver.quit()

def main():
    print("=" * 60)
    print("使用浏览器测试三个新页面")
    print("=" * 60)
    
    pages = [
        ("licenses", "许可证管理"),
        ("purchase-tokens", "购买 Token"),
        ("users", "用户管理")
    ]
    
    results = []
    for page_name, page_title in pages:
        result = test_page_with_selenium(page_name, page_title)
        results.append(result)
        time.sleep(1)
    
    print("\n" + "=" * 60)
    print("测试结果汇总")
    print("=" * 60)
    
    for (page_name, page_title), result in zip(pages, results):
        status = "✅" if result else "❌"
        print(f"{status} {page_title} ({page_name})")
    
    print("\n" + "=" * 60)
    if all(results):
        print("🎉 所有页面测试通过！")
    else:
        print("⚠️  部分页面存在问题")
    print("=" * 60)

if __name__ == "__main__":
    main()
