# Deployment

## GitHub Pages 部署说明

当前项目部署到：

- <https://maxiaobaii.github.io/programmer-tools/>

## 1. 配置 Vite base

`vite.config.js` 中需要与仓库名保持一致：

```js
base: '/programmer-tools/'
```

如果仓库名不是 `programmer-tools`，需要同步修改这里的路径。

## 2. 使用 Hash 路由

项目当前使用：

```js
createWebHashHistory()
```

这样可以避免 GitHub Pages 对 History 路由刷新不支持的问题。

## 3. GitHub Actions

建议部署 workflow 具备以下能力：

- 安装依赖
- 运行构建
- 将 `dist/` 发布到 `gh-pages` 分支

并在 workflow 中显式声明：

```yml
permissions:
  contents: write
```

## 4. Pages 仓库设置

在仓库 `Settings -> Pages` 中设置：

- Source: `Deploy from a branch`
- Branch: `gh-pages`
- Folder: `/ (root)`

## 5. 404 处理

GitHub Pages 遇到不存在的直达路径时，不会自动交给 Vue Router 处理。

因此项目额外提供了：

- `#/404` 页面
- `public/404.html` 跳转桥接

这样即使访问错误地址，也会进入站内 404 页面。

## 常见问题

### 页面空白

优先检查：

1. `base` 是否与仓库名一致
2. Pages Source 是否指向 `gh-pages`
3. 是否使用了 `createWebHashHistory()`
4. 构建产物是否成功发布到 `dist/`

### Actions 推送 `gh-pages` 报 403

通常是 `GITHUB_TOKEN` 没有写权限。需要：

- workflow 增加 `permissions: contents: write`
- 仓库 Actions 权限开启 `Read and write permissions`
