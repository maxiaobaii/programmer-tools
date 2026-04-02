# Architecture

## 应用结构

项目是一个纯前端静态站，采用 Vue 3 + Vite 构建。

## 页面层

- `src/pages/HomePage.vue`：工具首页
- `src/pages/JsonToolsPage.vue`：JSON 工作台页面
- `src/pages/NotFoundPage.vue`：404 页面

## 路由层

- `src/router/index.js`
- 使用 `createWebHashHistory()`
- 提供 `/404` 页面和全局兜底路由

## 组件层

`src/components/` 存放各工具子页面与共享 UI 组件，例如：

- `JsonWorkbench.vue`
- 各功能 Tab 组件
- 图标与布局组件

## 业务逻辑层

`src/lib/` 按能力拆分：

- `schema.js`：Schema 校验
- `types.js`：TypeScript 类型生成
- `java.js`：Java 类型生成
- `diff.js`：差异比对
- `convert.js`：格式转换
- `io.js`：文件与剪贴板能力
- `editorState.js`：编辑器状态管理
- `viewport.js`：响应式布局信息

## 数据层

- `src/data/tools.js`：首页工具卡片配置

## 静态资源层

- `public/404.html`：GitHub Pages 404 桥接页

## 测试层

- `test/lib.test.js`
- 使用 Node.js 内置测试运行器
- 当前以功能逻辑与关键页面结构断言为主
