# JSON Pro 升级实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将当前 JSON 工具站升级为一套更适合真实数据处理的前端工作台，补齐 Schema 校验、增强 TS 类型生成、提供语义级 Diff、扩展格式转换，并加入文件导入导出与基础工程化能力。

**Architecture:** 保持现有 Vue 3 + Vite 单页结构不变，把复杂逻辑下沉到独立工具模块：Schema 校验、类型推断、语义 Diff、格式转换、文件 I/O。页面层只负责输入输出与状态展示，避免继续把算法堆进单个 SFC。工程层补充 ESLint 与 `vue-tsc`，并同步更新 README。

**Tech Stack:** Vue 3, Vite, JavaScript, js-yaml, fast-xml-parser, jsonpath-plus, toml, ESLint, vue-tsc, TypeScript

---

> 当前工作区不是 git 仓库，无法执行真实的 `git commit`。因此本计划省略提交步骤，聚焦可直接执行的实现与验证步骤。

## 文件结构

### 新增文件
- `src/lib/schema.js`：轻量 Schema 校验器与错误格式化
- `src/lib/types.js`：TS 类型推断、接口命名、对象数组合并
- `src/lib/diff.js`：路径级语义 Diff
- `src/lib/convert.js`：JSON/YAML/XML/CSV/TOML/Query 的解析与序列化
- `src/lib/io.js`：文件读取、下载、剪贴板读取
- `eslint.config.js`：ESLint 配置
- `jsconfig.json`：让 `checkJs` 与编辑器类型检查更稳定

### 修改文件
- `package.json`
- `README.md`
- `src/utils.js`
- `src/style.css`
- `src/components/FormatTab.vue`
- `src/components/ValidateTab.vue`
- `src/components/TypesTab.vue`
- `src/components/DiffTab.vue`
- `src/components/ConvertTab.vue`

---

### Task 1: 补齐依赖与工程脚本

**Files:**
- Modify: `package.json`
- Create: `eslint.config.js`
- Create: `jsconfig.json`

- [ ] **Step 1: 更新 `package.json` 依赖与脚本**

将 `package.json` 改成包含以下脚本与依赖：

```json
{
  "name": "json-pro-tools",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "type-check": "vue-tsc --noEmit"
  },
  "dependencies": {
    "fast-xml-parser": "^5.5.9",
    "js-yaml": "^4.1.1",
    "jsonpath-plus": "^10.4.0",
    "toml": "^3.0.0",
    "vue": "^3.5.12"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.1.4",
    "eslint": "^9.24.0",
    "eslint-plugin-vue": "^9.33.0",
    "typescript": "^5.8.3",
    "vite": "^5.4.10",
    "vue-tsc": "^2.2.8"
  }
}
```

- [ ] **Step 2: 新增 `eslint.config.js`**

```js
import pluginVue from 'eslint-plugin-vue'

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.js', '**/*.vue'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/html-self-closing': 'off',
      'no-console': 'off',
    },
  },
]
```

- [ ] **Step 3: 新增 `jsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": false,
    "checkJs": true,
    "allowJs": true,
    "jsx": "preserve",
    "baseUrl": "."
  },
  "include": ["src/**/*.js", "src/**/*.vue", "vite.config.js"]
}
```

- [ ] **Step 4: 安装依赖**

Run: `npm install`

Expected: lockfile 更新，新增 `toml`、`eslint`、`vue-tsc` 等依赖。

---

### Task 2: 新增底层工具模块

**Files:**
- Create: `src/lib/schema.js`
- Create: `src/lib/types.js`
- Create: `src/lib/diff.js`
- Create: `src/lib/convert.js`
- Create: `src/lib/io.js`
- Modify: `src/utils.js`

- [ ] **Step 1: 新增 `src/lib/schema.js`，实现轻量 Schema 校验**

实现这些导出：

```js
export function validateJsonSchema(value, schema, path = 'root') {
  const errors = []
  walkSchema(value, schema, path, errors)
  return { ok: errors.length === 0, errors }
}

export function isJsonType(value, type) {
  if (type === 'array') return Array.isArray(value)
  if (type === 'null') return value === null
  if (type === 'integer') return Number.isInteger(value)
  return typeof value === type && value !== null
}
```

校验子集覆盖：`type`、`properties`、`required`、`items`、`enum`、`additionalProperties`、`minLength`、`maxLength`、`minimum`、`maximum`。

错误项格式统一为：

```js
{
  path: 'root.user.name',
  rule: 'minLength',
  message: '长度不能小于 3'
}
```

- [ ] **Step 2: 新增 `src/lib/types.js`，实现 TS 类型推断**

实现这些导出：

```js
export function generateTypescript(jsonValue, rootName = 'Root')
export function mergeValueTypes(a, b)
export function toTypeSource(shape, ctx)
```

要求：
- 支持顶层对象、数组、原始值
- 合并对象数组字段
- 异构数组生成联合类型
- `null` 与其他类型形成联合
- 非法 key 使用字符串字面量属性
- 接口命名稳定且不重复

生成结果示例：

```ts
interface RootItem {
  id: number
  name?: string | null
  'user-name'?: string
}

export type Root = RootItem[]
```

- [ ] **Step 3: 新增 `src/lib/diff.js`，实现语义 Diff**

实现这些导出：

```js
export function diffJsonValues(left, right, path = 'root')
export function formatDiffValue(value)
export function summarizeDiff(items)
```

差异项格式：

```js
{
  type: 'changed',
  path: 'root.user.age',
  before: 25,
  after: 26
}
```

规则：
- 对象按 key 并集比较
- 数组按索引比较
- 类型不同记为 `type_changed`
- 值不同记为 `changed`
- 缺失记为 `added` / `removed`

- [ ] **Step 4: 新增 `src/lib/convert.js`，实现多格式解析与序列化**

实现这些导出：

```js
export function parseByFormat(text, format)
export function stringifyByFormat(value, format)
export function getFormatExtension(format)
```

支持：
- `json`
- `yaml`
- `xml`
- `csv`
- `toml`
- `query`

实现约束：
- CSV：支持对象数组、标量数组、单对象数组化输出
- TOML：使用 `toml` 包解析；序列化优先覆盖对象和数组常见场景
- Query：基于 `URLSearchParams`
- 错误时抛出带中文说明的异常

- [ ] **Step 5: 新增 `src/lib/io.js`，实现文件与剪贴板能力**

```js
export function pickTextFile(accept = '.json,.txt')
export function downloadTextFile(filename, content)
export async function readClipboardText()
```

要求：
- `pickTextFile` 用隐藏 `input[type=file]` 读取文本
- `downloadTextFile` 用 Blob + object URL
- 读取剪贴板失败时抛出明确错误

- [ ] **Step 6: 保留并精简 `src/utils.js`**

保留：
- `highlightJson`
- `tryParseJson`
- `formatJson`
- `compressJson`
- `copyText`

并给 `copyText` 增加 fallback：当 `navigator.clipboard.writeText` 不可用时，改用临时 `textarea` + `document.execCommand('copy')`。

---

### Task 3: 改造 `ValidateTab.vue`

**Files:**
- Modify: `src/components/ValidateTab.vue`
- Modify: `src/style.css`

- [ ] **Step 1: 将校验页改成双输入布局**

左侧 JSON，右侧 Schema；结果区域保留在右侧下方。布局目标：
- JSON 输入区
- Schema 输入区
- 错误列表区
- 顶部按钮：示例、清空、导入、读取剪贴板

- [ ] **Step 2: 接入 Schema 校验逻辑**

使用：

```js
import { validateJsonSchema } from '../lib/schema.js'
```

状态规则：
- JSON 为空：等待输入
- JSON 语法错误：只显示语法错误
- Schema 为空：只显示语法通过与根类型信息
- Schema 有值但解析失败：显示 Schema 解析错误
- Schema 有值且解析成功：显示结构校验结果和错误列表

- [ ] **Step 3: 添加示例数据与示例 Schema**

示例 JSON：

```json
{
  "name": "张三",
  "age": 25,
  "tags": ["vip", "new"],
  "address": {
    "city": "北京"
  }
}
```

示例 Schema：

```json
{
  "type": "object",
  "required": ["name", "age"],
  "properties": {
    "name": { "type": "string", "minLength": 2 },
    "age": { "type": "number", "minimum": 0 },
    "tags": { "type": "array", "items": { "type": "string" } },
    "address": {
      "type": "object",
      "properties": {
        "city": { "type": "string" }
      },
      "required": ["city"]
    }
  },
  "additionalProperties": false
}
```

- [ ] **Step 4: 增加文件与剪贴板操作**

接入：
- JSON 导入
- Schema 导入
- 读取剪贴板到 JSON
- 清空 JSON + Schema

- [ ] **Step 5: 补样式**

在 `src/style.css` 增加：
- `.stack-layout`
- `.sub-panel`
- `.result-list`
- `.result-item`
- `.badge-*`

---

### Task 4: 改造 `TypesTab.vue`

**Files:**
- Modify: `src/components/TypesTab.vue`
- Modify: `src/style.css`

- [ ] **Step 1: 替换生成逻辑为 `generateTypescript`**

使用：

```js
import { generateTypescript } from '../lib/types.js'
```

原组件中的 `getType` / `genInterface` / `capitalize` 全部删除。

- [ ] **Step 2: 补充文件工作流**

按钮增加：
- 导入
- 读取剪贴板
- 下载 `.ts`
- 复制

下载文件名固定为：`types.generated.ts`。

- [ ] **Step 3: 增加更有代表性的示例**

```json
[
  { "id": 1, "name": "张三", "user-name": "zhangsan", "score": null },
  { "id": 2, "name": null, "active": true }
]
```

预期生成结果包含：
- `RootItem`
- 可选字段
- 联合类型
- 非法 key 字符串字面量

---

### Task 5: 改造 `DiffTab.vue`

**Files:**
- Modify: `src/components/DiffTab.vue`
- Modify: `src/style.css`

- [ ] **Step 1: 用语义 Diff 替换 LCS**

使用：

```js
import { diffJsonValues, formatDiffValue, summarizeDiff } from '../lib/diff.js'
```

删除：
- `computeDiff`
- 行级 `diffLines`
- 按行复制文本组装逻辑

- [ ] **Step 2: 改结果区为结构化列表**

每项展示：
- 差异类型 badge
- 路径
- 旧值
- 新值

`added` 仅显示新值；`removed` 仅显示旧值。

- [ ] **Step 3: 增加导入与下载**

支持：
- 左侧导入 JSON A
- 右侧导入 JSON B
- 下载 diff 文本 `diff-summary.txt`

复制文本格式示例：

```txt
[changed] root.user.age
- before: 25
+ after: 26
```

- [ ] **Step 4: 更新示例**

A：

```json
{
  "name": "张三",
  "age": 25,
  "city": "北京",
  "profile": { "vip": true }
}
```

B：

```json
{
  "name": "张三",
  "age": 26,
  "city": "上海",
  "email": "zhangsan@example.com",
  "profile": { "vip": "yes" }
}
```

---

### Task 6: 改造 `ConvertTab.vue`

**Files:**
- Modify: `src/components/ConvertTab.vue`
- Modify: `src/style.css`

- [ ] **Step 1: 切换为通用转换工具模块**

使用：

```js
import { parseByFormat, stringifyByFormat, getFormatExtension } from '../lib/convert.js'
```

删除组件内的格式解析与序列化分支逻辑。

- [ ] **Step 2: 扩展格式选择器**

输入与输出格式都增加：
- `csv`
- `toml`
- `query`

显示名分别为：
- `CSV`
- `TOML`
- `Query`

- [ ] **Step 3: 增加导入、读取剪贴板、下载**

行为：
- 导入时根据当前输入格式限制 `accept`
- 下载时使用 `converted.<ext>`
- 剪贴板读取写入输入区

- [ ] **Step 4: 补示例映射**

不同输入格式切换时，`loadSample` 输出对应示例：
- JSON 对象数组
- YAML 对象
- XML 文档
- CSV 表格
- TOML 配置
- Query 字符串

---

### Task 7: 改造 `FormatTab.vue` 并统一文件工作流

**Files:**
- Modify: `src/components/FormatTab.vue`
- Modify: `src/style.css`

- [ ] **Step 1: 为格式化页接入导入、读取剪贴板、下载**

按钮增加：
- 导入
- 读取剪贴板
- 下载
- 复制

下载文件名：`formatted.json`

- [ ] **Step 2: 保持原有即时格式化体验**

不要改变原页面的自动格式化行为，只新增文件工作流与更统一的按钮排布。

---

### Task 8: 重写 README 并完善样式

**Files:**
- Modify: `README.md`
- Modify: `src/style.css`

- [ ] **Step 1: 重写 README**

README 至少包含：
- 项目简介
- 功能列表
- 支持格式
- 开发命令
- Schema 校验支持范围
- 已知限制

- [ ] **Step 2: 为新增 UI 元素补样式**

至少补齐：
- 通用工具栏按钮换行与间距
- 差异列表视觉层级
- 次级面板边框与留白
- 移动宽度下的基本可读性

---

### Task 9: 验证

**Files:**
- Modify: `package-lock.json`（安装依赖后自动变化）

- [ ] **Step 1: 运行 lint**

Run: `npm run lint`

Expected: 无阻塞错误。

- [ ] **Step 2: 运行类型检查**

Run: `npm run type-check`

Expected: 无阻塞错误。

- [ ] **Step 3: 运行构建**

Run: `npm run build`

Expected: Vite 构建成功，产物输出到 `dist/`。

---

## 自检

### Spec coverage
- Schema 校验：Task 2 + Task 3 覆盖
- TS 类型生成：Task 2 + Task 4 覆盖
- 语义级 Diff：Task 2 + Task 5 覆盖
- 格式转换扩展：Task 2 + Task 6 覆盖
- 文件导入导出与剪贴板：Task 2 + Task 3/4/5/6/7 覆盖
- 工程化脚本与 README：Task 1 + Task 8 + Task 9 覆盖

### Placeholder scan
- 未保留 `TODO` / `TBD`
- 每个任务都落到具体文件与具体行为
- 验证命令已给出

### Type consistency
- Schema 工具统一用 `validateJsonSchema`
- TS 生成统一用 `generateTypescript`
- Diff 工具统一用 `diffJsonValues`
- 转换工具统一用 `parseByFormat` / `stringifyByFormat`
