# Zealakit Overlay

[English](https://github.com/zealakit/overlay/blob/main/README.md) | [Tiếng Việt](https://github.com/zealakit/overlay/blob/main/README_VI.md) | [中文](https://github.com/zealakit/overlay/blob/main/README_CN.md)

![Zealakit Overlay cover](https://github.com/zealakit/overlay/blob/main/assets/cover.svg?raw=true)

Các primitive overlay headless để xây popover, tooltip, dialog và context menu bằng Vanilla TypeScript, React, Vue và Svelte.

- **Core** — một kernel dùng chung cho định vị, layer, focus và DOM controller.
- **Adapter** — component React, composable Vue, controller và action Svelte, controller Vanilla.
- **An toàn SSR** — import package không bao giờ chạm vào biến toàn cục của trình duyệt.

Overlay chỉ xử lý định vị, phân lớp, đóng, focus và thuộc tính truy cập. Nó không kèm style, theme hay form control.

> **Note**
> Overlay là headless: không kèm CSS và không render markup có kiểu dáng. Popover, Tooltip, Dialog và ContextMenu đã được triển khai. Select, Combobox, DatePicker, DropdownMenu, Menubar và command palette thì chưa.

## Packages

| Package | Framework/Runtime | Documentation |
| --- | --- | --- |
| `@zealakit/overlay-core` | Không phụ thuộc framework | [README](https://github.com/zealakit/overlay/blob/main/packages/core/README_VI.md) |
| `@zealakit/overlay-vanilla` | Vanilla JS / TS | [README](https://github.com/zealakit/overlay/blob/main/packages/vanilla/README_VI.md) |
| `@zealakit/overlay-react` | React 18 / 19 | [README](https://github.com/zealakit/overlay/blob/main/packages/react/README_VI.md) |
| `@zealakit/overlay-vue` | Vue 3.5+ | [README](https://github.com/zealakit/overlay/blob/main/packages/vue/README_VI.md) |
| `@zealakit/overlay-svelte` | Svelte 5 | [README](https://github.com/zealakit/overlay/blob/main/packages/svelte/README_VI.md) |

Mỗi package được cài độc lập. Adapter tự kéo theo `@zealakit/overlay-core`, và các adapter không chia sẻ runtime với nhau.

## Installation

```bash
npm i @zealakit/overlay-core
npm i @zealakit/overlay-vanilla
npm i @zealakit/overlay-react react react-dom
npm i @zealakit/overlay-vue vue
npm i @zealakit/overlay-svelte svelte
```

## Examples

Thư mục [`examples/`](https://github.com/zealakit/overlay/blob/main/examples) chứa các dự án tích hợp chạy được cho Vanilla, React, Vue, Svelte, Next.js và Astro. Chúng import package workspace đã build, nên hãy build trước.

```bash
pnpm install
pnpm build
pnpm dev:vanilla   # or dev:react, dev:vue, dev:svelte, dev:nextjs, dev:astro
```

## Dependency monitor

Một dashboard cục bộ liệt kê dependency đã cũ. Chạy lệnh rồi mở URL. Mã nguồn nằm trong [`monitor/`](https://github.com/zealakit/overlay/blob/main/monitor).

```bash
pnpm monitor   # http://127.0.0.1:4177
```

## AI Agent Skills

- [overlay](https://github.com/zealakit/overlay/blob/main/.agents/skills/overlay/SKILL.md) — kiến trúc, ranh giới, quy trình.
- [readme-system](https://github.com/zealakit/overlay/blob/main/.agents/skills/readme-system/SKILL.md) — cấu trúc của mọi README.
- [AGENTS.md](https://github.com/zealakit/overlay/blob/main/.agents/AGENTS.md) — quy tắc cứng và lệnh.

## License

MIT © Zealakit
