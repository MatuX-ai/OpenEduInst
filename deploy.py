#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OpenMT 一键部署脚本
====================
支持从任意 IDE / 终端直接运行，自动定位项目根目录。
兼容 Windows / macOS / Linux。

用法:
    python deploy.py              # 完整部署（构建前端 + 同步 + Docker 重建）
    python deploy.py --no-build   # 跳过前端构建（仅同步 + Docker 重建）
    python deploy.py --sync-only  # 仅同步代码，不操作 Docker
    python deploy.py --restart    # 仅重启 Docker 服务（不构建不 rsync）
    python deploy.py --config my_config.json  # 使用自定义配置文件
"""

import argparse
import json
import os
import shlex
import shutil
import subprocess
import sys
import time
from pathlib import Path

# ── 兼容 Windows 终端 GBK 编码 ──────────────────────────────
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# ── ANSI 颜色（自动检测终端支持） ────────────────────────────
_has_color = sys.stdout.isatty() if hasattr(sys.stdout, "isatty") else False

if sys.platform == "win32":
    try:
        import ctypes
        kernel32 = ctypes.windll.kernel32
        kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
        _has_color = True
    except Exception:
        pass

GREEN  = "\033[32m" if _has_color else ""
YELLOW = "\033[33m" if _has_color else ""
RED    = "\033[31m" if _has_color else ""
CYAN   = "\033[36m" if _has_color else ""
BOLD   = "\033[1m"  if _has_color else ""
RESET  = "\033[0m"  if _has_color else ""

ICON_STEP = ">>" if not _has_color else "\u25b6"
ICON_OK   = "OK" if not _has_color else "\u2713"
ICON_WARN = "!!" if not _has_color else "\u26a0"
ICON_ERR  = "XX" if not _has_color else "\u2717"


def step(msg: str):
    print(f"\n{GREEN}{ICON_STEP} {msg}{RESET}")


def ok(msg: str):
    print(f"  {GREEN}{ICON_OK}{RESET} {msg}")


def warn(msg: str):
    print(f"  {YELLOW}{ICON_WARN}{RESET} {msg}")


def error(msg: str):
    print(f"  {RED}{ICON_ERR}{RESET} {msg}")


def info(msg: str):
    print(f"  {CYAN}  {msg}{RESET}")


# ── 工具函数 ─────────────────────────────────────────────────

def find_project_root() -> Path:
    """向上查找包含部署标记文件的目录作为项目根目录"""
    markers = [
        "backend/docker-compose.lite.yml",
        "deploy_config.json",
        "deploy.py",
    ]
    current = Path(__file__).resolve().parent if "__file__" in dir() else Path.cwd()

    for _ in range(10):
        for marker in markers:
            if (current / marker).exists():
                return current
        parent = current.parent
        if parent == current:
            break
        current = parent

    # 回退：使用脚本所在目录或当前目录
    try:
        return Path(__file__).resolve().parent
    except NameError:
        return Path.cwd()


def load_config(config_path: Path) -> dict:
    """加载部署配置（JSON），缺失字段使用默认值"""
    defaults = {
        "server": {
            "host": "43.156.248.107",
            "user": "root",
            "ssh_key": "~/.ssh/id_ed25519",
            "remote_dir": "/opt/openmt",
            "port": 22,
        },
        "build": {
            "frontend_dir": "frontend",
            "dist_subdir": "dist/openmt-edu-inst",
            "deploy_target": "backend/deploy/frontend",
            "build_command": "npx ng build --configuration production",
            "skip_frontend_build": False,
        },
        "docker": {
            "compose_dir": "backend",
            "compose_file": "docker-compose.lite.yml",
            "env_file": ".env",
            "no_cache": True,
            "health_check_port": 8000,
            "health_wait_seconds": 15,
        },
        "sync": {
            "method": "rsync",
            "exclude": [
                ".git", "__pycache__", "*.pyc",
                "node_modules", ".venv", "venv",
                "logs", "data", ".env",
                "deploy/nginx/ssl", ".mypy_cache",
                "deploy_tmp",
            ],
        },
        "urls": {
            "main_site": "https://jigou.matux.tech",
        },
    }

    if config_path and config_path.exists():
        with open(config_path, "r", encoding="utf-8") as f:
            user_config = json.load(f)
        # 浅合并（仅顶层 key）
        for section in defaults:
            if section in user_config:
                defaults[section].update(user_config[section])
        info(f"已加载配置: {config_path}")

    return defaults


def resolve_path(raw: str) -> str:
    """解析 ~ 开头的路径"""
    if raw.startswith("~/"):
        return os.path.join(os.path.expanduser("~"), raw[2:])
    if raw.startswith("~\\"):
        return os.path.join(os.path.expanduser("~"), raw[2:])
    return raw


def which(program: str) -> bool:
    """检查某个命令是否可用"""
    return shutil.which(program) is not None


def run(cmd, cwd=None, check=True, capture=False, timeout=None):
    """执行命令并打印（Windows 兼容：自动解析 .cmd / .ps1 扩展）"""
    use_shell = False

    if isinstance(cmd, list):
        display = " ".join(shlex.quote(str(x)) for x in cmd)
        # Windows: 自动将第一个命令解析为正确的可执行文件（如 npx -> npx.cmd）
        if sys.platform == "win32" and len(cmd) > 0:
            resolved = shutil.which(cmd[0])
            if resolved and resolved != cmd[0]:
                cmd = [resolved] + list(cmd[1:])
    else:
        display = str(cmd)
        # Windows 下字符串命令走 shell，否则 npx/node 等 .cmd 命令无法执行
        if sys.platform == "win32":
            use_shell = True

    max_len = 120
    print(f"  $ {display[:max_len]}{'...' if len(display) > max_len else ''}")

    try:
        if capture:
            result = subprocess.run(
                cmd, cwd=cwd, capture_output=True, text=True, shell=use_shell,
                timeout=timeout, encoding="utf-8", errors="replace",
            )
        else:
            result = subprocess.run(
                cmd, cwd=cwd, timeout=timeout, shell=use_shell,
            )
    except subprocess.TimeoutExpired:
        raise RuntimeError(f"命令超时: {display[:100]}")

    if check and result.returncode != 0:
        if capture:
            print(f"  {RED}stderr:{RESET} {result.stderr[:500]}")
        raise RuntimeError(f"命令失败 (exit={result.returncode}): {display[:100]}")

    return result


def ssh(cmd: str, config: dict, check=False, capture=False):
    """通过 SSH 执行远程命令"""
    server = config["server"]
    key_path = resolve_path(server["ssh_key"])

    ssh_cmd = [
        "ssh",
        "-i", key_path,
        "-o", "ConnectTimeout=15",
        "-o", "StrictHostKeyChecking=accept-new",
        "-o", "BatchMode=yes",
    ]
    if server.get("port") and server["port"] != 22:
        ssh_cmd += ["-p", str(server["port"])]

    ssh_cmd.append(f"{server['user']}@{server['host']}")
    ssh_cmd.append(cmd)

    return run(ssh_cmd, check=check, capture=capture)


# ── 部署步骤 ─────────────────────────────────────────────────

def check_prerequisites(config: dict) -> None:
    """检查前置条件"""
    step("检查前置条件")

    required_local = ["ssh"]
    if not config["build"].get("skip_frontend_build", False):
        required_local.extend(["node", "npx"])

    missing = [c for c in required_local if not which(c)]
    if missing:
        error(f"缺少必要工具: {', '.join(missing)}")
        if "rsync" in missing:
            info("提示: Windows 可通过 'choco install rsync' 或 WSL 安装 rsync")
        if "node" in missing:
            info("提示: 请安装 Node.js https://nodejs.org/")
        sys.exit(1)

    ok(f"本地工具就绪 ({', '.join(required_local)})")

    # 检查 SSH 密钥
    key_path = Path(resolve_path(config["server"]["ssh_key"]))
    if not key_path.exists():
        warn(f"SSH 密钥不存在: {key_path}")
        warn("请先运行: ssh-keygen -t rsa -b 4096")
        warn(f"然后: ssh-copy-id {config['server']['user']}@{config['server']['host']}")
        sys.exit(1)
    ok(f"SSH 密钥: {key_path}")


def check_ssh(config: dict) -> None:
    """检查 SSH 到远程服务器是否正常"""
    step("检查 SSH 连接")

    server = config["server"]
    r = ssh("hostname", config, capture=True)
    if r.returncode != 0:
        error(f"无法连接到 {server['user']}@{server['host']}")
        error(f"SSH stderr: {r.stderr.strip()[:200]}")
        info("提示: 确保服务器可访问且 SSH 密钥已授权")
        sys.exit(1)

    ok(f"已连接到 {r.stdout.strip()} ({server['host']})")


def build_frontend(config: dict, root: Path) -> bool:
    """构建 Angular 前端"""
    build_cfg = config["build"]

    if build_cfg.get("skip_frontend_build", False):
        step("跳过前端构建 (skip_frontend_build=true)")
        return True

    step("构建前端 (Angular production)")

    frontend_dir = root / build_cfg["frontend_dir"]
    if not frontend_dir.exists():
        error(f"前端目录不存在: {frontend_dir}")
        return False

    r = run(
        build_cfg["build_command"].split(),
        cwd=str(frontend_dir),
        check=False,
    )
    if r.returncode != 0:
        error("前端构建失败，请检查编译错误")
        return False

    ok("前端构建完成")
    return True


def copy_dist(config: dict, root: Path) -> bool:
    """复制 Angular dist 产物到 deploy 目录"""
    step("复制前端构建产物")

    build_cfg = config["build"]
    dist_src = root / build_cfg["frontend_dir"] / build_cfg["dist_subdir"]
    deploy_dst = root / build_cfg["deploy_target"]

    if not dist_src.exists():
        error(f"构建产物目录不存在: {dist_src}")
        return False

    # 清理目标目录
    if deploy_dst.exists():
        for item in deploy_dst.iterdir():
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()
    else:
        deploy_dst.mkdir(parents=True, exist_ok=True)

    # 复制
    count = 0
    for item in dist_src.iterdir():
        if item.is_dir():
            shutil.copytree(item, deploy_dst / item.name, dirs_exist_ok=True)
        else:
            shutil.copy2(item, deploy_dst / item.name)
        count += 1

    ok(f"已复制 {count} 项到 {build_cfg['deploy_target']}")
    return True


def sync_code(config: dict, root: Path) -> bool:
    """同步代码到远程服务器

    注意: 只同步 backend/ 子目录（前端已编译复制到 backend/deploy/frontend/，
          避免把整个项目（含 frontend/node_modules）打包传输。"""
    step("同步代码到服务器（仅 backend/ 目录）")

    server = config["server"]
    sync_cfg = config["sync"]
    key_path = resolve_path(server["ssh_key"])
    remote = f"{server['user']}@{server['host']}"

    # 只同步 backend/ 子目录（~7 MB，前端 build 已复制进入此目录下的 deploy/frontend)
    backend_root = root / "backend"
    info(f"同步根目录: {backend_root}")
    remote_backend = f"{server['remote_dir']}/backend"

    if not backend_root.exists():
        error(f"backend 目录不存在: {backend_root}")
        return False

    if sync_cfg.get("method") == "rsync":
        if not which("rsync"):
            warn("系统未安装 rsync，尝试使用 SSH + tar 方式同步")
            return _sync_via_tar(config, backend_root, remote_backend)

        exclude_args = []
        for pattern in sync_cfg.get("exclude", []):
            exclude_args.append(f"--exclude={pattern}")

        rsync_cmd = [
            "rsync", "-avz", "--delete",
        ] + exclude_args + [
            "-e", f"ssh -i \"{key_path}\" -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new",
            f"{backend_root}/",
            f"{remote}:{remote_backend}/",
        ]

        r = run(rsync_cmd, check=False)
        if r.returncode != 0:
            error("rsync 同步失败")
            return False
    else:
        return _sync_via_tar(config, backend_root, remote_backend)

    ok("代码同步完成")
    return True


def _sync_via_tar(config: dict, src_root: Path, remote_dir: str) -> bool:
    """通过 SCP + tar 传输文件（Windows 原生兼容，无需 rsync）
    三步流程:
      1) 本地 tar czf 打包
      2) scp 上传到远程服务器
      3) SSH 在远端 tar xzf 解包并清理
    """
    server = config["server"]
    sync_cfg = config["sync"]
    key_path = resolve_path(server["ssh_key"])
    remote = f"{server['user']}@{server['host']}"

    info("使用 SCP + tar 传输（Windows 无 rsync 时的可靠方案）")

    # Step 1: 本地创建 tar.gz
    step("1/3 — 本地打包")
    archive_name = "deploy_sync.tar.gz"
    archive_path = src_root.parent / archive_name
    if archive_path.exists():
        archive_path.unlink()

    exclude_args = []
    for pattern in sync_cfg.get("exclude", []):
        exclude_args.extend(["--exclude", pattern])

    tar_cmd = ["tar", "czf", str(archive_path)] + exclude_args + ["-C", str(src_root), "."]
    r = run(tar_cmd, cwd=str(src_root), check=False)
    if r.returncode != 0:
        error("本地打包失败")
        return False

    size_mb = archive_path.stat().st_size / 1024 / 1024
    ok(f"打包完成: {archive_name} ({size_mb:.1f} MB)")

    # Step 2: SCP 上传
    step("2/3 — SCP 上传到服务器")
    scp_cmd = [
        "scp",
        "-i", key_path,
        "-o", "ConnectTimeout=15",
        "-o", "StrictHostKeyChecking=accept-new",
        "-o", "BatchMode=yes",
        str(archive_path),
        f"{remote}:{remote_dir}/{archive_name}",
    ]
    r = run(scp_cmd, check=False)
    if r.returncode != 0:
        error("SCP 上传失败")
        try:
            archive_path.unlink()
        except OSError:
            pass
        return False
    ok("上传完成")

    # 立即删除本地打包文件（节省磁盘）
    try:
        archive_path.unlink()
    except OSError:
        pass

    # Step 3: 远程解包
    step("3/3 — 远程解包并清理")
    ssh(f"mkdir -p {remote_dir}", config, check=False, capture=True)

    remote_cmd = (
        f"cd {remote_dir} && "
        f"tar xzf {archive_name} && "
        f"rm -f {archive_name}"
    )
    r = ssh(remote_cmd, config, check=False)
    if r.returncode != 0:
        error("远程解包失败")
        return False

    ok("代码同步完成 (SCP+tar)")
    return True


def docker_operations(config: dict, do_build: bool = True) -> bool:
    """远程 Docker 操作: down / build / up"""
    server = config["server"]
    docker_cfg = config["docker"]
    compose_dir = f"{server['remote_dir']}/{docker_cfg['compose_dir']}"
    compose_args = f"-f {docker_cfg['compose_file']} --env-file {docker_cfg['env_file']}"

    # Step 1: Down
    step("Docker - 停止现有服务")
    r = ssh(
        f"cd {compose_dir} && docker compose {compose_args} down",
        config, check=False, capture=True,
    )
    if r.returncode != 0:
        warn("docker compose down 失败（可能是首次运行）")
    else:
        ok("服务已停止")

    if not do_build:
        step("Docker - 启动服务（跳过构建）")
        r = ssh(
            f"cd {compose_dir} && docker compose {compose_args} up -d",
            config,
        )
        if r.returncode != 0:
            error("Docker 启动失败")
            return False
        ok("Docker 服务已启动")
        return True

    # Step 2: Build
    no_cache_flag = "--no-cache" if docker_cfg.get("no_cache", True) else ""
    step("Docker - 重建镜像" + (" (--no-cache)" if no_cache_flag else ""))
    r = ssh(
        f"cd {compose_dir} && docker compose {compose_args} build {no_cache_flag}",
        config,
    )
    if r.returncode != 0:
        error("Docker 镜像构建失败")
        return False
    ok("Docker 镜像构建完成")

    # Step 3: Up
    step("Docker - 启动服务")
    r = ssh(
        f"cd {compose_dir} && docker compose {compose_args} up -d",
        config,
    )
    if r.returncode != 0:
        error("Docker 启动失败")
        return False
    ok("Docker 服务已启动")

    return True


def health_check(config: dict) -> None:
    """健康检查"""
    docker_cfg = config["docker"]
    wait = docker_cfg.get("health_wait_seconds", 15)

    step(f"健康检查 (等待 {wait} 秒)...")
    time.sleep(wait)

    print(f"\n{BOLD}容器状态:{RESET}")
    server = config["server"]
    compose_dir = f"{server['remote_dir']}/{docker_cfg['compose_dir']}"
    compose_args = f"-f {docker_cfg['compose_file']}"

    ssh(f"cd {compose_dir} && docker compose {compose_args} ps", config)

    print(f"\n{BOLD}API 健康检查:{RESET}")
    port = docker_cfg.get("health_check_port", 8000)
    r = ssh(f"curl -fsS http://127.0.0.1:{port}/health", config, capture=True)
    if r.returncode == 0:
        ok(f"后端健康检查通过: {r.stdout.strip()}")
    else:
        warn("后端健康检查失败，请查看远程日志")
        info("排查: ssh 登录后执行 docker compose -f docker-compose.lite.yml logs api")


def print_banner(config: dict) -> None:
    """打印完成横幅"""
    url = config["urls"].get("main_site", "https://jigou.matux.tech")
    print(f"\n{GREEN}{'='*55}{RESET}")
    print(f"{GREEN}{BOLD}  部署完成！{RESET}")
    print(f"{GREEN}{'='*55}{RESET}")
    print(f"  访问地址: {CYAN}{url}{RESET}")
    print(f"  服务器:   {config['server']['host']}")
    print(f"  时间:     {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{GREEN}{'='*55}{RESET}\n")


# ── 主入口 ────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="OpenMT 一键部署到腾讯云 Lighthouse",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python deploy.py                    # 完整部署
  python deploy.py --no-build         # 跳过前端构建
  python deploy.py --sync-only        # 仅同步代码
  python deploy.py --restart          # 仅重启服务
  python deploy.py --config prod.json # 使用自定义配置
        """,
    )
    parser.add_argument("--config", default="deploy_config.json",
                        help="部署配置文件路径 (默认: deploy_config.json)")
    parser.add_argument("--no-build", action="store_true",
                        help="跳过前端构建")
    parser.add_argument("--sync-only", action="store_true",
                        help="仅同步代码，不操作 Docker")
    parser.add_argument("--restart", action="store_true",
                        help="仅重启远程 Docker 服务")
    parser.add_argument("--no-cache", action="store_true", default=None,
                        help="Docker 构建不使用缓存")
    parser.add_argument("--use-cache", action="store_true",
                        help="Docker 构建使用缓存")

    args = parser.parse_args()

    # 定位项目根目录
    root = find_project_root()

    # 加载配置
    config_path = root / args.config if not os.path.isabs(args.config) else Path(args.config)
    config = load_config(config_path)

    # 命令行覆盖
    if args.no_build:
        config["build"]["skip_frontend_build"] = True
    if args.no_cache is not None:
        config["docker"]["no_cache"] = True
    if args.use_cache:
        config["docker"]["no_cache"] = False

    # 打印部署信息
    server = config["server"]
    print(f"\n{BOLD}OpenMT 部署脚本{RESET}")
    print(f"  项目根目录: {root}")
    print(f"  目标服务器: {server['user']}@{server['host']}")
    print(f"  远程目录:   {server['remote_dir']}")
    print(f"  Docker:     {config['docker']['compose_file']}")
    if config["build"].get("skip_frontend_build"):
        print(f"  前端构建:   {YELLOW}跳过{RESET}")
    print()

    # ── 仅重启模式 ──
    if args.restart:
        check_ssh(config)
        docker_operations(config, do_build=False)
        health_check(config)
        print_banner(config)
        return

    # ── 完整部署流程 ──
    check_prerequisites(config)
    check_ssh(config)

    if not config["build"].get("skip_frontend_build", False):
        if not build_frontend(config, root):
            error("前端构建失败，部署中止")
            sys.exit(1)
        if not copy_dist(config, root):
            error("前端产物复制失败，部署中止")
            sys.exit(1)
    else:
        step("跳过前端构建")

    if not sync_code(config, root):
        error("代码同步失败，部署中止")
        sys.exit(1)

    if args.sync_only:
        ok("仅同步模式 - 跳过 Docker 操作")
        print_banner(config)
        return

    if not docker_operations(config):
        error("Docker 操作失败")
        sys.exit(1)

    health_check(config)
    print_banner(config)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{YELLOW}部署已取消{RESET}")
        sys.exit(130)
    except Exception as e:
        print(f"\n{RED}未预期的错误: {e}{RESET}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
