# @openmt/scied-ui

OpenMTSciEd 共享 Angular UI 组件库，供 **OpenMTEduInst** 与 **OpenMTSciEd desktop-manager** 复用。

## 安装（Monorepo 内）

已在 `frontend/tsconfig.json` 配置路径别名：

```typescript
import {
  SciEdResourceGridComponent,
  SciEdResourceItem,
} from '@openmt/scied-ui';
```

在应用全局样式中引入主题变量（EduInst 已在 `src/styles.css` 引入）：

```css
@import '../../projects/scied-ui/src/lib/styles/scied-theme.css';
```

## 组件

| 选择器 | 说明 |
|--------|------|
| `scied-page-header` | 页面标题 + `[sciedActions]` 操作区 |
| `scied-state-card` | 加载 / 警告 / 错误状态 |
| `scied-stats-grid` | 统计卡片网格 |
| `scied-search-input` | 搜索输入框 |
| `scied-resource-card` | 单条资源卡片 |
| `scied-resource-grid` | 资源卡片网格（含 loading / empty） |
| `scied-resource-detail-panel` | 资源详情面板 |

## 主题

通过 CSS 变量覆盖默认样式：

```css
:root {
  --scied-primary: #2563eb;
  --scied-text: #0f172a;
  --scied-muted: #64748b;
  --scied-border: #e2e8f0;
  --scied-surface: #ffffff;
}
```

## 构建（发布到 npm / 本地 link）

```bash
cd frontend
npm install
npm run build:scied-ui
```

输出目录：`frontend/dist/scied-ui`

### desktop-manager 接入（可选）

```bash
cd frontend && npm run build:scied-ui
cd ../OpenMTSciEd/desktop-manager
npm install ../../OpenMTEduInst/frontend/dist/scied-ui
```

或在 `desktop-manager/tsconfig.json` 增加 paths 指向 `OpenMTEduInst/frontend/projects/scied-ui/src/public-api.ts`（开发联调）。

## EduInst 已迁移页面

- `teaching-resources.component.ts` — 全面使用 `@openmt/scied-ui`
