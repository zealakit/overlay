# Zealakit Overlay

[English](https://github.com/zealakit/overlay/blob/main/README.md) | [Tiếng Việt](https://github.com/zealakit/overlay/blob/main/README_VI.md) | [中文](https://github.com/zealakit/overlay/blob/main/README_CN.md)

![Zealakit Overlay cover](https://github.com/zealakit/overlay/blob/main/assets/images/overlay-cover.jpg?raw=true)

Headless overlay primitives for building popovers, tooltips, dialogs, and context menus in Vanilla TypeScript, React, Vue, and Svelte.

- **Core** — an internal shared kernel for positioning, layers, focus, and the DOM controller, bundled inside every adapter and never published on its own.
- **Adapters** — React components, Vue composables, Svelte controllers and actions, and Vanilla controllers.
- **SSR-safe** — importing a package never touches browser globals.

Overlay only handles positioning, layering, dismissal, focus, and accessibility attributes. It does not ship styles, themes, or form controls.

> **Note**
> Overlay is a focused, headless set of primitives for Popover, Tooltip, Dialog, and ContextMenu. It ships no CSS and renders no styled markup, so you keep full control of the visuals. Select, Combobox, DatePicker, DropdownMenu, Menubar, and command palette are not implemented.
>
> Overlay is not a replacement for a full UI library or design system. Use it when you need accessible overlay primitives without adopting a large kit, or when your current library's overlays are hard to restyle.

## Packages

| Package | Framework/Runtime | Documentation |
| --- | --- | --- |
| `@zealakit/overlay-core` | Internal kernel (bundled, not on npm) | [README](https://github.com/zealakit/overlay/blob/main/packages/core/README.md) |
| `@zealakit/overlay-vanilla` | Vanilla JS / TS | [README](https://github.com/zealakit/overlay/blob/main/packages/vanilla/README.md) |
| `@zealakit/overlay-react` | React 18 / 19 | [README](https://github.com/zealakit/overlay/blob/main/packages/react/README.md) |
| `@zealakit/overlay-vue` | Vue 3.5+ | [README](https://github.com/zealakit/overlay/blob/main/packages/vue/README.md) |
| `@zealakit/overlay-svelte` | Svelte 5 | [README](https://github.com/zealakit/overlay/blob/main/packages/svelte/README.md) |

Install one adapter for your framework. Your app already provides the framework runtime, so you only add the adapter. Each adapter bundles `@zealakit/overlay-core`, which is not published to npm; you never install or configure core directly. No runtime is shared between adapters.

## Installation

```bash
npm i @zealakit/overlay-vanilla
npm i @zealakit/overlay-react
npm i @zealakit/overlay-vue
npm i @zealakit/overlay-svelte

# or yarn, pnpm, ...
```

## Examples

The [`examples/`](https://github.com/zealakit/overlay/blob/main/examples) folder holds runnable integration projects for Vanilla, React, Vue, Svelte, Next.js, and Astro. They import the compiled workspace packages, so build first.

```bash
pnpm install
pnpm build
pnpm dev:vanilla   # or dev:react, dev:vue, dev:svelte, dev:nextjs, dev:astro
```

## Agent Skills

Add the integration skill for your framework to your agent's skills directory:

- [Overlay React](https://github.com/zealakit/overlay/blob/main/skills/overlay-react.md) — components, controlled state, styling, and Next.js rules.
- [Overlay Vue](https://github.com/zealakit/overlay/blob/main/skills/overlay-vue.md) — components, v-model state, composables, and Nuxt rules.
- [Overlay Svelte](https://github.com/zealakit/overlay/blob/main/skills/overlay-svelte.md) — components, bind:open state, controllers, and SvelteKit rules.
- [Overlay Vanilla](https://github.com/zealakit/overlay/blob/main/skills/overlay-vanilla.md) — data-* markup, controllers, and lifecycle rules.

## License

MIT © Zealakit
