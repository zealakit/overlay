# Zealakit Overlay

[English](https://github.com/zealakit/overlay/blob/main/README.md) | [Tiếng Việt](https://github.com/zealakit/overlay/blob/main/README_VI.md) | [中文](https://github.com/zealakit/overlay/blob/main/README_CN.md)

![Zealakit Overlay cover](https://github.com/zealakit/overlay/blob/main/assets/images/overlay-cover.jpg?raw=true)

无样式（headless）的 overlay 原语，用于在 Vanilla TypeScript、React、Vue 和 Svelte 中构建 popover、tooltip、dialog 和 context menu。

- **Core** — 内部共享内核，负责定位、layer、焦点和 DOM 控制器，内置于每个适配器中，不会单独发布。
- **适配器** — React 组件、Vue composable、Svelte controller 与 action，以及 Vanilla controller。
- **SSR 安全** — 导入 package 不会访问浏览器全局对象。

Overlay 仅处理定位、分层、关闭、焦点和无障碍属性，不提供样式、主题或表单控件。

> **Note**
> Overlay 是一组专注的 headless 浮层原语，涵盖 Popover、Tooltip、Dialog 和 ContextMenu。它不附带 CSS，也不渲染带样式的标记，所有视觉细节都由你掌控。Select、Combobox、DatePicker、DropdownMenu、Menubar 和命令面板尚未实现。
>
> Overlay 不能替代完整的 UI 库或设计系统。当你需要无障碍的浮层基础组件、又不想引入大型 UI 套件，或现有库中的浮层组件难以重设样式时，可以使用它。

## Packages

| Package | Framework/Runtime | Documentation |
| --- | --- | --- |
| `@zealakit/overlay-core` | 内部内核（已内置，不在 npm 上） | [README](https://github.com/zealakit/overlay/blob/main/packages/core/README_CN.md) |
| `@zealakit/overlay-vanilla` | Vanilla JS / TS | [README](https://github.com/zealakit/overlay/blob/main/packages/vanilla/README_CN.md) |
| `@zealakit/overlay-react` | React 18 / 19 | [README](https://github.com/zealakit/overlay/blob/main/packages/react/README_CN.md) |
| `@zealakit/overlay-vue` | Vue 3.5+ | [README](https://github.com/zealakit/overlay/blob/main/packages/vue/README_CN.md) |
| `@zealakit/overlay-svelte` | Svelte 5 | [README](https://github.com/zealakit/overlay/blob/main/packages/svelte/README_CN.md) |

只需安装对应框架的适配器。应用已经提供框架运行时，因此只需添加适配器。每个适配器都内置 `@zealakit/overlay-core`，它不会发布到 npm；你无需直接安装或配置 core。适配器之间不共享运行时。

## Installation

```bash
npm i @zealakit/overlay-vanilla
npm i @zealakit/overlay-react
npm i @zealakit/overlay-vue
npm i @zealakit/overlay-svelte

# or yarn, pnpm, ...
```

## Examples

[`examples/`](https://github.com/zealakit/overlay/blob/main/examples) 目录包含 Vanilla、React、Vue、Svelte、Next.js 和 Astro 的可运行集成项目。它们导入已编译的工作区 package，因此请先构建。

```bash
pnpm install
pnpm build
pnpm dev:vanilla   # or dev:react, dev:vue, dev:svelte, dev:nextjs, dev:astro
```

## Agent Skills

将对应框架的集成 skill 添加到 agent 的 skills 目录：

- [Overlay React](https://github.com/zealakit/overlay/blob/main/skills/overlay-react.md) — 组件、受控状态、样式和 Next.js 规则。
- [Overlay Vue](https://github.com/zealakit/overlay/blob/main/skills/overlay-vue.md) — 组件、v-model 状态、composable 和 Nuxt 规则。
- [Overlay Svelte](https://github.com/zealakit/overlay/blob/main/skills/overlay-svelte.md) — 组件、bind:open 状态、controller 和 SvelteKit 规则。
- [Overlay Vanilla](https://github.com/zealakit/overlay/blob/main/skills/overlay-vanilla.md) — data-* 标记、controller 和生命周期。

## License

MIT © Zealakit
