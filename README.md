# JSON Pro Tools

一个基于 `Vue 3 + Vite` 的前端 JSON 工具站，面向日常数据清洗、校验、转换、比对和类型生成场景。

## 功能

- JSON 格式化
- JSON 压缩
- JSON 语法校验
- JSON Schema 子集校验
- JSON 字符串转义 / 反转义
- 树视图浏览
- JSON / YAML / XML / CSV / TOML / Query 格式转换
- JSONPath 查询
- TypeScript 类型生成
- 路径级语义 Diff
- 文件导入、结果复制、结果下载、剪贴板读取

## 支持格式

### 输入
- JSON
- YAML
- XML
- CSV
- TOML
- URL Query

### 输出
- JSON
- YAML
- XML
- CSV
- TOML
- URL Query
- TypeScript
- Diff 文本摘要

## 页面结构

- `/`：工具集首页
- `/json`：JSON 转换工具页

当前首页已提供 JSON 转换入口，后续可继续扩展更多工具卡片。

## 开发命令

```bash
npm install
npm run dev
npm run test
npm run lint
npm run type-check
npm run build
```

## Schema 校验支持范围

当前实现的是一个轻量 JSON Schema 子集，支持这些规则：

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

这意味着它适合前端快速结构校验，但**不是完整 JSON Schema 标准实现**。

## TypeScript 类型生成能力

当前类型生成器支持：

- 顶层对象、数组、原始值
- 异构数组联合类型
- 对象数组字段合并
- 缺失字段转可选属性
- `null` 联合类型
- 非法属性名转字符串字面量属性

## 已知限制

- Schema 校验未覆盖完整 JSON Schema 草案能力
- CSV 转换优先支持对象数组、单对象、标量数组等常见结构
- Query 输出不支持嵌套对象
- TOML 输出不支持复杂对象数组
- Diff 中数组当前按索引比较，不做按业务主键智能对齐
- 大文件场景尚未做 Web Worker 和虚拟列表优化

## 项目结构

```text
src/
  components/
  composables/
  lib/
  utils.js
```

其中：

- `src/lib/schema.js`：Schema 校验
- `src/lib/types.js`：TS 类型推断
- `src/lib/diff.js`：语义 Diff
- `src/lib/convert.js`：格式转换
- `src/lib/io.js`：文件导入、下载、剪贴板读取

## 说明

当前目录不是 Git 仓库，所以这次改造没有走分支 / worktree / commit 流程，只在当前工作区直接实现。