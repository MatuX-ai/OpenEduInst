"""Clean up C drive - Plan A+B
Usage: Run as Administrator!
"""
import os
import shutil
import subprocess
import sys

def get_size_gb(path):
    """Get size of directory in GB"""
    total = 0
    try:
        for dirpath, dirnames, filenames in os.walk(path):
            for f in filenames:
                try:
                    fp = os.path.join(dirpath, f)
                    if os.path.exists(fp):
                        total += os.path.getsize(fp)
                except (OSError, PermissionError):
                    pass
    except (OSError, PermissionError):
        pass
    return total / (1024**3)

def clean_temp():
    """Clean user temp directory"""
    temp = os.environ.get('TEMP', r'C:\Users\Administrator\AppData\Local\Temp')
    size_before = get_size_gb(temp)
    print(f"[Plan A-1] Temp: {size_before:.2f} GB -> cleaning...")
    deleted = 0
    errors = 0
    for entry in os.listdir(temp):
        path = os.path.join(temp, entry)
        try:
            if os.path.isfile(path) or os.path.islink(path):
                os.unlink(path)
                deleted += 1
            elif os.path.isdir(path):
                shutil.rmtree(path, ignore_errors=True)
                deleted += 1
        except (OSError, PermissionError):
            errors += 1
    size_after = get_size_gb(temp)
    print(f"[Plan A-1] Temp: {size_before:.2f} -> {size_after:.2f} GB (freed: {size_before-size_after:.2f} GB, errors: {errors})")
    return size_before - size_after

def clean_pip_cache():
    """Clean pip cache"""
    cache = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'pip', 'Cache')
    if not os.path.exists(cache):
        print("[Plan A-2] pip cache: not found")
        return 0
    size_before = get_size_gb(cache)
    print(f"[Plan A-2] pip cache: {size_before:.2f} GB -> cleaning...")
    try:
        shutil.rmtree(cache, ignore_errors=True)
    except Exception as e:
        print(f"  Error: {e}")
    print(f"[Plan A-2] pip cache: cleaned")
    return size_before

def clean_npm_cache():
    """Clean npm cache"""
    cache = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'npm-cache')
    if not os.path.exists(cache):
        print("[Plan A-3] npm cache: not found")
        return 0
    size_before = get_size_gb(cache)
    print(f"[Plan A-3] npm cache: {size_before:.2f} GB -> cleaning...")
    # Try npm cache clean first
    try:
        subprocess.run(['npm', 'cache', 'clean', '--force'],
                      capture_output=True, timeout=60, shell=True)
    except Exception as e:
        print(f"  npm clean error: {e}")
    # Force delete remaining
    try:
        shutil.rmtree(cache, ignore_errors=True)
    except Exception as e:
        print(f"  rm error: {e}")
    print(f"[Plan A-3] npm cache: cleaned")
    return size_before

def clean_user_cache():
    """Clean ~/.cache"""
    cache = os.path.join(os.environ.get('USERPROFILE', ''), '.cache')
    if not os.path.exists(cache):
        print("[Plan A-4] .cache: not found")
        return 0
    size_before = get_size_gb(cache)
    print(f"[Plan A-4] .cache: {size_before:.2f} GB -> cleaning...")
    try:
        shutil.rmtree(cache, ignore_errors=True)
    except Exception as e:
        print(f"  Error: {e}")
    print(f"[Plan A-4] .cache: cleaned")
    return size_before

def clean_windows_update():
    """Clean Windows Update cache"""
    cache = r'C:\Windows\SoftwareDistribution\Download'
    if not os.path.exists(cache):
        print("[Plan B-1] Windows Update cache: not found")
        return 0
    size_before = get_size_gb(cache)
    print(f"[Plan B-1] Windows Update: {size_before:.2f} GB -> cleaning...")
    # Stop service
    print("  Stopping wuauserv...")
    try:
        subprocess.run(['net', 'stop', 'wuauserv'], capture_output=True, timeout=30, shell=True)
    except Exception as e:
        print(f"  stop error: {e}")
    try:
        shutil.rmtree(cache, ignore_errors=True)
    except Exception as e:
        print(f"  rm error: {e}")
    # Start service
    print("  Starting wuauserv...")
    try:
        subprocess.run(['net', 'start', 'wuauserv'], capture_output=True, timeout=30, shell=True)
    except Exception as e:
        print(f"  start error: {e}")
    size_after = get_size_gb(cache)
    print(f"[Plan B-1] Windows Update: {size_before:.2f} -> {size_after:.2f} GB (freed: {size_before-size_after:.2f} GB)")
    return size_before - size_after

def clean_event_logs():
    """Clean Windows event logs"""
    print("[Plan B-2] Clearing Windows event logs...")
    total_freed = 0
    try:
        result = subprocess.run(['wevtutil', 'el'], capture_output=True, text=True, timeout=30, shell=True)
        if result.returncode == 0:
            logs = result.stdout.strip().split('\n')
            for log in logs:
                log = log.strip()
                if log:
                    try:
                        subprocess.run(['wevtutil', 'cl', log], capture_output=True, timeout=10, shell=True)
                    except Exception:
                        pass
            print(f"  Cleared {len(logs)} event logs")
    except Exception as e:
        print(f"  Error: {e}")
    return total_freed

if __name__ == '__main__':
    print("=" * 60)
    print("  C Drive Cleanup - Plan A+B")
    print("=" * 60)

    # Check admin
    import ctypes
    is_admin = ctypes.windll.shell32.IsUserAnAdmin() != 0
    print(f"Running as Admin: {is_admin}")
    if not is_admin:
        print("WARNING: Not running as Administrator. Some operations may fail.")

    total = 0

    # Plan A
    print("\n=== Plan A: Safe Cleanup ===")
    total += clean_temp()
    total += clean_pip_cache()
    total += clean_npm_cache()
    total += clean_user_cache()

    # Plan B
    print("\n=== Plan B: System Cleanup ===")
    total += clean_windows_update()
    total += clean_event_logs()

    print("\n" + "=" * 60)
    print(f"  Total freed (estimated): {total:.2f} GB")
    print("=" * 60)
