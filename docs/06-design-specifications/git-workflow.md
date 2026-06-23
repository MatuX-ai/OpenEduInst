# Git 分支管理与提交规范

**文档版本**：v1.0
**最后更新**：2026-06-23

---

## 目录

1. [分支模型](#分支模型)
2. [提交信息规范](#提交信息规范)
3. [版本发布流程](#版本发布流程)
4. [版本历史](#版本历史)

---

## 分支模型

### 主要分支

| 分支 | 说明 | 特性 |
|------|------|------|
| `main` | 主分支，稳定版本 | 受保护，仅通过 PR 合并 |
| `develop` | 开发分支 | 日常开发合并到此 |
| `release/vX.Y.Z` | 发布分支 | 版本发布前准备 |
| `hotfix/*` | 紧急修复分支 | 基于 main 创建，修复后合并回 main + develop |

### 功能分支

```
# 开发新功能:
git checkout -b feature/学生管理模块 develop

# 修复 Bug:
git checkout -b bugfix/登录页输入框样式 develop

# 紧急修复:
git checkout -b hotfix/订单退款逻辑错误 main
```

---

## 提交信息规范

### Conventional Commits

```
<type>(<scope>): <subject>
│     │          │
│     │          └─  简短描述（中文，50 字符以内）
│     │
│     └──  影响范围 (模块/组件名，可选)
│
└────────  提交类型
```

### 提交类型

| 类型 | 说明 | 示例 |
|------|------|------|
| feat | 新功能 | `feat(学生): 新增学员 Excel 导入` |
| fix | Bug 修复 | `fix(财务): 修复订单退款金额计算错误` |
| docs | 文档变更 | `docs: 更新 API 文档` |
| style | 代码风格调整 | `style(前端): 统一按钮样式` |
| refactor | 代码重构 | `refactor(认证): 重构权限中间件` |
| test | 测试相关 | `test: 新增学员管理测试用例` |
| chore | 构建/工具链 | `chore: 更新依赖版本` |
| perf | 性能优化 | `perf(数据库): 优化学员列表查询` |
| revert | 回滚提交 | `revert: 回滚"新增学员 Excel 导入"` |

### 完整示例

```
feat(排课): 支持拖拽调整课时时间

- 实现日历视图拖拽
- 添加冲突检测提示
- 支持批量调整课时
- 优化移动端交互体验

关联 issue: #123
```

---

## 版本发布流程

```
# 1. 创建发布分支 (从 develop)
git checkout -b release/v1.1.0 develop

# 2. 准备发布 (更新版本号、更新 CHANGELOG)
# ...

# 3. 合并到 main
git checkout main
git merge --no-ff release/v1.1.0
git tag -a v1.1.0 -m "Release v1.1.0"

# 4. 合并回 develop
git checkout develop
git merge --no-ff release/v1.1.0

# 5. 删除发布分支
git branch -d release/v1.1.0

# 6. 推送
git push origin main develop --tags
```

---

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-06-23 | 初始版本，Git 分支与提交规范 |

---

**上一级**：[README.md](README.md)
