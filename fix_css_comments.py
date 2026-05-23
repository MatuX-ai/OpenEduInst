import re

file_path = r'g:\OpenMTEduInst\frontend\src\app\organization-management\organization-portal\organization-dashboard.component.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 只删除行尾的 CSS 注释（// 数字px 或 // #颜色）
content = re.sub(r'(// \d+px.*$|// #[0-9a-fA-F]+.*$)', '', content, flags=re.MULTILINE)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("CSS comments removed successfully")
