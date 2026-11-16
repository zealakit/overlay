# Zealakit Overlay

[English](https://github.com/zealakit/overlay/blob/main/README.md) | [Tiếng Việt](https://github.com/zealakit/overlay/blob/main/README_VI.md) | [中文](https://github.com/zealakit/overlay/blob/main/README_CN.md)

![Zealakit Overlay cover](https://github.com/zealakit/overlay/blob/main/assets/overlay-cover.jpg)

无样式（headless）的 overlay 原语，用于在 Vanilla TypeScript、React、Vue 和 Svelte 中构建 popover、tooltip、dialog 和 context menu。

- **Core** — 共享内核，负责定位、layer、焦点和 DOM 控制器。
- **适配器** — React 组件、Vue composable、Svelte controller 与 action，以及 Vanilla controller。
- **SSR 安全** — 导入 package 不会访问浏览器全局对象。

Overlay 仅处理定位、分层、关闭、焦点和无障碍属性，不提供样式、主题或表单控件。

> **Note**
> Overlay 是无样式（headless）的：不附带 CSS，也不渲染带样式的标记。已实现 Popover、Tooltip、Dialog 和 ContextMenu；尚未实现 Select、Combobox、DatePicker、DropdownMenu、Menubar 和命令面板。

## Packages

| Package | Framework/Runtime | Documentation |
| --- | --- | --- |
| `@zealakit/overlay-core` | 与框架无关 | [README](https://github.com/zealakit/overlay/blob/main/packages/core/README_CN.md) |
| `@zealakit/overlay-vanilla` | Vanilla JS / TS | [README](https://github.com/zealakit/overlay/blob/main/packages/vanilla/README_CN.md) |
| `@zealakit/overlay-react` | React 18 / 19 | [README](https://github.com/zealakit/overlay/blob/main/packages/react/README_CN.md) |
| `@zealakit/overlay-vue` | Vue 3.5+ | [README](https://github.com/zealakit/overlay/blob/main/packages/vue/README_CN.md) |
| `@zealakit/overlay-svelte` | Svelte 5 | [README](https://github.com/zealakit/overlay/blob/main/packages/svelte/README_CN.md) |

每个 package 都可独立安装。适配器会自动引入 `@zealakit/overlay-core`，适配器之间不共享运行时。

## Installation

```bash
npm i @zealakit/overlay-core
npm i @zealakit/overlay-vanilla
npm i @zealakit/overlay-react react react-dom
npm i @zealakit/overlay-vue vue
npm i @zealakit/overlay-svelte svelte
```

## Examples

[`examples/`](https://github.com/zealakit/overlay/blob/main/examples) 目录包含 Vanilla、React、Vue、Svelte、Next.js 和 Astro 的可运行集成项目。它们导入已编译的工作区 package，因此请先构建。

```bash
pnpm install
pnpm build
pnpm dev:vanilla   # or dev:react, dev:vue, dev:svelte, dev:nextjs, dev:astro
```

## Dependency monitor

本地仪表盘会列出过期的依赖。运行命令并打开该地址即可。文件位于 [`monitor/`](https://github.com/zealakit/overlay/blob/main/monitor)。

```bash
pnpm monitor   # http://127.0.0.1:4177
```

## AI Agent Skills

- [overlay](https://github.com/zealakit/overlay/blob/main/.agents/skills/overlay/SKILL.md) — 架构、边界、工作流。
- [readme-system](https://github.com/zealakit/overlay/blob/main/.agents/skills/readme-system/SKILL.md) — 所有 README 的结构。
- [AGENTS.md](https://github.com/zealakit/overlay/blob/main/.agents/AGENTS.md) — 硬性规则与命令。

## License

MIT © Zealakit
