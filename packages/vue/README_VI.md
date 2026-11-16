# @zealakit/overlay-vue

[English](https://github.com/zealakit/overlay/blob/main/packages/vue/README.md) | [Tiếng Việt](https://github.com/zealakit/overlay/blob/main/packages/vue/README_VI.md) | [中文](https://github.com/zealakit/overlay/blob/main/packages/vue/README_CN.md)

![Zealakit Overlay cover](https://github.com/zealakit/overlay/blob/main/assets/overlay-cover.jpg)

Component Popover, Tooltip, Dialog và ContextMenu headless cho Vue. Cung cấp compound component, định vị reactive, đóng theo lớp, quản lý focus và các composable cấp thấp. Bạn tự quyết định kiểu dáng.

Hãy style các phần bằng `class`, `style` và các hook `data-*` bên dưới. Content vẫn ở trong DOM dạng `hidden` khi đóng và controller giữ `hidden`, nên đừng tự bind nó; khi có `animation`, content vẫn hiển thị đến khi exit kết thúc.

> **Note**
> Overlay là headless: không kèm CSS và không render markup có kiểu dáng. Popover, Tooltip, Dialog và ContextMenu đã được triển khai. Select, Combobox, DatePicker, DropdownMenu, Menubar và command palette thì chưa.

## Install

```bash
npm install @zealakit/overlay-vue vue
```

Peer dependency: `vue` `^3.5.0`. Chỉ ESM. Các component là render function thuần nên không cần thêm bước build.

## Popover

### Quick start

```vue
<script setup lang="ts">
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@zealakit/overlay-vue";
</script>

<template>
  <Popover placement="bottom-start" :offset="8">
    <PopoverTrigger>Edit profile</PopoverTrigger>
    <PopoverContent>
      <PopoverHeader>
        <PopoverTitle>Edit profile</PopoverTitle>
        <PopoverDescription>Update your profile information.</PopoverDescription>
      </PopoverHeader>
      <PopoverClose>Close</PopoverClose>
    </PopoverContent>
  </Popover>
</template>
```

### `Popover` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Hiển thị được điều khiển. Dùng `v-model:open`. |
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
| `@update:open` / `@open-change` | `(open, reason) => void` | — | Phát ra mỗi khi đổi; `reason` là `trigger`, `escape-key`, `outside-press`, `reference-press`, `select` hoặc `programmatic`. Slot mặc định nhận `{ open }`. |

Root không render phần tử nào. Nó giữ state và chia sẻ cho các phần con, nên dùng một phần ngoài root sẽ ném lỗi rõ ràng.

### `PopoverTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"button"` | Tag cần render. Hãy dùng phần tử focus được. |
| `...attrs` | `HTMLAttributes` | — | Chuyển tiếp tới phần tử. Đặt `type="button"`, `aria-expanded` và, khi mở, `aria-controls`. |

### `PopoverContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"div"` | Tag cần render. |
| `...attrs` | `HTMLAttributes` | — | Chuyển tiếp tới `div` content. Không thêm `role` hay focus trap; `PopoverTitle` và `PopoverDescription` nối `aria-labelledby` và `aria-describedby`. |

`PopoverHeader`, `PopoverTitle`, `PopoverDescription`, `PopoverClose` và `PopoverArrow` nhận `as` và chuyển tiếp các thuộc tính còn lại. `PopoverClose` đóng popover.

### Controlled usage

```vue
<script setup lang="ts">
import { ref } from "vue";
const open = ref(false);
</script>

<template>
  <Popover v-model:open="open" @open-change="(next, reason) => console.log(next, reason)">
    <PopoverTrigger>Edit profile</PopoverTrigger>
    <PopoverContent>Update your profile information.</PopoverContent>
  </Popover>
</template>
```

### Animation configuration

```vue
<Popover arrow :arrow-size="10" :animation="{ type: 'expand', duration: 220 }">
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

```vue
<script setup lang="ts">
import { Tooltip, TooltipContent, TooltipTrigger } from "@zealakit/overlay-vue";
</script>

<template>
  <Tooltip placement="top" :delay="500">
    <TooltipTrigger>Edit profile</TooltipTrigger>
    <TooltipContent>Update your profile information.</TooltipContent>
  </Tooltip>
</template>
```

### `Tooltip` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Hiển thị được điều khiển. Dùng `v-model:open`. |
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
| `@update:open` / `@open-change` | `(open, reason) => void` | — | Phát ra mỗi khi đổi; `reason` là `trigger`, `escape-key`, `outside-press`, `reference-press`, `select` hoặc `programmatic`. Slot mặc định nhận `{ open }`. |

Root không render phần tử nào. Nó giữ state và chia sẻ cho các phần con, nên dùng một phần ngoài root sẽ ném lỗi rõ ràng.

### `TooltipTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"button"` | Tag cần render. Hãy dùng phần tử focus được. |
| `...attrs` | `HTMLAttributes` | — | Chuyển tiếp tới phần tử. Khi mở có `aria-describedby`; bấm sẽ đóng nhưng không bao giờ mở. |

### `TooltipContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"div"` | Tag cần render. |
| `...attrs` | `HTMLAttributes` | — | Chuyển tiếp tới `div` content có `role="tooltip"`. Content không focus được. |

Hover mở sau `delay`, focus mở ngay, còn Escape hoặc nhấn bên ngoài sẽ đóng. Hover bằng cảm ứng bị bỏ qua. `TooltipArrow` nhận `as` và chuyển tiếp các thuộc tính còn lại.

### Controlled usage

```vue
<script setup lang="ts">
import { ref } from "vue";
const open = ref(false);
</script>

<template>
  <Tooltip v-model:open="open" @open-change="(next, reason) => console.log(next, reason)">
    <TooltipTrigger>Edit profile</TooltipTrigger>
    <TooltipContent>Update your profile information.</TooltipContent>
  </Tooltip>
</template>
```

### Animation configuration

`Tooltip` nhận cùng option `animation` như Popover: truyền `true` hoặc một config như `{ duration: 160 }`. Xem [option của Popover](https://github.com/zealakit/overlay/blob/main/packages/vue/README_VI.md#popover).

### `as`

Mỗi phần render một tag mặc định hợp lý. Truyền `as` để đổi, ví dụ `as="span"` để bọc button bị disabled trong phần tử focus được. Phần đó vẫn giữ id, thuộc tính ARIA và ref.

## Dialog

### Quick start

```vue
<script setup lang="ts">
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@zealakit/overlay-vue";
</script>

<template>
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
</template>
```

### `Dialog` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Hiển thị được điều khiển. Dùng `v-model:open`. |
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
| `@update:open` / `@open-change` | `(open, reason) => void` | — | Phát ra mỗi khi đổi; `reason` là `trigger`, `escape-key`, `outside-press`, `reference-press`, `select` hoặc `programmatic`. Slot mặc định nhận `{ open }`. |

Root không render phần tử nào. Nó giữ state và chia sẻ cho các phần con, nên dùng một phần ngoài root sẽ ném lỗi rõ ràng.

### `DialogTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"button"` | Tag cần render. Hãy dùng phần tử focus được. |
| `...attrs` | `HTMLAttributes` | — | Chuyển tiếp tới phần tử. Đặt `aria-haspopup="dialog"`, `aria-expanded` và `aria-controls`. |

### `DialogContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"div"` | Tag cần render. |
| `...attrs` | `HTMLAttributes` | — | Chuyển tiếp tới `div` content có `role="dialog"`. Hãy thêm `DialogTitle` hoặc `aria-label` để có tên truy cập. |

`DialogBackdrop` bọc viewport và content, nên backdrop, viewport và content được portal và bật/tắt như một khối. `DialogHeader` và `DialogFooter` là wrapper bố cục; `DialogTitle` và `DialogDescription` nối `aria-labelledby` và `aria-describedby`; `DialogClose` đóng dialog. Tất cả nhận `as`.

### Controlled usage

```vue
<script setup lang="ts">
import { ref } from "vue";
const open = ref(false);
</script>

<template>
  <Dialog v-model:open="open" @open-change="(next, reason) => console.log(next, reason)">
    <DialogTrigger>Edit profile</DialogTrigger>
    <DialogContent>Update your profile information.</DialogContent>
  </Dialog>
</template>
```

### Animation configuration

`Dialog` nhận cùng option `animation` như Popover: truyền `true` hoặc một config như `{ duration: 160 }`. Xem [option của Popover](https://github.com/zealakit/overlay/blob/main/packages/vue/README_VI.md#popover).

### `as`

Mỗi phần render một tag mặc định hợp lý. Truyền `as` để đổi, ví dụ `as="span"` để bọc button bị disabled trong phần tử focus được. Phần đó vẫn giữ id, thuộc tính ARIA và ref.

## ContextMenu

### Quick start

```vue
<script setup lang="ts">
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@zealakit/overlay-vue";
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger>Edit profile</ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuItem @select="console.log('edit')">Edit</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem disabled>Delete</ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>
```

### `ContextMenu` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Hiển thị được điều khiển. Dùng `v-model:open`. |
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
| `@update:open` / `@open-change` | `(open, reason) => void` | — | Phát ra mỗi khi đổi; `reason` là `trigger`, `escape-key`, `outside-press`, `reference-press`, `select` hoặc `programmatic`. Slot mặc định nhận `{ open }`. |

Root không render phần tử nào. Nó giữ state và chia sẻ cho các phần con, nên dùng một phần ngoài root sẽ ném lỗi rõ ràng.

### `ContextMenuTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"div"` | Tag cần render. Hãy dùng phần tử focus được. |
| `...attrs` | `HTMLAttributes` | — | Chuyển tiếp tới phần tử. Đặt `tabindex="0"`; chuột phải, phím Context Menu và Shift+F10 mở menu. |

### `ContextMenuContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"div"` | Tag cần render. |
| `...attrs` | `HTMLAttributes` | — | Chuyển tiếp tới `div` content có `role="menu"`. Phím mũi tên, Home, End và typeahead di chuyển focus; menu không giữ focus. |

### `ContextMenuItem` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `disabled` | `boolean` | `false` | Bị bỏ qua khi điều hướng bàn phím và không bao giờ kích hoạt. |
| `closeOnSelect` | `boolean` | `true` | Đặt `false` để giữ menu mở sau khi chọn. |
| `as` | `string \| Component` | `"div"` | Tag cần render. |
| `@select` | `(event: MouseEvent) => void` | — | Gọi khi bấm hoặc kích hoạt bằng bàn phím. Item render `role="menuitem"`, `aria-disabled` và `data-disabled`; thuộc tính khác được chuyển tiếp. |

`ContextMenuGroup`, `ContextMenuLabel`, `ContextMenuSeparator` và `ContextMenuShortcut` là phần cấu trúc. Submenu, checkbox item và radio item không có trong package này; hãy dùng React cho chúng.

### Controlled usage

```vue
<script setup lang="ts">
import { ref } from "vue";
const open = ref(false);
</script>

<template>
  <ContextMenu v-model:open="open" @open-change="(next, reason) => console.log(next, reason)">
    <ContextMenuTrigger>Edit profile</ContextMenuTrigger>
    <ContextMenuContent>Update your profile information.</ContextMenuContent>
  </ContextMenu>
</template>
```

### Animation configuration

`ContextMenu` nhận cùng option `animation` như Popover: truyền `true` hoặc một config như `{ duration: 160 }`. Xem [option của Popover](https://github.com/zealakit/overlay/blob/main/packages/vue/README_VI.md#popover).

### `as`

Mỗi phần render một tag mặc định hợp lý. Truyền `as` để đổi, ví dụ `as="span"` để bọc button bị disabled trong phần tử focus được. Phần đó vẫn giữ id, thuộc tính ARIA và ref.

## Composables

Các component được xây trên những composable này. Hãy dùng trực tiếp khi bạn cần markup riêng.

| Export | Purpose |
| --- | --- |
| `usePopover(options)` / `useTooltip(options)` / `useDialog(options)` / `useContextMenu(options)` | Composable controller trên template ref. |
| `useOverlayComponent(kind, options)` | Dạng tổng quát của bốn composable trên. |
| `usePositioner(options)` | Positioner reactive trả về result dạng `shallowRef`. |
| `useLayer(options)` | Đăng ký layer khi đã mount; lồng nhau qua `parent`. |
| `useOverlay(options)` | State mở không điều khiển ghép từ `usePositioner` và `useLayer`. |
| `useEscapeKey(handler, options?)` | Listener Escape với `enabled` và `target`. |
| `createFocusContainment`, `focusElement`, `focusFirst`, `getFocusableElements`, `isFocusable`, `getActiveElement`, `restoreFocus` | Primitive focus được re-export từ core. |

```vue
<script setup lang="ts">
import { ref } from "vue";
import { usePopover } from "@zealakit/overlay-vue";

const trigger = ref<HTMLElement | null>(null);
const content = ref<HTMLElement | null>(null);
const { isOpen, close } = usePopover({ trigger, content, placement: "bottom-start" });
</script>

<template>
  <button ref="trigger" type="button">Edit profile</button>
  <div ref="content">
    Update your profile information.
    <button type="button" @click="close()">Close</button>
  </div>
</template>
```

Mọi option đều nhận `ref` hoặc getter (`MaybeRefOrGetter`) trừ callback. Giá trị trả về gồm `isOpen` (`Ref<boolean>`), `controller`, `contentId`, `open()`, `close()`, `toggle()`, `setOpen()`, `update()` và `dispose()`.

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

## Lifecycle

- Không có thao tác DOM trong render hoặc setup SSR; controller được tạo trong `onMounted`.
- Mỗi composable được hủy ở `onScopeDispose`; ngoài scope hãy gọi `dispose()` được trả về.
- `dispose()` idempotent nên gọi lần hai hoặc remount không gây thêm gì.
- Overlay lồng nhau dùng chung một layer stack đếm tham chiếu cho mỗi document nên Escape đóng cái trên cùng trước.

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

## Nuxt

Import package an toàn trên server, và nội dung overlay chỉ tương tác được sau khi mount. Hãy bọc trong `<ClientOnly>` các component tự tạo controller thủ công.

## AI Agent Skill

Coding agent làm việc với package này nạp [overlay skill](https://github.com/zealakit/overlay/blob/main/.agents/skills/overlay/SKILL.md) trước tiên.

## License

MIT © Zealakit
