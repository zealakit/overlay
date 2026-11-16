# @zealakit/overlay-vue

[English](https://github.com/zealakit/overlay/blob/main/packages/vue/README.md) | [Tiếng Việt](https://github.com/zealakit/overlay/blob/main/packages/vue/README_VI.md) | [中文](https://github.com/zealakit/overlay/blob/main/packages/vue/README_CN.md)

![Zealakit Overlay cover](https://github.com/zealakit/overlay/blob/main/assets/images/overlay-cover.jpg)

面向 Vue 的无样式 Popover、Tooltip、Dialog 和 ContextMenu 组件。提供复合组件、响应式定位、分层关闭、焦点管理和底层 composable。视觉样式由你自己决定。

请通过 `class`、`style` 和下方的 `data-*` 钩子为各部分设置样式。关闭时内容以 `hidden` 保留在 DOM 中，且 `hidden` 由控制器管理，因此不要自行绑定；启用 `animation` 时内容会保持可见，直到退出动画结束。

> **Note**
> Overlay 是无样式（headless）的：不附带 CSS，也不渲染带样式的标记。已实现 Popover、Tooltip、Dialog 和 ContextMenu；尚未实现 Select、Combobox、DatePicker、DropdownMenu、Menubar 和命令面板。

## Install

```bash
npm install @zealakit/overlay-vue vue
```

Peer 依赖：`vue` `^3.5.0`。仅支持 ESM。组件是纯渲染函数，因此无需额外构建步骤。`@zealakit/overlay-core` 是自动安装的内部依赖，请勿单独安装。

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
| `open` | `boolean` | — | 受控可见性。使用 `v-model:open`。 |
| `defaultOpen` | `boolean` | `false` | 非受控时的初始可见性。 |
| `disabled` | `boolean` | `false` | 关闭 overlay 并忽略 trigger。 |
| `placement` | `Placement` | `"bottom-start"`（Tooltip 为 `"top"`） | 边加可选的 `-start` 或 `-end`。 |
| `offset` / `alignOffset` | `number` | `0` | 主轴间距与交叉轴偏移（像素）。 |
| `flip` / `shift` / `autoUpdate` | `boolean` | `true` | 碰撞处理，以及滚动和缩放时重新定位。 |
| `padding` | `number` | `0` | 与碰撞边界的间距。 |
| `boundary` | `Element \| "clippingAncestors" \| "viewport"` | `"clippingAncestors"` | 碰撞边界。 |
| `strategy` | `"absolute" \| "fixed"` | automatic | 自动：`absolute`，固定/粘性锚点用 `fixed`。 |
| `dir` | `"ltr" \| "rtl"` | — | 应用到 content 元素。 |
| `dismissOnEscape` / `dismissOnOutsidePress` | `boolean` | `true` | 按 Escape 或在外部主键按下时关闭。 |
| `portal` | `boolean \| HTMLElement` | `true` | `true` 渲染到 `document.body`，传入元素则选择容器，`false` 就地渲染。 |
| `animation` | `boolean \| AnimationConfig` | — | 除非传入 `true` 或配置，否则关闭。 |
| `arrow` | `boolean` | `false` | 定位箭头部分。请在 content 内渲染箭头组件。 |
| `arrowSize` / `arrowPadding` | `number` | `8` / `0` | 箭头边长以及与弹层边缘的间距（像素）。 |
| `trapFocus` | `boolean` | `false` | 该 layer 位于最上层时约束焦点。 |
| `initialFocus` | `boolean \| "container" \| "first" \| Element \| null` | — | 打开时焦点落点；默认不聚焦。 |
| `restoreFocus` | `boolean` | `true` | 从内部关闭时把焦点还给 trigger。 |
| `@update:open` / `@open-change` | `(open, reason) => void` | — | 每次变化时触发；`reason` 为 `trigger`、`escape-key`、`outside-press`、`reference-press`、`select` 或 `programmatic`。默认 slot 接收 `{ open }`。 |

根组件不渲染元素。它持有状态并与其各部分共享，因此在根组件之外使用某个部分会抛出清晰的错误。

### `PopoverTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"button"` | 要渲染的标签。请使用可聚焦元素。 |
| `...attrs` | `HTMLAttributes` | — | 转发给该元素。设置 `type="button"`、`aria-expanded`，打开时设置 `aria-controls`。 |

### `PopoverContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"div"` | 要渲染的标签。 |
| `...attrs` | `HTMLAttributes` | — | 转发给 content `div`。不会添加 `role` 或焦点陷阱；`PopoverTitle` 与 `PopoverDescription` 会连接 `aria-labelledby` 和 `aria-describedby`。 |

`PopoverHeader`、`PopoverTitle`、`PopoverDescription`、`PopoverClose` 和 `PopoverArrow` 接受 `as` 并转发其余属性。`PopoverClose` 会关闭 popover。

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
| `enabled` | `boolean` | `true` with a config | 设为 `false` 可关闭动画。 |
| `type` | `"fade" \| "expand" \| "custom"` | `"fade"` | `expand` 从锚点边缘展开；设置 `custom` 时自动推断为 `custom`。 |
| `direction` | `"up" \| "down" \| "left" \| "right" \| "auto"` | `"auto"` | 移动方向；`auto` 跟随最终 placement。 |
| `duration` | `number` | `160` | 毫秒。 |
| `delay` | `number` | `0` | 毫秒。 |
| `easing` | `string` | `"ease-in-out"` | `ease-in-out`、`linear` 或任意 CSS timing function。 |
| `custom` | `{ enter, exit } \| keyframes` | — | CSS class 或 Web Animations keyframes（数组或函数）。 |
| `...` | — | — | 传入 `true` 使用默认值。退出动画反向播放进入动画；减少动态效果时仅保留 opacity。 |

```css
.panel {
  --overlay-arrow-background: #121a27;
  --overlay-arrow-border-width: 1px;
  --overlay-arrow-border-color: #3d5478;
}
```

### `as`

每个部分都会渲染合适的默认标签。传入 `as` 可更改，例如用 `as="span"` 把禁用的按钮包在可聚焦元素中。该部分仍保留其 id、ARIA 属性和 ref。

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
| `open` | `boolean` | — | 受控可见性。使用 `v-model:open`。 |
| `defaultOpen` | `boolean` | `false` | 非受控时的初始可见性。 |
| `disabled` | `boolean` | `false` | 关闭 overlay 并忽略 trigger。 |
| `placement` | `Placement` | `"bottom-start"`（Tooltip 为 `"top"`） | 边加可选的 `-start` 或 `-end`。 |
| `offset` / `alignOffset` | `number` | `0` | 主轴间距与交叉轴偏移（像素）。 |
| `flip` / `shift` / `autoUpdate` | `boolean` | `true` | 碰撞处理，以及滚动和缩放时重新定位。 |
| `padding` | `number` | `0` | 与碰撞边界的间距。 |
| `boundary` | `Element \| "clippingAncestors" \| "viewport"` | `"clippingAncestors"` | 碰撞边界。 |
| `strategy` | `"absolute" \| "fixed"` | automatic | 自动：`absolute`，固定/粘性锚点用 `fixed`。 |
| `dir` | `"ltr" \| "rtl"` | — | 应用到 content 元素。 |
| `dismissOnEscape` / `dismissOnOutsidePress` | `boolean` | `true` | 按 Escape 或在外部主键按下时关闭。 |
| `portal` | `boolean \| HTMLElement` | `true` | `true` 渲染到 `document.body`，传入元素则选择容器，`false` 就地渲染。 |
| `animation` | `boolean \| AnimationConfig` | — | 除非传入 `true` 或配置，否则关闭。 |
| `arrow` | `boolean` | `false` | 定位箭头部分。请在 content 内渲染箭头组件。 |
| `arrowSize` / `arrowPadding` | `number` | `8` / `0` | 箭头边长以及与弹层边缘的间距（像素）。 |
| `delay` | `number` | `500` | 悬停打开延迟（毫秒）。 |
| `closeDelay` | `number` | `100` | 指针或焦点离开后关闭前的延迟。 |
| `hoverableContent` | `boolean` | `true` | 指针在内容上时保持打开。 |
| `@update:open` / `@open-change` | `(open, reason) => void` | — | 每次变化时触发；`reason` 为 `trigger`、`escape-key`、`outside-press`、`reference-press`、`select` 或 `programmatic`。默认 slot 接收 `{ open }`。 |

根组件不渲染元素。它持有状态并与其各部分共享，因此在根组件之外使用某个部分会抛出清晰的错误。

### `TooltipTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"button"` | 要渲染的标签。请使用可聚焦元素。 |
| `...attrs` | `HTMLAttributes` | — | 转发给该元素。打开时带有 `aria-describedby`；点击只会关闭，不会打开。 |

### `TooltipContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"div"` | 要渲染的标签。 |
| `...attrs` | `HTMLAttributes` | — | 转发给带 `role="tooltip"` 的 content `div`。内容不可聚焦。 |

悬停在 `delay` 后打开，聚焦立即打开，Escape 或外部点击关闭。触摸悬停会被忽略。`TooltipArrow` 接受 `as` 并转发其余属性。

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

`Tooltip` 接受与 Popover 相同的 `animation` 选项：传入 `true` 或类似 `{ duration: 160 }` 的配置。参见 [Popover 选项](https://github.com/zealakit/overlay/blob/main/packages/vue/README_CN.md#popover)。

### `as`

每个部分都会渲染合适的默认标签。传入 `as` 可更改，例如用 `as="span"` 把禁用的按钮包在可聚焦元素中。该部分仍保留其 id、ARIA 属性和 ref。

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
| `open` | `boolean` | — | 受控可见性。使用 `v-model:open`。 |
| `defaultOpen` | `boolean` | `false` | 非受控时的初始可见性。 |
| `disabled` | `boolean` | `false` | 关闭 overlay 并忽略 trigger。 |
| `placement` | `Placement` | — | 对话框不锚定。 |
| `dir` | `"ltr" \| "rtl"` | — | 应用到 content 元素。 |
| `dismissOnEscape` / `dismissOnOutsidePress` | `boolean` | `true` | 按 Escape 或在外部主键按下时关闭。 |
| `portal` | `boolean \| HTMLElement` | `true` | `true` 渲染到 `document.body`，传入元素则选择容器，`false` 就地渲染。 |
| `animation` | `boolean \| AnimationConfig` | — | 除非传入 `true` 或配置，否则关闭。 |
| `modal` | `boolean` | `true` | 模态：`aria-modal`、焦点约束、背景 inert、滚动锁。 |
| `lockScroll` | `boolean` | `modal` | 打开时锁定文档滚动。 |
| `trapFocus` | `boolean` | `modal` | 该 layer 位于最上层时约束焦点。 |
| `initialFocus` | `boolean \| "container" \| "first" \| Element \| null` | 模态时为 `"container"` | 打开时焦点落点；`null` 保持焦点不动。 |
| `restoreFocus` | `boolean` | `true` | 关闭时恢复焦点。 |
| `@update:open` / `@open-change` | `(open, reason) => void` | — | 每次变化时触发；`reason` 为 `trigger`、`escape-key`、`outside-press`、`reference-press`、`select` 或 `programmatic`。默认 slot 接收 `{ open }`。 |

根组件不渲染元素。它持有状态并与其各部分共享，因此在根组件之外使用某个部分会抛出清晰的错误。

### `DialogTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"button"` | 要渲染的标签。请使用可聚焦元素。 |
| `...attrs` | `HTMLAttributes` | — | 转发给该元素。设置 `aria-haspopup="dialog"`、`aria-expanded` 和 `aria-controls`。 |

### `DialogContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"div"` | 要渲染的标签。 |
| `...attrs` | `HTMLAttributes` | — | 转发给带 `role="dialog"` 的 content `div`。请添加 `DialogTitle` 或 `aria-label` 以提供可访问名称。 |

`DialogBackdrop` 包裹 viewport 与 content，因此 backdrop、viewport 和 content 作为一个整体进行 portal 与切换。`DialogHeader` 与 `DialogFooter` 是布局包装；`DialogTitle` 与 `DialogDescription` 连接 `aria-labelledby` 和 `aria-describedby`；`DialogClose` 会关闭对话框。它们都接受 `as`。

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

`Dialog` 接受与 Popover 相同的 `animation` 选项：传入 `true` 或类似 `{ duration: 160 }` 的配置。参见 [Popover 选项](https://github.com/zealakit/overlay/blob/main/packages/vue/README_CN.md#popover)。

### `as`

每个部分都会渲染合适的默认标签。传入 `as` 可更改，例如用 `as="span"` 把禁用的按钮包在可聚焦元素中。该部分仍保留其 id、ARIA 属性和 ref。

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
| `open` | `boolean` | — | 受控可见性。使用 `v-model:open`。 |
| `defaultOpen` | `boolean` | `false` | 非受控时的初始可见性。 |
| `disabled` | `boolean` | `false` | 关闭 overlay 并忽略 trigger。 |
| `placement` | `Placement` | `"bottom-start"`（Tooltip 为 `"top"`） | 边加可选的 `-start` 或 `-end`。 |
| `offset` / `alignOffset` | `number` | `0` | 主轴间距与交叉轴偏移（像素）。 |
| `flip` / `shift` / `autoUpdate` | `boolean` | `true` | 碰撞处理，以及滚动和缩放时重新定位。 |
| `padding` | `number` | `0` | 与碰撞边界的间距。 |
| `boundary` | `Element \| "clippingAncestors" \| "viewport"` | `"clippingAncestors"` | 碰撞边界。 |
| `strategy` | `"absolute" \| "fixed"` | automatic | 自动：`absolute`，固定/粘性锚点用 `fixed`。 |
| `dir` | `"ltr" \| "rtl"` | — | 应用到 content 元素。 |
| `dismissOnEscape` / `dismissOnOutsidePress` | `boolean` | `true` | 按 Escape 或在外部主键按下时关闭。 |
| `portal` | `boolean \| HTMLElement` | `true` | `true` 渲染到 `document.body`，传入元素则选择容器，`false` 就地渲染。 |
| `animation` | `boolean \| AnimationConfig` | — | 除非传入 `true` 或配置，否则关闭。 |
| `@update:open` / `@open-change` | `(open, reason) => void` | — | 每次变化时触发；`reason` 为 `trigger`、`escape-key`、`outside-press`、`reference-press`、`select` 或 `programmatic`。默认 slot 接收 `{ open }`。 |

根组件不渲染元素。它持有状态并与其各部分共享，因此在根组件之外使用某个部分会抛出清晰的错误。

### `ContextMenuTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"div"` | 要渲染的标签。请使用可聚焦元素。 |
| `...attrs` | `HTMLAttributes` | — | 转发给该元素。设置 `tabindex="0"`；右键、Context Menu 键和 Shift+F10 会打开菜单。 |

### `ContextMenuContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `"div"` | 要渲染的标签。 |
| `...attrs` | `HTMLAttributes` | — | 转发给带 `role="menu"` 的 content `div`。方向键、Home、End 和 typeahead 用于移动焦点；菜单不会陷住焦点。 |

### `ContextMenuItem` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `disabled` | `boolean` | `false` | 键盘导航会跳过它，且不会被激活。 |
| `closeOnSelect` | `boolean` | `true` | 设为 `false` 可在选择后保持菜单打开。 |
| `as` | `string \| Component` | `"div"` | 要渲染的标签。 |
| `@select` | `(event: MouseEvent) => void` | — | 点击或键盘激活时调用。菜单项渲染 `role="menuitem"`、`aria-disabled` 和 `data-disabled`；其他属性会被转发。 |

`ContextMenuGroup`、`ContextMenuLabel`、`ContextMenuSeparator` 和 `ContextMenuShortcut` 是结构组件。子菜单、复选菜单项和单选菜单项不在此 package 内；请使用 React。

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

`ContextMenu` 接受与 Popover 相同的 `animation` 选项：传入 `true` 或类似 `{ duration: 160 }` 的配置。参见 [Popover 选项](https://github.com/zealakit/overlay/blob/main/packages/vue/README_CN.md#popover)。

### `as`

每个部分都会渲染合适的默认标签。传入 `as` 可更改，例如用 `as="span"` 把禁用的按钮包在可聚焦元素中。该部分仍保留其 id、ARIA 属性和 ref。

## Composables

组件基于这些 composable 构建。需要自己的标记时可直接使用它们。

| Export | Purpose |
| --- | --- |
| `usePopover(options)` / `useTooltip(options)` / `useDialog(options)` / `useContextMenu(options)` | 基于模板 ref 的控制器 composable。 |
| `useOverlayComponent(kind, options)` | 上述四个 composable 的通用形式。 |
| `usePositioner(options)` | 返回 `shallowRef` 结果的响应式 positioner。 |
| `useLayer(options)` | 挂载期间注册 layer；通过 `parent` 嵌套。 |
| `useOverlay(options)` | 由 `usePositioner` 与 `useLayer` 组合的非受控开关状态。 |
| `useEscapeKey(handler, options?)` | 带 `enabled` 和 `target` 的 Escape 监听器。 |
| `createFocusContainment`, `focusElement`, `focusFirst`, `getFocusableElements`, `isFocusable`, `getActiveElement`, `restoreFocus` | 从 core 重新导出的焦点原语。 |

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

除回调外，每个选项都接受 `ref` 或 getter（`MaybeRefOrGetter`）。返回值包含 `isOpen`（`Ref<boolean>`）、`controller`、`contentId`、`open()`、`close()`、`toggle()`、`setOpen()`、`update()` 和 `dispose()`。

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `trigger` | `HTMLElement` | **required** | 锚定并触发 overlay 的元素。 |
| `content` | `HTMLElement` | **required** | 由你拥有的浮层元素。控制器会切换 `hidden` 和 `data-state`。 |
| `backdrop` | `HTMLElement \| null` | — | Dialog 的 backdrop 元素。 |
| `open` | `boolean` | — | 受控可见性；用 `setOpen()` 同步外部状态。 |
| `defaultOpen` | `boolean` | `false` | 非受控时的初始可见性。 |
| `disabled` | `boolean` | `false` | 关闭 overlay 并忽略触发。 |
| `onOpenChange` | `(open, reason) => void` | — | 用户或程序每次改变状态时调用。 |
| `onSelect` | `(item, event) => void` | — | 仅 ContextMenu：某个菜单项被激活。 |
| `portal` | `Element \| null` | — | 打开时把 content（和 backdrop）移到此处。 |
| `stack` | `LayerStack` | per-document | 共用显式的 layer stack。 |
| `parentLayer` | `LayerStackHandle \| null` | — | 嵌套 overlay 的父 layer。 |
| `boundaries` | `(Element \| null)[]` | — | 额外算作内部的元素。 |
| `placement` | `Placement` | `"bottom-start"` | Tooltip 默认 `top`；Dialog 不锚定。 |
| `offset` | `number` | `0` | 主轴间距（像素）。 |
| `alignOffset` | `number` | `0` | 交叉轴偏移（像素）。 |
| `flip` | `boolean` | `true` | 空间不足时翻转到对侧。 |
| `shift` | `boolean` | `true` | 沿交叉轴移动以保持可见。 |
| `padding` | `number` | `0` | 与碰撞边界的间距。 |
| `boundary` | `Element \| "clippingAncestors" \| "viewport"` | `"clippingAncestors"` | 碰撞边界。 |
| `strategy` | `"absolute" \| "fixed"` | automatic | 自动：`absolute`，固定/粘性锚点用 `fixed`。 |
| `autoUpdate` | `boolean` | `true` | 滚动、缩放和布局变化时重新定位。 |
| `arrow` | `{ element, size?, padding? } \| null` | — | 仅 Popover 和 Tooltip；箭头元素由你提供。 |
| `animation` | `boolean \| AnimationConfig` | — | 除非传入 `true` 或配置，否则关闭。 |
| `dir` | `"ltr" \| "rtl"` | — | 应用到 content 元素。 |
| `dismissOnEscape` | `boolean` | `true` | 按 Escape 关闭（仅最上层）。 |
| `dismissOnOutsidePress` | `boolean` | `true` | 在外部主键按下时关闭。 |
| `modal` | `boolean` | `true` | 仅 Dialog：背景 inert、焦点约束、锁定滚动。 |
| `lockScroll` | `boolean` | `true` | 仅 Dialog，且 `modal` 时。 |
| `trapFocus` | `boolean` | `modal` | Dialog 跟随 `modal`；Popover 默认 `false`。 |
| `initialFocus` | `"container" \| "first" \| Element \| boolean \| null` | — | Dialog：modal 时聚焦容器；ContextMenu：首个菜单项；Popover：不聚焦。 |
| `finalFocus` | `Element \| null` | — | 关闭时焦点返回的位置；默认为 trigger。 |
| `restoreFocus` | `boolean` | `true` | 关闭时恢复焦点。 |
| `delay` | `number` | `500` | 仅 Tooltip：打开延迟（毫秒）。 |
| `closeDelay` | `number` | `100` | 仅 Tooltip：关闭延迟（毫秒）。 |
| `hoverableContent` | `boolean` | `true` | 仅 Tooltip：指针在内容上时保持打开。 |
| `labelledBy` / `describedBy` | `string` | — | 仅 Dialog：用于 `aria-labelledby` / `aria-describedby` 的 id。 |
| `toggleOnTriggerClick` | `boolean` | `true` | Popover 和 Dialog：点击 trigger 时切换。 |
| `...` | — | — | 不转发其他属性；请直接设置在你自己的元素上。 |

## Lifecycle

- 渲染或 SSR setup 期间不会执行 DOM 操作；控制器在 `onMounted` 中创建。
- 每个 composable 在 `onScopeDispose` 时销毁；在 scope 之外请调用返回的 `dispose()`。
- `dispose()` 是幂等的，重复调用或重新挂载不会产生额外影响。
- 嵌套 overlay 共用每个 document 一个带引用计数的 layer stack，因此 Escape 会先关闭最上层。

## Styling hooks

| Attribute | Where | Purpose |
| --- | --- | --- |
| `data-state` | Content、trigger | `"open"` 或 `"closed"`。 |
| `data-open` / `data-closed` | Content | 供 CSS 选择器使用的标记。 |
| `data-side` / `data-align` / `data-placement` | Content | flip 和 shift 之后的最终 placement。 |
| `data-animating` | Content | 动画运行期间为 `"enter"` 或 `"exit"`。 |
| `--overlay-transform-origin` | Content | 基于 class 的动画使用的锚点边缘原点。 |
| `--overlay-arrow-*` | 面板或其祖先 | 箭头的背景、边框宽度和边框颜色。 |

```css
.panel {
  --overlay-arrow-background: #121a27;
  --overlay-arrow-border-width: 1px;
  --overlay-arrow-border-color: #3d5478;
}
```

## Nuxt

在服务端导入 package 是安全的，overlay 内容仅在挂载后才可交互。手动创建控制器的组件请用 `<ClientOnly>` 包裹。

## AI Agent Skill

在此 package 上工作的编码 agent 应先加载 [overlay skill](https://github.com/zealakit/overlay/blob/main/.agents/skills/overlay/SKILL.md)。

## License

MIT © Zealakit
