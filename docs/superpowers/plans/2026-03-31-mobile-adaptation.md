# JSON Pro Mobile Adaptation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变桌面端逻辑的前提下，为 JSON Pro 增加手机与 pad 端可用的响应式布局与触屏交互。

**Architecture:** 通过新增视口状态工具与响应式样式断点，把“是否手机 / pad / 竖屏”下沉为可复用状态；顶层 `App.vue` 负责手机端导航切换，`ResizableLayout.vue` 负责在移动端禁用拖拽并切换为堆叠布局，`style.css` 负责主要断点样式与安全区留白。桌面端布局与交互逻辑保持现状。

**Tech Stack:** Vue 3, Vite, JavaScript, CSS, Composition API

---

### Task 1: 新增视口能力与移动布局基础

**Files:**
- Create: `src/lib/viewport.js`
- Create: `src/composables/useViewport.js`
- Modify: `src/components/ResizableLayout.vue`
- Test: `test/lib.test.js`

- [ ] **Step 1: 为断点判断写失败测试**
- [ ] **Step 2: 实现 `src/lib/viewport.js` 纯函数**
- [ ] **Step 3: 实现 `src/composables/useViewport.js`**
- [ ] **Step 4: 让 `ResizableLayout.vue` 在手机 / pad 竖屏下转为纵向堆叠并禁用拖拽**
- [ ] **Step 5: 跑 `npm test` 验证通过**

### Task 2: 改造 `App.vue` 导航以支持手机端底部 tab bar

**Files:**
- Modify: `src/App.vue`
- Modify: `src/style.css`

- [ ] **Step 1: 引入视口状态，识别手机端**
- [ ] **Step 2: 手机端保留顶部品牌与主题按钮，底部增加 tab bar**
- [ ] **Step 3: 桌面端顶部 tab 导航保持不变**
- [ ] **Step 4: 为底部 tab bar 增加安全区与视觉样式**
- [ ] **Step 5: 跑 `npm run lint` 验证无新错误**

### Task 3: 调整全局样式以适配手机与 pad 端

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: 增加 pad / phone 断点**
- [ ] **Step 2: 收紧 pad 端间距与按钮密度**
- [ ] **Step 3: 手机端让工具条换行、输入区和结果区高度更合理**
- [ ] **Step 4: 为主区域预留底部 tab bar 空间**
- [ ] **Step 5: 对 Diff、Validate、Tree 区块做窄屏优化**

### Task 4: 完整验证移动端适配改动

**Files:**
- Modify: `src/App.vue`
- Modify: `src/components/ResizableLayout.vue`
- Modify: `src/style.css`
- Create: `src/lib/viewport.js`
- Create: `src/composables/useViewport.js`

- [ ] **Step 1: 运行 `npm test`**
- [ ] **Step 2: 运行 `npm run lint`**
- [ ] **Step 3: 运行 `npm run type-check`**
- [ ] **Step 4: 运行 `npm run build`**
- [ ] **Step 5: 确认桌面端逻辑未被改动，只新增移动端响应式行为**

## Self-Review

### Spec coverage
- 手机 / pad 端断点策略：Task 1 / Task 3 覆盖
- 手机端底部导航：Task 2 覆盖
- 移动端堆叠布局与禁用拖拽：Task 1 覆盖
- 桌面端逻辑不变：Task 2 / Task 4 覆盖
- 全量验证：Task 4 覆盖

### Placeholder scan
- 无 TODO / TBD
- 每项任务都落到具体文件和动作
- 验证命令已明确

### Type consistency
- 视口纯函数统一放在 `src/lib/viewport.js`
- 响应式视口状态统一放在 `src/composables/useViewport.js`
- 移动端布局判断统一由 `ResizableLayout.vue` 与 `App.vue` 消费
