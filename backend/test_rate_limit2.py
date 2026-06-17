import redis
import requests

r = redis.Redis(host="localhost", port=6379, decode_responses=True)
print(f"Redis ping: {r.ping()}")
print(f"初始 keys: {r.keys()}")

# 换一个非白名单的接口
for i in range(5):
    resp = requests.get("http://localhost:8000/educational-institutions")
    rl = resp.headers.get("x-ratelimit-remaining") or resp.headers.get("X-RateLimit-Remaining")
    limit = resp.headers.get("x-ratelimit-limit") or resp.headers.get("X-RateLimit-Limit")
    print(f"  req {i+1}: HTTP {resp.status_code}  X-RateLimit-Limit={limit}  X-RateLimit-Remaining={rl}")

print("")
print(f"Redis 中的 keys: {r.keys()}")
