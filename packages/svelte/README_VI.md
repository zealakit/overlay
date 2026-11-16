# @zealakit/overlay-svelte

[English](https://github.com/zealakit/overlay/blob/main/packages/svelte/README.md) | [Tiếng Việt](https://github.com/zealakit/overlay/blob/main/packages/svelte/README_VI.md) | [中文](https://github.com/zealakit/overlay/blob/main/packages/svelte/README_CN.md)

![Zealakit Overlay cover](https://github.com/zealakit/overlay/blob/main/assets/images/overlay-cover.jpg?raw=true)

Component Popover, Tooltip, Dialog và ContextMenu headless cho Svelte 5. Cung cấp compound component, định vị, đóng theo lớp, quản lý focus cùng controller và action cấp thấp. Bạn tự quyết định kiểu dáng.

Hãy style các phần bằng `class`, `style` và các hook `data-*` bên dưới. Content vẫn ở trong DOM dạng `hidden` khi đóng và controller giữ `hidden`, nên đừng tự bind nó; khi có `animation`, content vẫn hiển thị đến khi exit kết thúc.

> **Note**
> Overlay là bộ primitive headless tập trung cho Popover, Tooltip, Dialog và ContextMenu. Không kèm CSS và không render markup có kiểu dáng, nên mọi quyết định visual đều thuộc về bạn. Select, Combobox, DatePicker, DropdownMenu, Menubar và command palette chưa được triển khai.
>
> Overlay không phải là bản thay thế cho một UI library hay design system đầy đủ. Hãy dùng khi bạn cần các primitive overlay có accessibility mà không phải kéo theo một bộ UI lớn, hoặc khi overlay trong thư viện hiện tại khó restyle.

## Install

```bash
npm install @zealakit/overlay-svelte

# or yarn, pnpm, ...
```

Peer dependency: `svelte` `^5.0.0`; ứng dụng Svelte đã cung cấp sẵn. Chỉ Svelte 5; chỉ ESM. Component, controller và action dùng chung một entry, `@zealakit/overlay-svelte`. Các component phát hành dạng file `.svelte`, nên hãy dùng Vite với `@sveltejs/vite-plugin-svelte` (SvelteKit đã có sẵn). Kernel nội bộ `@zealakit/overlay-core` đã được đóng gói sẵn trong package này và không có trên npm; không cần cài thêm gì.

## Popover

### Quick start

```svelte
<script lang="ts">
  import {
    Popover,
    PopoverClose,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
  } from "@zealakit/overlay-svelte";
</script>

<Popover placement="bottom-start" offset={8}>
  <PopoverTrigger>Edit profile</PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Edit profile</PopoverTitle>
      <PopoverDescription>Update your profile information.</PopoverDescription>
    </PopoverHeader>
    <PopoverClose>Close</PopoverClose>
  </PopoverContent>
</Popover>
```

### `Popover` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Hiển thị được điều khiển. Dùng `bind:open`. |
| `defaultOpen` | `boolean` | `false` | Hiển thị ban đầu khi không điều khiển. |
| `disabled` | `boolean` | `false` | Đóng overlay và bỏ qua trigger. |
| `placement` | `Placement` | `"bottom-start"` (Tooltip `"top"`) | Cạnh cùng `-start` hoặc `-end` tùy chọn. |
| `offset` / `alignOffset` | `number` | `0` | Khoảng cách trục chính và độ lệch trục phụ (px). |
| `flip` / `shift` / `autoUpdate` | `boolean` | `true` | Xử lý va chạm và đặt lại vị trí khi scroll và resize. |
| `padding` | `number` | `0` | Khoảng cách tới biên va chạm. |
| `boundary` | `Element \| "clippingAncestors" \| "viewport"` | `"clippingAncestors"` | Biên va chạm. |
| `strategy` | `"absolute" \| "fixed"` | automatic | Tự động: `absolute`, hoặc `fixed` cho neo fixed/sticky. |
| `dir` | `"ltr" \| "rtl"` | — | Áp dụng cho phần tử content. |
| `dismissOnEscape` / `dismissOnOutsidePress` | `boolean` | `true` | Đóng khi nhấn Escape hoặc nhấn chính bên ngoài. |
| `portal` | `boolean \| HTMLElement` | `true` | `true` portal vào `document.body`, một element chọn container, `false` render tại chỗ. |
| `animation` | `boolean \| AnimationConfig` | — | Tắt trừ khi truyền `true` hoặc config. |
| `arrow` | `boolean` | `false` | Định vị phần mũi tên. Render component mũi tên bên trong content. |
| `arrowSize` / `arrowPadding` | `number` | `8` / `0` | Độ dài cạnh mũi tên và khoảng cách tới mép popup (px). |
| `trapFocus` | `boolean` | `false` | Giữ focus trong khi layer này ở trên cùng. |
| `initialFocus` | `boolean \| "container" \| "first" \| Element \| null` | — | Nơi focus rơi vào khi mở; mặc định không có. |
| `restoreFocus` | `boolean` | `true` | Trả focus về trigger khi đóng từ bên trong. |
| `onOpenChange` / `children` | `(open, reason) => void` / `Snippet` | — | Gọi mỗi khi đổi; `reason` là `trigger`, `escape-key`, `outside-press`, `reference-press`, `select` hoặc `programmatic`. Snippet children nhận `{ open }`; không chuyển tiếp prop khác. |

Root không render phần tử nào. Nó giữ state và chia sẻ cho các phần con, nên dùng một phần ngoài root sẽ ném lỗi rõ ràng.

### `PopoverTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string` | `"button"` | Tag cần render. Hãy dùng phần tử focus được. |
| `...attrs` | `HTMLAttributes` | — | Chuyển tiếp tới phần tử. Đặt `type="button"`, `aria-expanded` và, khi mở, `aria-controls`. |

### `PopoverContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string` | `"div"` | Tag cần render. |
| `...attrs` | `HTMLAttributes` | — | Chuyển tiếp tới `div` content. Không thêm `role` hay focus trap; `PopoverTitle` và `PopoverDescription` nối `aria-labelledby` và `aria-describedby`. |

`PopoverHeader`, `PopoverTitle`, `PopoverDescription`, `PopoverClose` và `PopoverArrow` nhận `as` và chuyển tiếp các thuộc tính còn lại. `PopoverClose` đóng popover.

### Controlled usage

```svelte
<script lang="ts">
  let open = $state(false);
</script>

<Popover bind:open onOpenChange={(next, reason) => console.log(next, reason)}>
  <PopoverTrigger>Edit profile</PopoverTrigger>
  <PopoverContent>Update your profile information.</PopoverContent>
</Popover>
```

### Animation configuration

```svelte
<Popover arrow arrowSize={10} animation={{ type: "expand", duration: 220 }}>
  <PopoverTrigger>Edit profile</PopoverTrigger>
  <PopoverContent>
    Update your profile information.
    <PopoverArrow />
  </PopoverContent>
</Popover>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` with a config | Đặt `false` để tắt animation. |
| `type` | `"fade" \| "expand" \| "custom"` | `"fade"` | `expand` mở rộng từ cạnh neo; `custom` được suy ra khi có `custom`. |
| `direction` | `"up" \| "down" \| "left" \| "right" \| "auto"` | `"auto"` | Hướng di chuyển; `auto` theo placement đã được giải quyết. |
| `duration` | `number` | `160` | Mili giây. |
| `delay` | `number` | `0` | Mili giây. |
| `easing` | `string` | `"ease-in-out"` | `ease-in-out`, `linear` hoặc mọi CSS timing function. |
| `custom` | `{ enter, exit } \| keyframes` | — | CSS class hoặc keyframes Web Animations (mảng hoặc hàm). |
| `...` | — | — | Truyền `true` để dùng mặc định. Exit phát lại enter theo chiều ngược; reduced motion chỉ giữ opacity. |

```css
.panel {
  --overlay-arrow-background: #121a27;
  --overlay-arrow-border-width: 1px;
  --overlay-arrow-border-color: #3d5478;
}
```

### `as`

Mỗi phần render một tag mặc định hợp lý. Truyền `as` để đổi, ví dụ `as="span"` để bọc button bị disabled trong phần tử focus được. Phần đó vẫn giữ id, thuộc tính ARIA và ref.

## Tooltip

### Quick start

```svelte
<script lang="ts">
  import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
  } from "@zealakit/overlay-svelte";
</script>

<Tooltip placement="top" delay={500}>
  <TooltipTrigger>Edit profile</TooltipTrigger>
  <TooltipContent>Update your profile information.</TooltipContent>
</Tooltip>
```

### `Tooltip` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Hiển thị được điều khiển. Dùng `bind:open`. |
| `defaultOpen` | `boolean` | `false` | Hiển thị ban đầu khi không điều khiển. |
| `disabled` | `boolean` | `false` | Đóng overlay và bỏ qua trigger. |
| `placement` | `Placement` | `"bottom-start"` (Tooltip `"top"`) | Cạnh cùng `-start` hoặc `-end` tùy chọn. |
| `offset` / `alignOffset` | `number` | `0` | Khoảng cách trục chính và độ lệch trục phụ (px). |
| `flip` / `shift` / `autoUpdate` | `boolean` | `true` | Xử lý va chạm và đặt lại vị trí khi scroll và resize. |
| `padding` | `number` | `0` | Khoảng cách tới biên va chạm. |
| `boundary` | `Element \| "clippingAncestors" \| "viewport"` | `"clippingAncestors"` | Biên va chạm. |
| `strategy` | `"absolute" \| "fixed"` | automatic | Tự động: `absolute`, hoặc `fixed` cho neo fixed/sticky. |
| `dir` | `"ltr" \| "rtl"` | — | Áp dụng cho phần tử content. |
| `dismissOnEscape` / `dismissOnOutsidePress` | `boolean` | `true` | Đóng khi nhấn Escape hoặc nhấn chính bên ngoài. |
| `portal` | `boolean \| HTMLElement` | `true` | `true` portal vào `document.body`, một element chọn container, `false` render tại chỗ. |
| `animation` | `boolean \| AnimationConfig` | — | Tắt trừ khi truyền `true` hoặc config. |
| `arrow` | `boolean` | `false` | Định vị phần mũi tên. Render component mũi tên bên trong content. |
| `arrowSize` / `arrowPadding` | `number` | `8` / `0` | Độ dài cạnh mũi tên và khoảng cách tới mép popup (px). |
| `delay` | `number` | `500` | Độ trễ mở khi hover (ms). |
| `closeDelay` | `number` | `100` | Độ trễ trước khi đóng sau khi con trỏ hoặc focus rời đi. |
| `hoverableContent` | `boolean` | `true` | Giữ mở khi con trỏ ở trên content. |
| `onOpenChange` / `children` | `(open, reason) => void` / `Snippet` | — | Gọi mỗi khi đổi; `reason` là `trigger`, `escape-key`, `outside-press`, `reference-press`, `select` hoặc `programmatic`. Snippet children nhận `{ open }`; không chuyển tiếp prop khác. |

Root không render phần tử nào. Nó giữ state và chia sẻ cho các phần con, nên dùng một phần ngoài root sẽ ném lỗi rõ ràng.

### `TooltipTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string` | `"button"` | Tag cần render. Hãy dùng phần tử focus được. |
| `...attrs` | `HTMLAttributes` | — | Chuyển tiếp tới phần tử. Khi mở có `aria-describedby`; bấm sẽ đóng nhưng không bao giờ mở. |

### `TooltipContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string` | `"div"` | Tag cần render. |
| `...attrs` | `HTMLAttributes` | — | Chuyển tiếp tới `div` content có `role="tooltip"`. Content không focus được. |

Hover mở sau `delay`, focus mở ngay, còn Escape hoặc nhấn bên ngoài sẽ đóng. Hover bằng cảm ứng bị bỏ qua. `TooltipArrow` nhận `as` và chuyển tiếp các thuộc tính còn lại.

### Controlled usage

```svelte
<script lang="ts">
  let open = $state(false);
</script>

<Tooltip bind:open onOpenChange={(next, reason) => console.log(next, reason)}>
  <TooltipTrigger>Edit profile</TooltipTrigger>
  <TooltipContent>Update your profile information.</TooltipContent>
</Tooltip>
```

### Animation configuration

`Tooltip` nhận cùng option `animation` như Popover: truyền `true` hoặc một config như `{ duration: 160 }`. Xem [option của Popover](https://github.com/zealakit/overlay/blob/main/packages/svelte/README_VI.md#popover).

### `as`

Mỗi phần render một tag mặc định hợp lý. Truyền `as` để đổi, ví dụ `as="span"` để bọc button bị disabled trong phần tử focus được. Phần đó vẫn giữ id, thuộc tính ARIA và ref.

## Dialog

### Quick start

```svelte
<script lang="ts">
  import {
    Dialog,
    DialogBackdrop,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
  } from "@zealakit/overlay-svelte";
</script>

<Dialog>
  <DialogTrigger>Edit profile</DialogTrigger>
  <DialogBackdrop>
    <div data-dialog-backdrop></div>
    <div data-dialog-viewport>
      <DialogContent>
        <DialogTitle>Edit profile</DialogTitle>
        <DialogDescription>Update your profile information.</DialogDescription>
        <DialogClose>Cancel</DialogClose>
      </DialogContent>
    </div>
  </DialogBackdrop>
</Dialog>
```

### `Dialog` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Hiển thị được điều khiển. Dùng `bind:open`. |
| `defaultOpen` | `boolean` | `false` | Hiển thị ban đầu khi không điều khiển. |
| `disabled` | `boolean` | `false` | Đóng overlay và bỏ qua trigger. |
| `placement` | `Placement` | — | Dialog không neo. |
| `dir` | `"ltr" \| "rtl"` | — | Áp dụng cho phần tử content. |
| `dismissOnEscape` / `dismissOnOutsidePress` | `boolean` | `true` | Đóng khi nhấn Escape hoặc nhấn chính bên ngoài. |
| `portal` | `boolean \| HTMLElement` | `true` | `true` portal vào `document.body`, một element chọn container, `false` render tại chỗ. |
| `animation` | `boolean \| AnimationConfig` | — | Tắt trừ khi truyền `true` hoặc config. |
| `modal` | `boolean` | `true` | Modal: `aria-modal`, giữ focus, nền inert, khóa scroll. |
| `lockScroll` | `boolean` | `modal` | Khóa scroll tài liệu khi mở. |
| `trapFocus` | `boolean` | `modal` | Giữ focus trong khi layer này ở trên cùng. |
| `initialFocus` | `boolean \| "container" \| "first" \| Element \| null` | `"container"` khi modal | Nơi focus rơi vào khi mở; `null` giữ nguyên focus. |
| `restoreFocus` | `boolean` | `true` | Khôi phục focus khi đóng. |
| `onOpenChange` / `children` | `(open, reason) => void` / `Snippet` | — | Gọi mỗi khi đổi; `reason` là `trigger`, `escape-key`, `outside-press`, `reference-press`, `select` hoặc `programmatic`. Snippet children nhận `{ open }`; không chuyển tiếp prop khác. |

Root không render phần tử nào. Nó giữ state và chia sẻ cho các phần con, nên dùng một phần ngoài root sẽ ném lỗi rõ ràng.

### `DialogTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string` | `"button"` | Tag cần render. Hãy dùng phần tử focus được. |
| `...attrs` | `HTMLAttributes` | — | Chuyển tiếp tới phần tử. Đặt `aria-haspopup="dialog"`, `aria-expanded` và `aria-controls`. |

### `DialogContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string` | `"div"` | Tag cần render. |
| `...attrs` | `HTMLAttributes` | — | Chuyển tiếp tới `div` content có `role="dialog"`. Hãy thêm `DialogTitle` hoặc `aria-label` để có tên truy cập. |

`DialogBackdrop` bọc viewport và content, nên backdrop, viewport và content được portal và bật/tắt như một khối. `DialogHeader` và `DialogFooter` là wrapper bố cục; `DialogTitle` và `DialogDescription` nối `aria-labelledby` và `aria-describedby`; `DialogClose` đóng dialog. Tất cả nhận `as`.

### Controlled usage

```svelte
<script lang="ts">
  let open = $state(false);
</script>

<Dialog bind:open onOpenChange={(next, reason) => console.log(next, reason)}>
  <DialogTrigger>Edit profile</DialogTrigger>
  <DialogContent>Update your profile information.</DialogContent>
</Dialog>
```

### Animation configuration

`Dialog` nhận cùng option `animation` như Popover: truyền `true` hoặc một config như `{ duration: 160 }`. Xem [option của Popover](https://github.com/zealakit/overlay/blob/main/packages/svelte/README_VI.md#popover).

### `as`

Mỗi phần render một tag mặc định hợp lý. Truyền `as` để đổi, ví dụ `as="span"` để bọc button bị disabled trong phần tử focus được. Phần đó vẫn giữ id, thuộc tính ARIA và ref.

## ContextMenu

### Quick start

```svelte
<script lang="ts">
  import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
  } from "@zealakit/overlay-svelte";
</script>

<ContextMenu>
  <ContextMenuTrigger>Edit profile</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onselect={() => console.log("edit")}>Edit</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem disabled>Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

### `ContextMenu` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Hiển thị được điều khiển. Dùng `bind:open`. |
| `defaultOpen` | `boolean` | `false` | Hiển thị ban đầu khi không điều khiển. |
| `disabled` | `boolean` | `false` | Đóng overlay và bỏ qua trigger. |
| `placement` | `Placement` | `"bottom-start"` (Tooltip `"top"`) | Cạnh cùng `-start` hoặc `-end` tùy chọn. |
| `offset` / `alignOffset` | `number` | `0` | Khoảng cách trục chính và độ lệch trục phụ (px). |
| `flip` / `shift` / `autoUpdate` | `boolean` | `true` | Xử lý va chạm và đặt lại vị trí khi scroll và resize. |
| `padding` | `number` | `0` | Khoảng cách tới biên va chạm. |
| `boundary` | `Element \| "clippingAncestors" \| "viewport"` | `"clippingAncestors"` | Biên va chạm. |
| `strategy` | `"absolute" \| "fixed"` | automatic | Tự động: `absolute`, hoặc `fixed` cho neo fixed/sticky. |
| `dir` | `"ltr" \| "rtl"` | — | Áp dụng cho phần tử content. |
| `dismissOnEscape` / `dismissOnOutsidePress` | `boolean` | `true` | Đóng khi nhấn Escape hoặc nhấn chính bên ngoài. |
| `portal` | `boolean \| HTMLElement` | `true` | `true` portal vào `document.body`, một element chọn container, `false` render tại chỗ. |
| `animation` | `boolean \| AnimationConfig` | — | Tắt trừ khi truyền `true` hoặc config. |
| `onOpenChange` / `children` | `(open, reason) => void` / `Snippet` | — | Gọi mỗi khi đổi; `reason` là `trigger`, `escape-key`, `outside-press`, `reference-press`, `select` hoặc `programmatic`. Snippet children nhận `{ open }`; không chuyển tiếp prop khác. |

Root không render phần tử nào. Nó giữ state và chia sẻ cho các phần con, nên dùng một phần ngoài root sẽ ném lỗi rõ ràng.

### `ContextMenuTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string` | `"div"` | Tag cần render. Hãy dùng phần tử focus được. |
| `...attrs` | `HTMLAttributes` | — | Chuyển tiếp tới phần tử. Đặt `tabindex="0"`; chuột phải, phím Context Menu và Shift+F10 mở menu. |

### `ContextMenuContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string` | `"div"` | Tag cần render. |
| `...attrs` | `HTMLAttributes` | — | Chuyển tiếp tới `div` content có `role="menu"`. Phím mũi tên, Home, End và typeahead di chuyển focus; menu không giữ focus. |

### `ContextMenuItem` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `disabled` | `boolean` | `false` | Bị bỏ qua khi điều hướng bàn phím và không bao giờ kích hoạt. |
| `closeOnSelect` | `boolean` | `true` | Đặt `false` để giữ menu mở sau khi chọn. |
| `as` | `string` | `"div"` | Tag cần render. |
| `onselect` | `(event: MouseEvent) => void` | — | Gọi khi bấm hoặc kích hoạt bằng bàn phím. Item render `role="menuitem"`, `aria-disabled` và `data-disabled`; thuộc tính khác được chuyển tiếp. |

`ContextMenuGroup`, `ContextMenuLabel`, `ContextMenuSeparator` và `ContextMenuShortcut` là phần cấu trúc. Submenu, checkbox item và radio item không có trong package này; hãy dùng React cho chúng.

### Controlled usage

```svelte
<script lang="ts">
  let open = $state(false);
</script>

<ContextMenu bind:open onOpenChange={(next, reason) => console.log(next, reason)}>
  <ContextMenuTrigger>Edit profile</ContextMenuTrigger>
  <ContextMenuContent>Update your profile information.</ContextMenuContent>
</ContextMenu>
```

### Animation configuration

`ContextMenu` nhận cùng option `animation` như Popover: truyền `true` hoặc một config như `{ duration: 160 }`. Xem [option của Popover](https://github.com/zealakit/overlay/blob/main/packages/svelte/README_VI.md#popover).

### `as`

Mỗi phần render một tag mặc định hợp lý. Truyền `as` để đổi, ví dụ `as="span"` để bọc button bị disabled trong phần tử focus được. Phần đó vẫn giữ id, thuộc tính ARIA và ref.

## Controllers and actions

Các component được xây trên những API cấp thấp này. Hãy dùng trực tiếp khi bạn cần markup riêng.

| Export | Purpose |
| --- | --- |
| `createPopover(options)` / `createTooltip(options)` / `createDialog(options)` / `createContextMenu(options)` | Controller dựa trên overlay controller dùng chung. |
| `createPositioner(options)` | Store readable của vị trí mới nhất cùng `update`, `setOptions`, `dispose`. |
| `createLayer(options)` | Store readable `{ id, isTopmost, handle }`. |
| `use:floating` | Định vị node theo `reference`. |
| `use:layer` | Đăng ký node vào layer stack. |
| `use:overlay` | Ghép mở/đóng của `floating` và `layer`. |
| `use:outsideInteraction` / `use:escapeKey` / `use:portal` | Action độc lập cho nhấn bên ngoài, Escape và portal. |
| `createFocusContainment`, `focusElement`, `focusFirst`, `getFocusableElements`, `isFocusable`, `getActiveElement`, `restoreFocus` | Primitive focus được re-export từ core. |

```svelte
<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { createPopover, type PopoverController } from "@zealakit/overlay-svelte";

  let trigger: HTMLButtonElement;
  let content: HTMLDivElement;
  let popover: PopoverController | undefined;

  onMount(() => {
    popover = createPopover({ trigger, content, placement: "bottom-start" });
  });
  onDestroy(() => popover?.destroy());
</script>

<button bind:this={trigger} type="button">Edit profile</button>
<div bind:this={content}>Update your profile information.</div>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `trigger` | `HTMLElement` | **required** | Phần tử neo và kích hoạt overlay. |
| `content` | `HTMLElement` | **required** | Phần tử nổi do bạn sở hữu. Controller bật/tắt `hidden` và `data-state`. |
| `backdrop` | `HTMLElement \| null` | — | Phần tử backdrop của Dialog. |
| `open` | `boolean` | — | Hiển thị được điều khiển; phản ánh state ngoài bằng `setOpen()`. |
| `defaultOpen` | `boolean` | `false` | Hiển thị ban đầu khi không điều khiển. |
| `disabled` | `boolean` | `false` | Đóng overlay và bỏ qua trigger. |
| `onOpenChange` | `(open, reason) => void` | — | Gọi mỗi khi người dùng hoặc code thay đổi. |
| `onSelect` | `(item, event) => void` | — | Chỉ ContextMenu: một item được kích hoạt. |
| `portal` | `Element \| null` | — | Chuyển content (và backdrop) vào đây khi mở. |
| `stack` | `LayerStack` | per-document | Dùng chung một layer stack tường minh. |
| `parentLayer` | `LayerStackHandle \| null` | — | Layer cha cho overlay lồng nhau. |
| `boundaries` | `(Element \| null)[]` | — | Phần tử bổ sung được tính là bên trong. |
| `placement` | `Placement` | `"bottom-start"` | Tooltip mặc định `top`. Dialog không neo. |
| `offset` | `number` | `0` | Khoảng cách trục chính (px). |
| `alignOffset` | `number` | `0` | Độ lệch trục phụ (px). |
| `flip` | `boolean` | `true` | Lật sang phía đối diện khi thiếu chỗ. |
| `shift` | `boolean` | `true` | Dịch theo trục phụ để luôn hiển thị. |
| `padding` | `number` | `0` | Khoảng cách tới biên va chạm. |
| `boundary` | `Element \| "clippingAncestors" \| "viewport"` | `"clippingAncestors"` | Biên va chạm. |
| `strategy` | `"absolute" \| "fixed"` | automatic | Tự động: `absolute`, hoặc `fixed` cho neo fixed/sticky. |
| `autoUpdate` | `boolean` | `true` | Đặt lại vị trí khi scroll, resize và đổi layout. |
| `arrow` | `{ element, size?, padding? } \| null` | — | Chỉ Popover và Tooltip; bạn sở hữu phần tử mũi tên. |
| `animation` | `boolean \| AnimationConfig` | — | Tắt trừ khi truyền `true` hoặc config. |
| `dir` | `"ltr" \| "rtl"` | — | Áp dụng cho phần tử content. |
| `dismissOnEscape` | `boolean` | `true` | Đóng khi nhấn Escape (chỉ layer trên cùng). |
| `dismissOnOutsidePress` | `boolean` | `true` | Đóng khi nhấn chính bên ngoài. |
| `modal` | `boolean` | `true` | Chỉ Dialog: nền inert, giữ focus, khóa scroll. |
| `lockScroll` | `boolean` | `true` | Chỉ Dialog, khi `modal`. |
| `trapFocus` | `boolean` | `modal` | Dialog theo `modal`; Popover mặc định `false`. |
| `initialFocus` | `"container" \| "first" \| Element \| boolean \| null` | — | Dialog: container khi modal. ContextMenu: item đầu. Popover: không. |
| `finalFocus` | `Element \| null` | — | Nơi focus quay về khi đóng; mặc định là trigger. |
| `restoreFocus` | `boolean` | `true` | Khôi phục focus khi đóng. |
| `delay` | `number` | `500` | Chỉ Tooltip: độ trễ mở (ms). |
| `closeDelay` | `number` | `100` | Chỉ Tooltip: độ trễ đóng (ms). |
| `hoverableContent` | `boolean` | `true` | Chỉ Tooltip: giữ mở khi con trỏ ở trên content. |
| `labelledBy` / `describedBy` | `string` | — | Chỉ Dialog: id cho `aria-labelledby` / `aria-describedby`. |
| `toggleOnTriggerClick` | `boolean` | `true` | Popover và Dialog: bật/tắt khi bấm trigger. |
| `...` | — | — | Không chuyển tiếp thuộc tính khác; hãy đặt trên phần tử của bạn. |

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `isOpen` | `boolean` | — | Hiển thị hiện tại (chỉ đọc). |
| `contentId` | `string` | — | Id gán cho phần tử content. |
| `open(reason?)` / `close(reason?)` / `toggle(reason?)` | `void` | — | Đổi hiển thị và gọi `onOpenChange`. |
| `openAt(point, reason?)` | `void` | — | ContextMenu: mở tại `{ x, y }`; `null` neo vào trigger. |
| `setOpen(open)` | `void` | — | Phản ánh state điều khiển mà không gọi `onOpenChange`. |
| `setOptions(patch)` | `void` | — | Cập nhật option sau khi tạo. |
| `update()` | `Promise<PositionerResult \| null>` | — | Đo lại; trả `null` khi đang đóng. |
| `subscribe(listener)` | `() => void` | — | Gọi ngay và mỗi khi đổi với `{ isOpen, placement, point }`. |
| `destroy()` | `void` | — | Idempotent; gỡ listener và khôi phục thuộc tính. |

## Lifecycle

- Component tạo controller sau khi mount và hủy cùng component; không có gì chạy khi SSR.
- Tạo controller thủ công trong `onMount` và gọi `destroy()` trong `onDestroy`. Nó idempotent nên gọi lặp lại hoặc init hai lần không gây gì.
- Action chỉ chạy trong trình duyệt và dọn dẹp khi node bị hủy.
- Các layer dùng chung một stack đếm tham chiếu cho mỗi document.

## Styling hooks

| Attribute | Where | Purpose |
| --- | --- | --- |
| `data-state` | Content, trigger | `"open"` hoặc `"closed"`. |
| `data-open` / `data-closed` | Content | Cờ có/không cho CSS selector. |
| `data-side` / `data-align` / `data-placement` | Content | Placement sau khi flip và shift. |
| `data-animating` | Content | `"enter"` hoặc `"exit"` khi animation đang chạy. |
| `--overlay-transform-origin` | Content | Gốc theo cạnh neo cho animation dùng class. |
| `--overlay-arrow-*` | Panel hoặc phần tử cha | Màu nền, độ dày và màu viền của mũi tên. |

```css
.panel {
  --overlay-arrow-background: #121a27;
  --overlay-arrow-border-width: 1px;
  --overlay-arrow-border-color: #3d5478;
}
```

## SvelteKit

Không có entry riêng cho SvelteKit. Import package an toàn trên server, và các component render markup khi SSR với content ở trạng thái `hidden`.

## Agent Skill

Thêm [Overlay Svelte skill](https://github.com/zealakit/overlay/blob/main/skills/overlay-svelte.md) vào thư mục skills của agent để nó tuân theo quy tắc component, styling và accessibility của package này.

## License

MIT © Zealakit
