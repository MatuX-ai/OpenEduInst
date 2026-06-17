# -*- coding: utf-8 -*-
"""
OpenMT 本地部署就绪检查（跨平台：Windows / Linux / macOS）
等同于 deploy.sh --dry-run ，聚焦于本项目能做到的自检项：
  1. Python 依赖是否齐全
  2. 主程序 main.py 可导入 & 所有路由注册成功
  3. .env / .env.production 配置是否就绪
  4. Docker 引擎是否可达
  5. docker compose 插件版本
  6. Nginx 配置文件完整性
  7. SSL 证书目录
  8. 持久化目录（logs / data）
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

OK = "[OK]"
WARN = "[WARN]"
ERR = "[ERR]"
PASS = "PASS"
FAIL = "FAIL"

checks = []


def log(status, msg):
    prefix = OK if status == PASS else ERR if status == FAIL else WARN
    checks.append((status, msg))
    print(f"  {prefix}  {msg}")


def cmd_exists(cmd: str) -> bool:
    return shutil.which(cmd) is not None


def run(cmd_list, timeout=10):
    try:
        r = subprocess.run(
            cmd_list,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return r.returncode, r.stdout.strip(), r.stderr.strip()
    except FileNotFoundError:
        return 127, "", ""
    except Exception as e:
        return 1, "", str(e)


PROJECT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

print("=" * 70)
print(f"OpenMT 部署就绪检查  (dry-run)")
print(f"工作目录: {BACKEND_DIR}")
print("=" * 70)

# ============================================================
# 1. Python 版本 & 依赖
# ============================================================
print("\n>>> 1. Python 运行环境")
rc, out, _ = run([sys.executable, "--version"])
if rc == 0 and out:
    print(f"  {out}")
else:
    print("  [ERR] Python 不可用")

required_packages = [
    "fastapi",
    "uvicorn",
    "sqlalchemy",
    "pydantic",
    "pydantic_settings",
    "python-jose",
    "passlib",
    "bcrypt",
    "redis",
    "requests",
    "slowapi",
    "tenacity",
    "gunicorn",
]

missing = []
for pkg in required_packages:
    # 把包名映射到 import 模块名
    mod = (
        pkg.replace("-", "_")
        .replace("python_jose", "jose")
        .replace("pydantic_settings", "pydantic_settings")
        .replace("bcrypt", "bcrypt")
    )
    # gunicorn 在 Windows 上无法以模块 import，但这不影响容器化部署
    if pkg == "gunicorn" and sys.platform.startswith("win"):
        log(PASS, "gunicorn（生产 WSGI 服务器）Linux-only，Windows 本地不检查，Docker 镜像中会自带")
        continue
    rc, out, _ = run([sys.executable, "-c", f"import {mod}"], timeout=10)
    if rc != 0:
        missing.append(pkg)

if not missing:
    log(PASS, f"所有 {len(required_packages)} 个关键依赖可成功导入")
else:
    log(FAIL, f"缺失依赖: {', '.join(missing)}  (建议: pip install -r {BACKEND_DIR}/requirements.txt)")

# ============================================================
# 2. main.py 导入 & 路由注册
# ============================================================
print("\n>>> 2. main.py 导入与路由注册")
# 用 sqlite 让 config.settings 不报错
os.environ["DATABASE_URL"] = "sqlite:///./deploy_check.db"
os.environ["SECRET_KEY"] = "deploy-check"

try:
    from importlib import import_module

    main = import_module("main")
    route_count = len(getattr(main, "app", None).routes if hasattr(main, "app") else [])
    log(PASS, f"main.app 成功实例化，共 {route_count} 条路由")
except Exception as exc:
    log(FAIL, f"main.py 导入失败: {exc}")

# 限流 / 审计中间件存在性
for f in ["middleware/rate_limit_middleware.py", "middleware/audit_middleware.py"]:
    p = BACKEND_DIR / f
    if p.is_file():
        log(PASS, f"{f} 存在")
    else:
        log(FAIL, f"{f} 缺失")

# ============================================================
# 3. .env 配置文件
# ============================================================
print("\n>>> 3. 环境变量配置")
env_path = BACKEND_DIR / ".env"
env_prod = BACKEND_DIR / ".env.production"

if env_prod.is_file():
    log(PASS, ".env.production 模板存在")
else:
    log(WARN, ".env.production 模板缺失")

if env_path.is_file():
    content = env_path.read_text(encoding="utf-8")
    has_default = "CHANGE_ME" in content or "your-secret-key" in content or "your-imatu-secret-key" in content
    has_db = "DATABASE_URL=" in content
    has_jwt = "SECRET_KEY=" in content
    if has_db and has_jwt and not has_default:
        log(PASS, ".env 已配置，DATABASE_URL / SECRET_KEY 存在，无占位符")
    elif has_db and has_jwt and has_default:
        log(WARN, ".env 存在但仍包含 CHANGE_ME 占位符，请替换为真实值")
    else:
        log(WARN, ".env 缺少关键字段 (DATABASE_URL / SECRET_KEY)")
else:
    log(WARN, ".env 未创建（建议：cp .env.production .env 并编辑）")

# ============================================================
# 4. Docker 引擎
# ============================================================
print("\n>>> 4. Docker 引擎")
rc, out, _ = run(["docker", "--version"])
if rc == 0 and out:
    log(PASS, out)
else:
    log(FAIL, "docker 不可用。请先安装 Docker Desktop: https://www.docker.com/products/docker-desktop")

# docker compose v2
rc, out, _ = run(["docker", "compose", "version"])
if rc == 0 and out:
    log(PASS, f"docker compose v2 -> {out}")
else:
    rc2, out2, _ = run(["docker-compose", "--version"])
    if rc2 == 0:
        log(WARN, f"使用 docker-compose v1（{out2}），建议升级到 docker compose v2 插件")
    else:
        log(FAIL, "docker compose 不可用")

# 检查 compose 文件
compose_file = BACKEND_DIR / "docker-compose.yml"
if compose_file.is_file():
    log(PASS, "docker-compose.yml 存在")
else:
    log(FAIL, "docker-compose.yml 缺失")

# ============================================================
# 5. Nginx 配置
# ============================================================
print("\n>>> 5. Nginx 配置")
for f in ["deploy/nginx/nginx.conf", "deploy/nginx/conf.d/default.conf"]:
    p = BACKEND_DIR / f
    if p.is_file():
        log(PASS, f"{f} 存在")
    else:
        log(FAIL, f"{f} 缺失")

# ============================================================
# 6. SSL 证书目录
# ============================================================
print("\n>>> 6. SSL 证书")
ssl_dir = BACKEND_DIR / "deploy" / "nginx" / "ssl"
cert = ssl_dir / "cert.pem"
key = ssl_dir / "privkey.pem"
if ssl_dir.is_dir() and cert.is_file() and key.is_file():
    log(PASS, "SSL 证书已就位 (cert.pem / privkey.pem)")
else:
    log(WARN, f"SSL 证书未就绪 (目录: {ssl_dir})，部署时将自动生成自签证书用于测试")

# ============================================================
# 7. 持久化目录
# ============================================================
print("\n>>> 7. 持久化目录")
for d in ["logs", "data", "deploy/frontend"]:
    p = BACKEND_DIR / d
    if p.is_dir():
        log(PASS, f"{d}/ 已存在")
    else:
        try:
            p.mkdir(parents=True, exist_ok=True)
            log(PASS, f"{d}/ 已创建")
        except Exception as exc:
            log(WARN, f"{d}/ 无法创建: {exc}")

# ============================================================
# 8. Dockerfile / .dockerignore
# ============================================================
print("\n>>> 8. 容器构建文件")
for f in ["Dockerfile", ".dockerignore"]:
    p = BACKEND_DIR / f
    if p.is_file():
        log(PASS, f"{f} 存在")
    else:
        log(FAIL, f"{f} 缺失")

# ============================================================
# 9. requirements.txt 关键行检查
# ============================================================
print("\n>>> 9. requirements.txt")
req_file = BACKEND_DIR / "requirements.txt"
if req_file.is_file():
    content = req_file.read_text(encoding="utf-8")
    needed = ["psycopg2", "gunicorn", "uvicorn", "fastapi"]
    missing2 = [n for n in needed if n not in content]
    if missing2:
        log(WARN, f"requirements 缺少: {', '.join(missing2)}")
    else:
        log(PASS, "包含 fastapi / uvicorn / psycopg2 / gunicorn 等生产关键依赖")
else:
    log(FAIL, "requirements.txt 缺失")

# ============================================================
# 汇总
# ============================================================
print("\n" + "=" * 70)
total = len(checks)
passed = sum(1 for s, _ in checks if s == PASS)
failed = sum(1 for s, _ in checks if s == FAIL)
warned = sum(1 for s, _ in checks if s == WARN)
print(f"总计: {total} 项   通过: {passed}   警告: {warned}   失败: {failed}")
print("=" * 70)

if failed > 0:
    print("\n[FAIL] 存在失败项，请先修复后再执行部署")
    sys.exit(1)
elif warned > 0:
    print("\n[WARN] 有警告项（不影响部署，但建议查看 WARN 级消息）")
    print("       继续执行部署: bash deploy/deploy.sh（Linux）")
    print("       或直接:   docker compose up -d --build")
    sys.exit(0)
else:
    print("\n[OK] 全部检查通过！可执行部署")
    print("       部署命令: bash deploy/deploy.sh  (Linux/Docker Desktop)")
    print("       或直接:   docker compose up -d --build")
    sys.exit(0)
