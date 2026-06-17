"""Find all @use lines in .ts and .scss files"""
import os

REPO = r"g:\OpenMTEduInst\frontend\src"
for root, _, files in os.walk(REPO):
    for fn in files:
        if not fn.endswith(('.ts', '.scss')):
            continue
        path = os.path.join(root, fn)
        with open(path, "rb") as fp:
            data = fp.read()
        try:
            text = data.decode("utf-8")
        except UnicodeDecodeError:
            continue
        for i, line in enumerate(text.split("\n"), 1):
            if "@use" in line and "design-tokens" in line:
                print(f"{path}:L{i}: {line.strip()[:120]}")
