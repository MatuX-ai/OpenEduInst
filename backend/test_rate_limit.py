import redis
import requests

r = redis.Redis(host="localhost", port=6379, decode_responses=True)
print(f"Redis ping: {r.ping()}")
print(f"初始 keys: {r.keys()}")

# 模拟几次请求，看是否真的经过了 Redis 限流
for i in range(5):
    resp = requests.get("http://localhost:8000/health")
    rl = resp.headers.get("x-ratelimit-remaining")
    print(f"  req {i+1}: HTTP {resp.status_code}  x-ratelimit-remaining={rl}")

print("")
print(f"Redis 中的 keys: {r.keys()}")
