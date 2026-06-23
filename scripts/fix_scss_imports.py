"""Fix all SCSS @use references to use a consistent short path.

Replace all:
  @use '../../.../styles/design-tokens' as tokens;
  @use '../../.../styles/design-tokens' as *;
With:
  @use 'design-tokens' as tokens;
  @use 'design-tokens' as *;
"""
import os
import re

REPO = r"g:\OpenMTEduInst\frontend\src"
PATTERN = re.compile(
    r"@use '(\.\./)+styles/design-tokens'(\s+as\s+(?:\*|tokens))?"
)

count = 0
files_changed = 0
for root, _, files in os.walk(REPO):
    for fn in files:
        if not fn.endswith(('.ts', '.scss')):
            continue
        path = os.path.join(root, fn)
        with open(path, 'rb') as fp:
            data = fp.read()
        try:
            text = data.decode('utf-8')
        except UnicodeDecodeError:
            continue
        if not PATTERN.search(text):
            continue
        new_text = PATTERN.sub(lambda m: f"@use 'design-tokens'{m.group(2) or ''}", text)
        if new_text == text:
            continue
        # Write back as UTF-8 (no BOM)
        with open(path, 'wb') as fp:
            fp.write(new_text.encode('utf-8'))
        files_changed += 1
        count += len(PATTERN.findall(text))

print(f"Files updated: {files_changed}")
print(f"Total replacements: {count}")
