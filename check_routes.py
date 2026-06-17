#!/usr/bin/env python3
"""List org-scoped routes from OpenAPI"""
import json
with open('/tmp/oa.json') as f:
    d = json.load(f)
paths = [p for p in d.get('paths', {}).keys() if 'educational_institution/org' in p]
print(len(paths), 'org-scoped routes')
for p in sorted(paths):
    print(p)