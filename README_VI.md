# Zealakit Overlay

[English](https://github.com/zealakit/overlay/blob/main/README.md) | [Tiếng Việt](https://github.com/zealakit/overlay/blob/main/README_VI.md) | [中文](https://github.com/zealakit/overlay/blob/main/README_CN.md)

![Zealakit Overlay cover](https://github.com/zealakit/overlay/blob/main/assets/images/overlay-cover.jpg?raw=true)

Các primitive overlay headless để xây popover, tooltip, dialog và context menu bằng Vanilla TypeScript, React, Vue và Svelte.

- **Core** — kernel dùng chung nội bộ cho định vị, layer, focus và DOM controller, được mọi adapter cài tự động.
- **Adapter** — component React, composable Vue, controller và action Svelte, controller Vanilla.
- **An toàn SSR** — import package không bao giờ chạm vào biến toàn cục của trình duyệt.

Overlay chỉ xử lý định vị, phân lớp, đóng, focus và thuộc tính truy cập. Nó không kèm style, theme hay form control.

> **Note**
> Overlay là bộ primitive headless tập trung cho Popover, Tooltip, Dialog và ContextMenu. Không kèm CSS và không render markup có kiểu dáng, nên mọi quyết định visual đều thuộc về bạn. Select, Combobox, DatePicker, DropdownMenu, Menubar và command palette chưa được triển khai.
>
> Overlay không phải là bản thay thế cho một UI library hay design system đầy đủ. Hãy dùng khi bạn cần các primitive overlay có accessibility mà không phải kéo theo một bộ UI lớn, hoặc khi overlay trong thư viện hiện tại khó restyle.

## Packages

| Package | Framework/Runtime | Documentation |
| --- | --- | --- |
| `@zealakit/overlay-core` | Kernel nội bộ (cài tự động) | [README](https://github.com/zealakit/overlay/blob/main/packages/core/README_VI.md) |
| `@zealakit/overlay-vanilla` | Vanilla JS / TS | [README](https://github.com/zealakit/overlay/blob/main/packages/vanilla/README_VI.md) |
| `@zealakit/overlay-react` | React 18 / 19 | [README](https://github.com/zealakit/overlay/blob/main/packages/react/README_VI.md) |
| `@zealakit/overlay-vue` | Vue 3.5+ | [README](https://github.com/zealakit/overlay/blob/main/packages/vue/README_VI.md) |
| `@zealakit/overlay-svelte` | Svelte 5 | [README](https://github.com/zealakit/overlay/blob/main/packages/svelte/README_VI.md) |

Chỉ cần cài một adapter cho framework của bạn. Ứng dụng đã có sẵn framework runtime, nên bạn chỉ thêm adapter. Adapter tự kéo theo `@zealakit/overlay-core`; core là dependency nội bộ, không cài hoặc cấu hình trực tiếp. Các adapter không chia sẻ runtime với nhau.

## Installation

```bash
npm i @zealakit/overlay-vanilla
npm i @zealakit/overlay-react
npm i @zealakit/overlay-vue
npm i @zealakit/overlay-svelte

# or yarn, pnpm, ...
```

## Examples

Thư mục [`examples/`](https://github.com/zealakit/overlay/blob/main/examples) chứa các dự án tích hợp chạy được cho Vanilla, React, Vue, Svelte, Next.js và Astro. Chúng import package workspace đã build, nên hãy build trước.

```bash
pnpm install
pnpm build
pnpm dev:vanilla   # or dev:react, dev:vue, dev:svelte, dev:nextjs, dev:astro
```

## Agent Skills

Thêm skill tích hợp cho framework của bạn vào thư mục skills của agent:

- [Overlay React](https://github.com/zealakit/overlay/blob/main/skills/overlay-react.md) — component, controlled state, styling và quy tắc Next.js.
- [Overlay Vue](https://github.com/zealakit/overlay/blob/main/skills/overlay-vue.md) — component, v-model state, composable và quy tắc Nuxt.
- [Overlay Svelte](https://github.com/zealakit/overlay/blob/main/skills/overlay-svelte.md) — component, bind:open state, controller và quy tắc SvelteKit.
- [Overlay Vanilla](https://github.com/zealakit/overlay/blob/main/skills/overlay-vanilla.md) — markup data-*, controller và lifecycle.

## License

MIT © Zealakit
