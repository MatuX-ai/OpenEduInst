#!/usr/bin/env python3
"""
阶段二验收脚本（Python 版，无需 Node 依赖）
校验：
  1. XLSX 按需加载封装服务存在且使用 dynamic import
  2. batch-operations.service 已移除静态 XLSX 导入
  3. ECharts 模块按需注册图表类型
  4. angular.json 包预算收紧 + 移除 prebuilt-themes
  5. styles.css 引入 material-overrides
  6. _material-overrides.scss 存在且覆盖核心组件
  7. 业务侧无 ::ng-deep 使用
  8. sidebar design tokens 已定义
  9. 响应式 mixin 可用
 10. 7 个组件已切换至 @include mx.responsive() 调用
"""
import os
import re
import sys
from pathlib import Path

ROOT = Path(r"g:\OpenMTEduInst")
FRONTEND = ROOT / "frontend"
SRC = FRONTEND / "src"
STYLES = SRC / "styles"
APP = SRC / "app"

CHECKS = []


def add(name, passed, detail=""):
    CHECKS.append((name, passed, detail))


def read(p):
    try:
        return Path(p).read_text(encoding="utf-8")
    except Exception:
        return ""


def exists(p):
    return Path(p).exists()


def walk_src():
    """遍历 src 下所有 .ts/.scss 文件"""
    out = []
    for root, dirs, files in os.walk(SRC):
        # 排除依赖与构建目录
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".angular", "dist", "__pycache__")]
        for f in files:
            if f.endswith((".ts", ".scss")):
                out.append(Path(root) / f)
    return out


# 1. XlsxLoaderService
xlsx_loader = APP / "core" / "services" / "xlsx-loader.service.ts"
add("XlsxLoaderService 文件存在", exists(xlsx_loader), str(xlsx_loader))
src = read(xlsx_loader)
add("XlsxLoaderService 使用 dynamic import('xlsx')",
    bool(re.search(r"import\(['\"]xlsx['\"]\)", src)))

# 2. batch-operations.service
batch_ops = APP / "organization-management" / "organization-portal" / "services" / "batch-operations.service.ts"
src = read(batch_ops)
add("batch-operations.service 移除静态 XLSX 导入",
    "import * as XLSX from 'xlsx'" not in src and "XlsxLoaderService" in src)
add("batch-operations.service 使用 async + xlsxLoader.load()",
    "async parseExcelFile" in src and "this.xlsxLoader.load()" in src and "from(" in src and "switchMap" in src)

# 3. ECharts 模块按需注册
echarts_module = APP / "admin" / "institution-management" / "institution-management.module.ts"
src = read(echarts_module)
add("ECharts 模块按需注册图表类型",
    "import('echarts').then" in src and "m.use([" in src and "LineChart" in src and "CanvasRenderer" in src)

# 4. angular.json
aj = read(FRONTEND / "angular.json")
add("angular.json 包预算收紧 (1.2mb/1.5mb, 8kb/12kb)",
    '"maximumWarning": "1.2mb"' in aj
    and '"maximumError": "1.5mb"' in aj
    and '"maximumWarning": "8kb"' in aj
    and '"maximumError": "12kb"' in aj)
add("angular.json 移除 prebuilt-themes", "prebuilt-themes" not in aj)
add("angular.json 开启 optimization/buildOptimizer", '"optimization": true' in aj and '"buildOptimizer": true' in aj)

# 5. styles.css
sc = read(SRC / "styles.css")
add("styles.css 引入 material-overrides", "material-overrides" in sc)

# 6. _material-overrides.scss
mo = STYLES / "_material-overrides.scss"
add("_material-overrides.scss 文件存在", exists(mo))
src = read(mo)
add("material-overrides 覆盖 .mat-mdc-table", ".mat-mdc-table" in src)
add("material-overrides 覆盖 .mat-mdc-tab", ".mat-mdc-tab" in src)
add("material-overrides 覆盖 .mat-mdc-raised-button", ".mat-mdc-raised-button" in src)
add("material-overrides 覆盖 .mat-drawer", ".mat-drawer" in src)
add("material-overrides 覆盖 mat-card-header", "mat-card-header" in src)
add("material-overrides 覆盖 .modern-tabs", ".modern-tabs" in src)
add("material-overrides 覆盖 .cd-main-card", ".cd-main-card" in src)
add("material-overrides 覆盖 .unified-dashboard-tabs", ".unified-dashboard-tabs" in src)

# 7. ::ng-deep 计数
ng_deep_count = 0
ng_deep_files = []
for f in walk_src():
    if f.name == "_material-overrides.scss":
        continue
    content = read(f)
    matches = re.findall(r"::ng-deep", content)
    if matches:
        ng_deep_count += len(matches)
        ng_deep_files.append((f, len(matches)))
add("业务侧无 ::ng-deep 使用", ng_deep_count == 0,
    f"发现 {ng_deep_count} 处，文件: {[(str(f.relative_to(ROOT)), n) for f, n in ng_deep_files[:3]]}")

# 8. sidebar tokens
dt = read(STYLES / "design-tokens.scss")
add("design-tokens.scss 定义 $sidebar-bg", "$sidebar-bg:" in dt)
add("design-tokens.scss 定义 $sidebar-active-bg", "$sidebar-active-bg:" in dt)
add("design-tokens.scss 定义 $sidebar-text-primary", "$sidebar-text-primary:" in dt)
add("design-tokens.scss 定义 $sidebar-text-tertiary", "$sidebar-text-tertiary:" in dt)
add("design-tokens.scss 定义 $sidebar-accent-from", "$sidebar-accent-from:" in dt)

# 9. 响应式 mixin
mx = read(STYLES / "shared" / "_mixins.scss")
add("_mixins.scss 提供 @mixin responsive($bp)", "@mixin responsive($bp)" in mx)
add("_mixins.scss 使用 design-tokens 断点变量", "tokens.$breakpoint-sm" in mx and "tokens.$breakpoint-md" in mx and "tokens.$breakpoint-lg" in mx)

# 10. 至少 7 个组件已切换
files_using_responsive = []
for f in walk_src():
    if f.name.endswith(".ts") and "@use 'shared/mixins' as mx" in read(f) and "@include mx.responsive" in read(f):
        files_using_responsive.append(str(f.relative_to(ROOT)))
add("至少 7 个组件已切换至 @include mx.responsive()",
    len(files_using_responsive) >= 7,
    f"实际 {len(files_using_responsive)} 个: {files_using_responsive}")

# 11. _theme.scss 自定义品牌色
theme = read(STYLES / "_theme.scss")
add("_theme.scss 自定义品牌主色 (#1976d2)", "#1976d2" in theme or "1976d2" in theme)
add("_theme.scss 定义 mat.define-light-theme", "mat.define-light-theme" in theme or "mat.define-dark-theme" in theme)

# 12. _reset.scss 存在
add("_reset.scss 存在", exists(STYLES / "_reset.scss"))

# 13. 检查 design-tokens 暴露 5 个断点
add("design-tokens.scss 暴露 sm/md/lg/xl 4 个断点",
    all(f"$breakpoint-{bp}:" in dt for bp in ("sm", "md", "lg", "xl")))


# 输出
print("\n" + "=" * 60)
print("  阶段二验收：前端工程化与 UI 一致性")
print("=" * 60 + "\n")

passed = 0
for i, (name, ok, detail) in enumerate(CHECKS, 1):
    status = "[OK]" if ok else "[FAIL]"
    print(f"{status} [{i:2d}/{len(CHECKS)}] {name}")
    if not ok and detail:
        print(f"       -> {detail}")
    if ok:
        passed += 1

print(f"\n通过: {passed}/{len(CHECKS)} ({100 * passed / len(CHECKS):.0f}%)\n")

sys.exit(0 if passed == len(CHECKS) else 1)
