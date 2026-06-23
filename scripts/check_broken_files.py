"""Check and fix broken Chinese encodings in .ts/.scss files"""
import os
import subprocess
import re

REPO = r"g:\OpenMTEduInst"
os.chdir(REPO)

# Get list of modified .ts/.scss files
result = subprocess.run(['git', 'diff', '--name-only', 'HEAD'], capture_output=True, text=True)
files = [f for f in result.stdout.split('\n') if f.endswith(('.ts', '.scss'))]

print(f"Total modified files: {len(files)}")

broken = []
for f in files:
    p = f
    if not os.path.exists(p):
        continue
    with open(p, 'rb') as fp:
        data = fp.read()
    try:
        text = data.decode('utf-8')
        # Count valid Chinese characters
        chinese = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
        # Count weird non-ASCII characters (not Chinese, not common Latin extended)
        weird = sum(1 for c in text if ord(c) > 127 and not ('\u4e00' <= c <= '\u9fff'))
        if weird > 5:
            broken.append((f, chinese, weird))
    except UnicodeDecodeError:
        broken.append((f, 0, -1))

print(f"Broken files: {len(broken)}")
for f, c, w in broken[:20]:
    print(f"  {f}: chinese={c}, weird={w}")
