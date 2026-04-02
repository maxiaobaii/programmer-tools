# 程序员使用工具集

<p align="center">
  <a href="https://maxiaobaii.github.io/programmer-tools/">
    <img src="https://img.shields.io/badge/demo-GitHub%20Pages-2563eb?style=for-the-badge&logo=githubpages&logoColor=white" alt="Demo" />
  </a>
  <a href="https://github.com/maxiaobaii/programmer-tools/actions/workflows/deploy.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/maxiaobaii/programmer-tools/deploy.yml?branch=master&style=for-the-badge&label=deploy" alt="Deploy Status" />
  </a>
  <a href="https://github.com/maxiaobaii/programmer-tools/stargazers">
    <img src="https://img.shields.io/github/stars/maxiaobaii/programmer-tools?style=for-the-badge" alt="GitHub stars" />
  </a>
  <a href="https://github.com/maxiaobaii/programmer-tools/network/members">
    <img src="https://img.shields.io/github/forks/maxiaobaii/programmer-tools?style=for-the-badge" alt="GitHub forks" />
  </a>
  <a href="https://github.com/maxiaobaii/programmer-tools/issues">
    <img src="https://img.shields.io/github/issues/maxiaobaii/programmer-tools?style=for-the-badge" alt="GitHub issues" />
  </a>
  <a href="https://github.com/maxiaobaii/programmer-tools/commits/master">
    <img src="https://img.shields.io/github/last-commit/maxiaobaii/programmer-tools?style=for-the-badge" alt="Last commit" />
  </a>
  <a href="https://github.com/maxiaobaii/programmer-tools/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/maxiaobaii/programmer-tools?style=for-the-badge" alt="MIT License" />
  </a>
  <img src="https://img.shields.io/badge/Vue-3.5-42b883?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue 3" />
  <img src="https://img.shields.io/badge/Vite-5.x-646cff?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://visitor-badge.laobi.icu/badge?page_id=maxiaobaii.programmer-tools&style=for-the-badge" alt="Visitors" />
</p>

<p align="center">
  一个基于 <code>Vue 3 + Vite</code> 构建的在线开发者工具站，聚焦 JSON 处理、结构校验、格式转换、Diff 比对与类型生成。
</p>

## 在线体验

- 主页：<https://maxiaobaii.github.io/programmer-tools/>
- JSON 工具：<https://maxiaobaii.github.io/programmer-tools/#/json>

## 功能特性

### 已上线

- JSON 格式化与压缩
- JSON 语法校验
- JSON Schema 子集校验
- JSON 树视图浏览
- JSON Diff 对比
- JSONPath 查询
- TypeScript 类型生成
- Java 类型生成
- JSON / YAML / XML / CSV / TOML / Query 格式转换
- 文件导入、结果复制、结果下载、剪贴板读取
- GitHub Pages 404 页面兜底与首页返回能力

### 规划中

- 时间戳工具
- Regex 工具
- 更多常用开发辅助工具

## 支持格式

| 类别 | 支持内容 |
| --- | --- |
| 输入 | JSON、YAML、XML、CSV、TOML、URL Query |
| 输出 | JSON、YAML、XML、CSV、TOML、URL Query、TypeScript、Java、Diff 文本摘要 |

## 页面与路由

| 路径 | 说明 |
| --- | --- |
| `#/` | 工具首页 |
| `#/json` | JSON 转换工作台 |
| `#/404` | 自定义 404 页面 |

项目当前使用 `createWebHashHistory()` 适配 GitHub Pages，并通过 `public/404.html` 处理错误直达地址的跳转桥接。

## 技术栈

- Vue 3
- Vue Router 4
- Vite 5
- ESLint 9
- Node.js Test Runner
- fast-xml-parser
- js-yaml
- jsonpath-plus
- toml

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

### 质量检查

```bash
npm run test
npm run lint
npm run type-check
```

### 生产构建

```bash
npm run build
```

## 部署到 GitHub Pages

### 1. 配置基础路径

项目当前已经在 `vite.config.js` 中配置：

```js
base: '/programmer-tools/'
```

如果你的仓库名发生变化，需要同步修改这里的 `base`。

### 2. 使用 GitHub Actions 自动部署

当前项目通过 GitHub Actions 构建并部署 `dist/` 到 `gh-pages` 分支。

建议在 workflow 中开启：

```yml
permissions:
  contents: write
```

并在仓库设置中将 GitHub Pages Source 指向：

- Branch: `gh-pages`
- Folder: `/ (root)`

### 3. 404 页面处理

为兼容 GitHub Pages 静态托管场景，项目额外提供了：

- Vue Router 兜底 `404` 页面
- `public/404.html` 页面桥接

这样访问不存在的地址时，会跳转到站内的 404 页面，并可返回首页。

## 项目结构

```text
src/
  components/
  composables/
  data/
  lib/
  pages/
  router/
  utils.js
public/
  404.html
```

核心模块说明：

- `src/lib/schema.js`：JSON Schema 子集校验
- `src/lib/types.js`：TypeScript 类型生成
- `src/lib/java.js`：Java 类型生成
- `src/lib/diff.js`：结构 Diff 计算与摘要
- `src/lib/convert.js`：多格式转换
- `src/lib/io.js`：文件导入、下载、剪贴板读取
- `src/router/index.js`：站点路由与 404 兜底
- `src/data/tools.js`：工具首页卡片数据源

## Schema 校验支持范围

当前实现的是轻量 JSON Schema 子集，支持：

- `type`
- `properties`
- `required`
- `items`
- `enum`
- `additionalProperties`
- `minLength`
- `maxLength`
- `minimum`
- `maximum`

适合前端快速结构校验，但不是完整 JSON Schema 标准实现。

## 已知限制

- Schema 校验未覆盖完整 JSON Schema 草案能力
- Query 输出不支持嵌套对象
- TOML 输出不支持复杂对象数组
- Diff 中数组当前按索引比较，不做按业务主键智能对齐
- 大文件场景尚未引入 Web Worker 或虚拟列表优化

## Roadmap

- [x] JSON 工具主页与工作台整合
- [x] GitHub Pages 自动部署
- [x] 自定义 404 页面
- [ ] 时间戳工具
- [ ] Regex 工具
- [ ] 更多开发辅助工具

## Wiki

你可以在仓库 Wiki 或本地 `wiki/` 目录查看更详细说明，建议包含：

- Getting Started
- Features
- Deployment
- Architecture
- FAQ
- Roadmap

## License

本项目基于 [MIT](./LICENSE) 协议开源。
