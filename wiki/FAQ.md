# FAQ

## 这个项目是后端服务吗？

不是。当前项目是一个纯前端静态工具站，适合直接部署到 GitHub Pages。

## 为什么使用 Hash 路由？

因为 GitHub Pages 不原生支持 SPA History 路由刷新回退。使用 `createWebHashHistory()` 更稳。

## 为什么还需要 `public/404.html`？

因为用户可能直接访问一个不存在的静态地址。GitHub Pages 返回 404 时不会进入 Vue Router，所以需要桥接页面把请求转到站内 `#/404`。

## Schema 校验是完整 JSON Schema 吗？

不是。当前实现的是轻量子集，适合前端快速校验，不覆盖完整标准草案能力。

## 支持大文件吗？

支持一般日常使用场景，但目前还没有针对超大文件做 Web Worker、虚拟列表等专项优化。

## 为什么 GitHub Actions 里 `npm ci` 会失败？

常见原因是 `package-lock.json` 中写入了内网 npm registry 地址，导致 GitHub runner 无法拉取依赖。

## 为什么 `gh-pages` 推送会报 403？

通常是 `GITHUB_TOKEN` 没有写权限。需要检查：

- workflow 是否配置 `permissions: contents: write`
- 仓库 Actions 权限是否允许读写
