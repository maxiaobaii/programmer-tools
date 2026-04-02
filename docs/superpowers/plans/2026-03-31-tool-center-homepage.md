# Tool Center Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把当前单页 JSON 工具站升级为“工具集首页 + JSON 工具详情页”的双层结构：首页展示卡片入口，点击后进入独立工具页。

**Architecture:** 引入 `vue-router` 提供真正的 `/` 与 `/json` 页面路由；把当前 `App.vue` 里的 JSON 工具工作台抽到独立页面组件中，首页通过统一的工具配置渲染卡片。主页负责工具中心展示，JSON 工具页负责承载现有 tab 工作台，并补上返回首页、标题和简介等页面级外壳。

**Tech Stack:** Vue 3, Vite, JavaScript, Vue Router, CSS, Composition API

---

### Task 1: 接入页面路由与工具注册表

**Files:**
- Create: `src/router/index.js`
- Create: `src/data/tools.js`
- Modify: `package.json`
- Modify: `src/main.js`
- Modify: `src/App.vue`
- Test: `npm run build`
- Test: `npm run type-check`

- [ ] **Step 1: 给路由接入写出最小目标结构**

目标是让项目具备两个页面入口：

```js
// src/data/tools.js
export const tools = [
  {
    id: 'json-tools',
    title: 'JSON 转换',
    description: '格式化、压缩、校验、树视图、Diff、类型生成',
    path: '/json',
    icon: 'convert',
    badge: '已上线',
  },
]
```

```js
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import JsonToolsPage from '../pages/JsonToolsPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/json', name: 'json-tools', component: JsonToolsPage },
  ],
})
```

- [ ] **Step 2: 安装 `vue-router` 并更新依赖**

把 `package.json` 改成包含：

```json
{
  "dependencies": {
    "vue": "^3.5.12",
    "vue-router": "^4.5.1"
  }
}
```

运行：`npm install`

预期：`package-lock.json` 更新，安装成功，无 peer dependency 报错。

- [ ] **Step 3: 改造应用入口让路由生效**

把 `src/main.js` 改成：

```js
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router/index.js'
import './style.css'

createApp(App).use(router).mount('#app')
```

把 `src/App.vue` 缩成真正的壳：

```vue
<template>
  <RouterView />
</template>

<script setup>
</script>
```

- [ ] **Step 4: 运行构建验证路由接线无误**

运行：`npm run build`

预期：Vite build 成功，无 `Failed to resolve import 'vue-router'`。

- [ ] **Step 5: 运行类型检查确认入口改造无误**

运行：`npm run type-check`

预期：通过，无新增页面级类型错误。

- [ ] **Step 6: 提交本任务**

```bash
git add package.json package-lock.json src/main.js src/App.vue src/router/index.js src/data/tools.js
git commit -m "feat: add tool-center routing shell"
```

### Task 2: 抽离现有 JSON 工具工作台为独立工具页

**Files:**
- Create: `src/components/JsonWorkbench.vue`
- Create: `src/pages/JsonToolsPage.vue`
- Modify: `src/App.vue`
- Modify: `src/style.css`
- Test: `npm run build`

- [ ] **Step 1: 抽出当前 JSON 工作台主体组件**

把当前 `src/App.vue` 里这部分迁到新组件：

- 品牌区与主题切换
- tab 导航
- 现有各功能 tab 切换逻辑
- `showCopy` / `flashCopy` / `applyTheme` / `toggleTheme`

新组件结构目标：

```vue
<!-- src/components/JsonWorkbench.vue -->
<template>
  <div class="json-workbench">
    <nav class="navbar" :class="{ 'navbar-mobile': isPhone }">
      <!-- 保留现有品牌、tab、主题切换 -->
    </nav>

    <div class="main-area">
      <FormatTab v-if="activeTab === 'format'" />
      <CompressTab v-else-if="activeTab === 'compress'" />
      <ValidateTab v-else-if="activeTab === 'validate'" />
      <EscapeTab v-else-if="activeTab === 'escape'" />
      <TreeTab v-else-if="activeTab === 'tree'" />
      <ConvertTab v-else-if="activeTab === 'convert'" />
      <JsonPathTab v-else-if="activeTab === 'jsonpath'" />
      <TypesTab v-else-if="activeTab === 'types'" />
      <JavaTypesTab v-else-if="activeTab === 'java'" />
      <DiffTab v-else-if="activeTab === 'diff'" />
    </div>
  </div>
</template>
```

- [ ] **Step 2: 创建 JSON 工具详情页外壳**

新增页面组件：

```vue
<!-- src/pages/JsonToolsPage.vue -->
<template>
  <div class="tool-page">
    <header class="tool-page-header">
      <RouterLink class="tool-page-back" to="/">← 返回工具集</RouterLink>
      <div class="tool-page-meta">
        <p class="tool-page-kicker">JSON 工具</p>
        <h1>JSON 转换</h1>
        <p>格式化、压缩、校验、树视图、JSONPath、类型生成与 Diff 对比。</p>
      </div>
    </header>

    <section class="tool-page-content">
      <JsonWorkbench />
    </section>
  </div>
</template>

<script setup>
import JsonWorkbench from '../components/JsonWorkbench.vue'
</script>
```

- [ ] **Step 3: 保证现有功能逻辑不被改写**

要求：

- 现有 tab 顺序保持不变
- 现有主题切换逻辑保留
- 现有移动端判断继续复用 `useViewport`
- 现有各个功能组件不挪路径、不改行为

- [ ] **Step 4: 运行构建确认抽离后功能仍可被打包**

运行：`npm run build`

预期：页面组件与原有功能组件都能正常打包。

- [ ] **Step 5: 提交本任务**

```bash
git add src/components/JsonWorkbench.vue src/pages/JsonToolsPage.vue src/style.css
git commit -m "refactor: extract json tools into dedicated page"
```

### Task 3: 实现工具集首页与卡片入口

**Files:**
- Create: `src/pages/HomePage.vue`
- Modify: `src/data/tools.js`
- Modify: `src/components/AppIcon.vue`
- Modify: `src/style.css`
- Test: `npm run build`

- [ ] **Step 1: 创建工具集首页页面**

首页目标结构：

```vue
<!-- src/pages/HomePage.vue -->
<template>
  <div class="home-page">
    <section class="home-hero">
      <p class="home-kicker">Tools</p>
      <h1>工具集</h1>
      <p class="home-subtitle">面向开发与数据处理的常用工具集合，当前已提供 JSON 转换工作台。</p>
    </section>

    <section class="tool-grid">
      <RouterLink
        v-for="tool in tools"
        :key="tool.id"
        :to="tool.path"
        class="tool-card"
      >
        <div class="tool-card-icon">
          <AppIcon :name="tool.icon" :size="18" />
        </div>
        <div class="tool-card-body">
          <div class="tool-card-head">
            <h2>{{ tool.title }}</h2>
            <span class="tool-card-badge">{{ tool.badge }}</span>
          </div>
          <p>{{ tool.description }}</p>
        </div>
      </RouterLink>
    </section>
  </div>
</template>

<script setup>
import { tools } from '../data/tools.js'
import AppIcon from '../components/AppIcon.vue'
</script>
```

- [ ] **Step 2: 为首页补一个更适合卡片的图标**

在 `src/components/AppIcon.vue` 新增一个图标分支，避免首页继续复用 tab 图标时过于拥挤：

```vue
<template v-else-if="name === 'toolbox'">
  <rect x="4" y="7" width="16" height="12" rx="2" />
  <path d="M9 7V5h6v2" />
  <path d="M4 12h16" />
  <path d="M10 12v2" />
  <path d="M14 12v2" />
</template>
```

然后把首页卡片配置改成：

```js
export const tools = [
  {
    id: 'json-tools',
    title: 'JSON 转换',
    description: '格式化、压缩、校验、树视图、Diff、TS / Java 类型生成',
    path: '/json',
    icon: 'toolbox',
    badge: '已上线',
  },
]
```

- [ ] **Step 3: 确保卡片只负责导航，不复用详情页逻辑**

要求：

- 首页不直接嵌入 JSON 工作台
- 卡片点击后进入 `/json`
- 后续新增工具时只需新增一条 `tools` 数据和一个页面组件

- [ ] **Step 4: 运行构建确认首页路由与图标都正常**

运行：`npm run build`

预期：首页能生成，`AppIcon` 无未知分支错误。

- [ ] **Step 5: 提交本任务**

```bash
git add src/pages/HomePage.vue src/data/tools.js src/components/AppIcon.vue src/style.css
git commit -m "feat: add tool-center homepage card"
```

### Task 4: 完成主页与工具页的页面级样式

**Files:**
- Modify: `src/style.css`
- Test: `npm run lint`
- Test: `npm run build`

- [ ] **Step 1: 保留现有工作台样式类，新增页面级容器样式**

在 `src/style.css` 新增而不是粗暴改写：

```css
.home-page {
  min-height: 100vh;
  overflow: auto;
  padding: 56px 24px 40px;
  background:
    radial-gradient(circle at top, var(--accent-glow), transparent 28%),
    var(--bg-base);
}

.home-hero {
  max-width: 760px;
  margin: 0 auto 28px;
}

.tool-grid {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 320px));
  gap: 16px;
}

.tool-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--bg-panel);
  color: inherit;
  text-decoration: none;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.tool-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
}
```

- [ ] **Step 2: 为 JSON 工具详情页加页面外壳样式**

新增样式：

```css
.tool-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-base);
}

.tool-page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px 24px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-panel);
}

.tool-page-back {
  width: fit-content;
  color: var(--accent-light);
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
}

.tool-page-content {
  flex: 1;
  min-height: 0;
}
```

- [ ] **Step 3: 保证移动端下主页和工具页都可用**

为已有移动端断点追加：

```css
@media (max-width: 767px) {
  .home-page {
    padding: 28px 16px 28px;
  }

  .tool-grid {
    grid-template-columns: 1fr;
  }

  .tool-page-header {
    padding: 18px 16px 14px;
  }
}
```

要求：首页不要再使用 `overflow: hidden` 的桌面工作台布局；工具页中的工作台部分继续沿用现有移动适配。

- [ ] **Step 4: 跑 lint 检查样式与模板无新增错误**

运行：`npm run lint`

预期：无新增 error，可接受现存格式 warning 仅在未涉及文件中保留。

- [ ] **Step 5: 跑构建确认页面级样式不会破坏原有布局**

运行：`npm run build`

预期：构建通过，首页与详情页样式都被正确打包。

- [ ] **Step 6: 提交本任务**

```bash
git add src/style.css
 git commit -m "style: add tool-center page layouts"
```

### Task 5: 全量验证与收尾

**Files:**
- Modify: `README.md`
- Test: `npm test`
- Test: `npm run lint`
- Test: `npm run type-check`
- Test: `npm run build`

- [ ] **Step 1: 更新 README 的产品结构说明**

补充首页与路由结构：

```md
## 页面结构

- `/`：工具集首页
- `/json`：JSON 转换工具页

当前首页已提供 JSON 转换入口，后续可继续扩展更多工具卡片。
```

- [ ] **Step 2: 跑单元测试确认底层逻辑未回归**

运行：`npm test`

预期：已有测试全部通过。

- [ ] **Step 3: 跑 ESLint**

运行：`npm run lint`

预期：无新增 error；如新文件有 warning，优先在本轮清掉。

- [ ] **Step 4: 跑类型检查**

运行：`npm run type-check`

预期：通过。

- [ ] **Step 5: 跑生产构建**

运行：`npm run build`

预期：通过，产物可生成。

- [ ] **Step 6: 手动验收页面流转**

验收清单：

- 打开 `/` 可见“工具集”标题
- 首页只有一张“JSON 转换”卡片
- 点击卡片能进入 `/json`
- `/json` 页面可返回 `/`
- JSON 工具原有 tab 功能仍可切换
- 移动端首页卡片与工具页头部不挤压

- [ ] **Step 7: 提交最终收尾**

```bash
git add README.md
 git commit -m "docs: document tool center homepage flow"
```

## Self-Review

### Spec coverage
- 首页顶部显示“工具集”：Task 3 / Task 4 覆盖
- 首页使用卡片展示工具：Task 3 / Task 4 覆盖
- 当前仅展示 JSON 转换：Task 1 / Task 3 覆盖
- 点击卡片进入对应页面：Task 1 / Task 3 覆盖
- JSON 工具页保留原有功能：Task 2 覆盖
- 工具中心结构支持后续扩展：Task 1 / Task 3 覆盖

### Placeholder scan
- 无 TODO / TBD / “后续实现” 占位
- 每个任务都明确了文件、命令与目标结构
- 需要新增依赖、页面、样式与 README 更新都已覆盖

### Type consistency
- 首页工具来源统一为 `src/data/tools.js`
- 页面路由统一收敛到 `src/router/index.js`
- JSON 工具主体统一收敛到 `src/components/JsonWorkbench.vue`
- 页面级入口统一为 `src/pages/HomePage.vue` 与 `src/pages/JsonToolsPage.vue`
