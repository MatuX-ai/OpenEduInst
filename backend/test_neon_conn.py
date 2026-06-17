import os, sys, time, dotenv

dotenv.load_dotenv()
url = os.environ.get("DATABASE_URL", "")

host = url.split("@")[-1].split("/")[0]
db = url.split("/")[-1].split("?")[0]
print(f"  主机  : {host}")
print(f"  数据库: {db}")
print(f"  用户  : {url.split('@')[0].split('//')[-1].split(':')[0]}")
print(f"  SSL   : {'sslmode=require' in url}")

# Neon 无服务器冷启动最多可能需要 30 秒
os.environ["PGCONNECT_TIMEOUT"] = "30"

from sqlalchemy import create_engine, text

for attempt in range(1, 4):
    try:
        print(f"\n  [尝试 {attempt}/3] 连接中 ...")
        e = create_engine(url, connect_args={"connect_timeout": 30}, pool_pre_ping=True)
        with e.connect() as c:
            r = c.execute(text("SELECT current_database(), current_user, version();")).fetchone()
            print("  [OK] 连接成功")
            print(f"      database : {r[0]}")
            print(f"      user     : {r[1]}")
            print(f"      version  : {r[2][:80]}")

            # 测试写一张表
            r2 = c.execute(text("SELECT 1")).fetchone()
            print(f"      查询测试 : r2={r2}")

            c.commit()
        sys.exit(0)
    except Exception as exc:
        msg = str(exc)
        print(f"  [ERR] {msg[:120]}")
        if attempt < 3:
            print("        等待 5 秒后重试（Neon 可能在冷启动）...")
            time.sleep(5)
        continue

print("\n[结论] 连接串无效或实例已暂停。请在 Neon 控制台检查：")
print("  1. 项目是否还处于 Active 状态")
print("  2. 当前连接串中的密码是否已过期")
print("  3. 重新生成密码后，到 Dashboard 复制新的连接串")
sys.exit(1)
