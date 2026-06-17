import subprocess, time, sys

print("等待 Docker Desktop 引擎就绪 ...", flush=True)
for i in range(40):
    try:
        r = subprocess.run(
            ["docker", "version", "--format", "{{.Server.Version}}"],
            capture_output=True, text=True, timeout=10,
        )
        if r.returncode == 0 and r.stdout.strip():
            print(f"[OK] Docker 引擎已启动 (version={r.stdout.strip()})")
            sys.exit(0)
    except Exception:
        pass
    print(f"  等待中 {i+1}/40 ...", flush=True)
    time.sleep(3)

print("[ERR] 2 分钟后 Docker 引擎仍未启动，请手动打开 Docker Desktop")
sys.exit(1)
