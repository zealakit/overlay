# @zealakit/overlay-react

[English](https://github.com/zealakit/overlay/blob/main/packages/react/README.md) | [Tiếng Việt](https://github.com/zealakit/overlay/blob/main/packages/react/README_VI.md) | [中文](https://github.com/zealakit/overlay/blob/main/packages/react/README_CN.md)

![Zealakit Overlay cover](https://github.com/zealakit/overlay/blob/main/assets/images/overlay-cover.jpg?raw=true)

面向 React 的无样式 Popover、Tooltip、Dialog 和 ContextMenu。提供复合组件、定位、分层关闭、焦点管理和底层 hook。视觉样式由你自己决定。

请通过 `className`、`style` 和下方的 `data-*` 钩子为各部分设置样式。关闭的内容会被卸载（或用 `keepMounted` 保留），因此退出动画需要 `animation` 属性才能干净收尾。

> **Note**
> Overlay 是一组专注的 headless 浮层原语，涵盖 Popover、Tooltip、Dialog 和 ContextMenu。它不附带 CSS，也不渲染带样式的标记，所有视觉细节都由你掌控。Select、Combobox、DatePicker、DropdownMenu、Menubar 和命令面板尚未实现。
>
> Overlay 不能替代完整的 UI 库或设计系统。当你需要无障碍的浮层基础组件、又不想引入大型 UI 套件，或现有库中的浮层组件难以重设样式时，可以使用它。

## Install

```bash
npm install @zealakit/overlay-react

# or yarn, pnpm, ...
```

Peer 依赖：`react` 与 `react-dom` `^18.0.0 || ^19.0.0`；React 应用已提供这些运行时。仅支持 ESM。入口带有 `"use client"`，适用于 Next.js App Router。内部内核 `@zealakit/overlay-core` 已内置于本包中，不会发布到 npm；无需额外安装。

## Popover

### Quick start

```tsx
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@zealakit/overlay-react";

export function EditProfile() {
  return (
    <Popover>
      <PopoverTrigger>Edit profile</PopoverTrigger>
      <PopoverContent side="bottom" align="start" sideOffset={8}>
        <PopoverHeader>
          <PopoverTitle>Edit profile</PopoverTitle>
          <PopoverDescription>Update your profile information.</PopoverDescription>
        </PopoverHeader>
        <PopoverClose>Close</PopoverClose>
      </PopoverContent>
    </Popover>
  );
}
```

### `Popover` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | 受控可见性。 |
| `defaultOpen` | `boolean` | `false` | 非受控时的初始可见性。 |
| `onOpenChange` | `(open: boolean, reason) => void` | — | `reason` 为 `trigger`、`outside-press`、`escape`、`close-button` 或 `programmatic`。 |
| `dismissOnEscape` | `boolean` | `true` | 按 Escape 关闭。 |
| `dismissOnOutsidePress` | `boolean` | `true` | 在外部主键按下时关闭。 |
| `dir` | `"ltr" \| "rtl"` | `"ltr"` | start/end 对齐所用的方向。 |
| `parentLayer` | `LayerStackHandle \| null` | — | 嵌套在自定义 layer 中时的父 layer。 |
| `children` | `ReactNode` | — | `Popover` 不渲染元素，因此不转发其他属性。 |

根组件持有状态和生成的 id。嵌套的 Popover 继承父 layer，因此 Escape 先关闭子级。

### `PopoverTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `asChild` | `boolean` | `false` | 把 trigger 行为合并到唯一的子元素上，而不是包裹它。 |
| `...button props` | `ComponentPropsWithoutRef<"button">` | — | 转发给原生 `button`。设置 `aria-expanded`，打开时设置 `aria-controls`。 |

你的 `onClick` 先执行；调用 `event.preventDefault()` 会阻止切换。禁用的 trigger 不会打开。

### `PopoverContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `anchor` | `Element \| null` | trigger | 显式的参考元素。 |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"bottom"` | 锚点的物理边。 |
| `align` | `"start" \| "center" \| "end"` | `"center"` | 对 top 和 bottom 边遵循 `dir`。 |
| `sideOffset` | `number` | `0` | 主轴间距（像素）。 |
| `alignOffset` | `number` | `0` | 交叉轴偏移（像素）。 |
| `collisionBoundary` | `Element \| "clippingAncestors" \| "viewport"` | `"clippingAncestors"` | 碰撞边界。 |
| `collisionPadding` | `number` | `0` | 与边界的间距。 |
| `collisionAvoidance` | `{ flip?: boolean; shift?: boolean }` | `{ flip: true, shift: true }` | 独立开关 flip 与 shift。 |
| `positionMethod` | `"absolute" \| "fixed"` | automatic | 自动：`absolute`，固定/粘性锚点用 `fixed`。 |
| `arrow` | `boolean` | `false` | 渲染默认的箭头部分。 |
| `arrowSize` | `number` | `8` | 箭头边长（像素）。 |
| `arrowPadding` | `number` | `0` | 箭头与弹层边缘的间距。 |
| `arrowClassName` / `arrowStyle` | `string` / `CSSProperties` | — | 默认箭头的 class 与内联样式。 |
| `initialFocus` | `boolean` | `false` | 打开时聚焦第一个可聚焦元素。 |
| `trapFocus` | `boolean` | `false` | 该 layer 位于最上层时约束焦点。 |
| `restoreFocus` | `boolean` | `true` | 从内部关闭时把焦点还给 trigger。 |
| `animation` | `boolean \| AnimationConfig` | — | 除非传入 `true` 或配置，否则关闭。 |
| `portal` | `boolean \| Element \| null` | `true` | `true` 渲染到 `document.body`，传入元素则选择容器，`false` 就地渲染。 |
| `...div props` | `HTMLAttributes<HTMLDivElement>` | — | 转发给弹层 `div`；定位属性会被消费，不会进入 DOM。 |

默认不添加 `role`、`aria-modal` 或焦点陷阱；请选择适合内容的 role。`PopoverTitle` 与 `PopoverDescription` 会连接 `aria-labelledby` 和 `aria-describedby`。`PopoverPortal`、`PopoverPositioner` 和 `PopoverPopup` 可用于高级组合。

### Controlled usage

```tsx
const [open, setOpen] = useState(false);

<Popover open={open} onOpenChange={(next, reason) => setOpen(next)}>
  <PopoverTrigger>Edit profile</PopoverTrigger>
  <PopoverContent>Update your profile information.</PopoverContent>
</Popover>;
```

### Arrow and animation configuration

```tsx
<PopoverContent
  arrow
  arrowSize={10}
  animation={{ type: "expand", duration: 220 }}
  className="panel"
>
  Update your profile information.
</PopoverContent>
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

### `asChild`

```tsx
<PopoverTrigger asChild>
  <MyButton>Edit profile</MyButton>
</PopoverTrigger>
```

`asChild` 只克隆一个子元素，并保留你的 ref 和事件处理函数。自定义组件必须转发 ref，弹层才能相对它们定位。

## Tooltip

### Quick start

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@zealakit/overlay-react";

export function SaveButton() {
  return (
    <TooltipProvider delay={500}>
      <Tooltip>
        <TooltipTrigger>Edit profile</TooltipTrigger>
        <TooltipContent side="top">Update your profile information.</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

### `TooltipProvider` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `delay` | `number` | `500` | 悬停打开延迟（毫秒）。 |
| `closeDelay` | `number` | `100` | 指针或焦点离开后关闭前的延迟。 |
| `skipDelayDuration` | `number` | `300` | 打开后的时间窗口，期间下一个 Tooltip 立即打开。 |
| `disableHoverableContent` | `boolean` | `false` | 离开 trigger 即关闭，即使指针进入内容。 |
| `children` | `ReactNode` | — | Provider 不渲染元素。它是可选的；没有 provider 的 Tooltip 使用默认值。 |

### `Tooltip` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | 受控可见性。 |
| `defaultOpen` | `boolean` | `false` | 非受控时的初始可见性。 |
| `onOpenChange` | `(open: boolean, reason) => void` | — | `reason` 为 `hover`、`focus`、`escape`、`outside-press`、`trigger` 或 `programmatic`。 |
| `disabled` | `boolean` | `false` | 永不打开。 |
| `delay` / `closeDelay` / `disableHoverableContent` | — | provider 的值 | 为此 Tooltip 覆盖 provider 的设置。 |
| `dir` | `"ltr" \| "rtl"` | `"ltr"` | start/end 对齐所用的方向。 |
| `children` | `ReactNode` | — | `Tooltip` 不渲染元素，因此不转发其他属性。 |

悬停在 `delay` 后打开，聚焦立即打开，Escape 或外部点击关闭。触摸悬停会被忽略。Tooltip 不注册 layer，因此不会阻挡父级 Popover 或 Dialog。

### `TooltipTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `asChild` | `boolean` | `false` | 把 trigger 行为合并到唯一的子元素上。 |
| `...button props` | `ComponentPropsWithoutRef<"button">` | — | 转发给原生 `button`。打开时带有 `aria-describedby`；点击只会关闭，不会打开。 |

### `TooltipContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `anchor` | `Element \| null` | trigger | 显式的参考元素。 |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"bottom"` | 锚点的物理边。 |
| `align` | `"start" \| "center" \| "end"` | `"center"` | 对 top 和 bottom 边遵循 `dir`。 |
| `sideOffset` | `number` | `0` | 主轴间距（像素）。 |
| `alignOffset` | `number` | `0` | 交叉轴偏移（像素）。 |
| `collisionBoundary` | `Element \| "clippingAncestors" \| "viewport"` | `"clippingAncestors"` | 碰撞边界。 |
| `collisionPadding` | `number` | `0` | 与边界的间距。 |
| `collisionAvoidance` | `{ flip?: boolean; shift?: boolean }` | `{ flip: true, shift: true }` | 独立开关 flip 与 shift。 |
| `positionMethod` | `"absolute" \| "fixed"` | automatic | 自动：`absolute`，固定/粘性锚点用 `fixed`。 |
| `arrow` | `boolean` | `false` | 渲染默认的箭头部分。 |
| `arrowSize` | `number` | `8` | 箭头边长（像素）。 |
| `arrowPadding` | `number` | `0` | 箭头与弹层边缘的间距。 |
| `arrowClassName` / `arrowStyle` | `string` / `CSSProperties` | — | 默认箭头的 class 与内联样式。 |
| `animation` | `boolean \| AnimationConfig` | — | 除非传入 `true` 或配置，否则关闭。 |
| `portal` | `boolean \| Element \| null` | `true` | `true` 渲染到 `document.body`，传入元素则选择容器，`false` 就地渲染。 |
| `...div props` | `HTMLAttributes<HTMLDivElement>` | — | 转发给带 `role="tooltip"` 的弹层 `div`。弹层不可聚焦。 |

### Controlled usage

```tsx
const [open, setOpen] = useState(false);

<Tooltip open={open} onOpenChange={(next, reason) => setOpen(next)}>
  <TooltipTrigger>Edit profile</TooltipTrigger>
  <TooltipContent>Update your profile information.</TooltipContent>
</Tooltip>;
```

### Arrow and animation configuration

```tsx
<TooltipContent arrow arrowSize={6} animation={{ duration: 120 }}>
  Update your profile information.
</TooltipContent>
```

选项与 [Popover](https://github.com/zealakit/overlay/blob/main/packages/react/README_CN.md#arrow-and-animation-configuration) 相同。

### Disabled triggers

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <span tabIndex={0}>
      <button type="button" disabled>Edit profile</button>
    </span>
  </TooltipTrigger>
  <TooltipContent>Editing is unavailable.</TooltipContent>
</Tooltip>
```

原生禁用按钮无法获得焦点，请用可聚焦元素包裹。内容可交互时请改用 Popover。

## Dialog

### Quick start

```tsx
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@zealakit/overlay-react";

export function EditProfile() {
  return (
    <Dialog>
      <DialogTrigger>Edit profile</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Update your profile information.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>Cancel</DialogClose>
          <button type="submit">Save</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### `Dialog` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | 受控可见性。 |
| `defaultOpen` | `boolean` | `false` | 非受控时的初始可见性。 |
| `onOpenChange` | `(open: boolean, reason) => void` | — | `reason` 为 `trigger`、`outside-press`、`escape`、`close-button` 或 `programmatic`。 |
| `modal` | `boolean` | `true` | 模态：`aria-modal`、焦点约束、背景 inert、滚动锁。 |
| `lockScroll` | `boolean` | `modal` | 打开时锁定文档滚动。 |
| `dismissOnEscape` | `boolean` | `true` | 按 Escape 关闭。 |
| `dismissOnOutsidePress` | `boolean` | `true` | 点击 backdrop 或外部时关闭。 |
| `dir` | `"ltr" \| "rtl"` | `"ltr"` | 传给弹层的方向。 |
| `parentLayer` | `LayerStackHandle \| null` | — | 嵌套在自定义 layer 中时的父 layer。 |
| `children` | `ReactNode` | — | `Dialog` 不渲染元素，因此不转发其他属性。 |

### `DialogTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `asChild` | `boolean` | `false` | 把 trigger 行为合并到唯一的子元素上。 |
| `...button props` | `ComponentPropsWithoutRef<"button">` | — | 转发给原生 `button`。设置 `aria-haspopup="dialog"`、`aria-expanded` 和 `aria-controls`。 |

### `DialogContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `backdrop` | `boolean` | `modal` | 渲染结构性 backdrop。 |
| `initialFocus` | `"container" \| "first" \| Element \| (() => Element \| null) \| null` | 模态时为 `"container"` | 打开时焦点落点；`null` 保持焦点不动。 |
| `finalFocus` | `Element \| (() => Element \| null) \| null` | — | 关闭时焦点返回的位置；默认为 trigger。 |
| `restoreFocus` | `boolean` | `true` | 关闭时恢复焦点。 |
| `keepMounted` | `boolean` | `false` | 关闭后把内容以 `hidden` 保留在 DOM 中，供你自己的过渡使用。 |
| `animation` | `boolean \| AnimationConfig` | — | 除非传入 `true` 或配置，否则关闭。 |
| `portal` | `boolean \| Element \| null` | `true` | `true` 渲染到 `document.body`，传入元素则选择容器，`false` 就地渲染。 |
| `...div props` | `HTMLAttributes<HTMLDivElement>` | — | 转发给带 `role="dialog"` 的弹层 `div`。 |

请添加 `DialogTitle` 或 `aria-label`；否则对话框没有可访问名称。`DialogHeader`、`DialogFooter` 和 `DialogClose` 是布局与关闭辅助组件；不会自动插入关闭按钮。`DialogPortal`、`DialogBackdrop`、`DialogViewport` 和 `DialogPopup` 可用于高级组合。

### Controlled usage

```tsx
const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={(next, reason) => setOpen(next)}>
  <DialogContent>
    <DialogTitle>Edit profile</DialogTitle>
  </DialogContent>
</Dialog>;
```

### Animation configuration

```tsx
<DialogContent animation={{ duration: 200 }}>
  <DialogTitle>Edit profile</DialogTitle>
</DialogContent>
```

选项与 [Popover](https://github.com/zealakit/overlay/blob/main/packages/react/README_CN.md#arrow-and-animation-configuration) 相同。对话框从中心缩放，backdrop 仅淡入淡出。

### `keepMounted`

关闭的内容默认会被卸载。使用 `keepMounted` 时，它以 `hidden` 和 `data-state="closed"` 保留。焦点约束与滚动锁在对话框关闭的瞬间释放，因此退出过渡不会让页面保持模态。

## ContextMenu

### Quick start

```tsx
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@zealakit/overlay-react";

export function ProfileCard() {
  return (
    <ContextMenu>
      <ContextMenuTrigger>Edit profile</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => console.log("edit")}>Edit</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled>Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
```

### `ContextMenu` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | 受控可见性。 |
| `defaultOpen` | `boolean` | `false` | 非受控时的初始可见性。 |
| `onOpenChange` | `(open: boolean, reason) => void` | — | `reason` 为 `trigger`、`outside-press`、`escape`、`select` 或 `programmatic`。 |
| `disabled` | `boolean` | `false` | 保留浏览器原生菜单。 |
| `dir` | `"ltr" \| "rtl"` | `"ltr"` | 方向；会反转子菜单一侧与方向键。 |
| `parentLayer` | `LayerStackHandle \| null` | — | 嵌套在自定义 layer 中时的父 layer。 |
| `children` | `ReactNode` | — | `ContextMenu` 不渲染元素，因此不转发其他属性。 |

### `ContextMenuTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `asChild` | `boolean` | `false` | 使用现有元素作为目标。 |
| `disabled` | `boolean` | `false` | 忽略触发。 |
| `...div props` | `ComponentPropsWithoutRef<"div">` | — | 转发给可聚焦的 `div`。右键、Context Menu 键和 Shift+F10 会打开菜单。 |

指针触发时锚定在光标处；键盘触发时锚定在 trigger。请为 trigger 设置合适的 role 或 label。

### `ContextMenuContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"bottom"` | 锚点的物理边。 |
| `align` | `"start" \| "center" \| "end"` | `"start"` | 对 top 和 bottom 边遵循 `dir`。 |
| `sideOffset` / `alignOffset` / `collisionPadding` | `number` | `0` | 偏移与边界间距（像素）。 |
| `collisionBoundary` / `collisionAvoidance` / `positionMethod` | — | — | 与 Popover 相同。 |
| `animation` | `boolean \| AnimationConfig` | — | 除非传入 `true` 或配置，否则关闭。 |
| `portal` | `boolean \| Element \| null` | `true` | `true` 渲染到 `document.body`，传入元素则选择容器，`false` 就地渲染。 |
| `...div props` | `HTMLAttributes<HTMLDivElement>` | — | 转发给带 `role="menu"` 的弹层 `div`。方向键、Home、End 和 typeahead 用于移动焦点；菜单不会陷住焦点。 |

### `ContextMenuItem` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `disabled` | `boolean` | `false` | 键盘导航会跳过它，且不会被激活。 |
| `onSelect` | `(event) => void` | — | 接收带有 `preventDefault()` 和 `originalEvent` 的事件。 |
| `closeOnSelect` | `boolean` | `true` | 设为 `false` 或调用 `event.preventDefault()` 可保持菜单打开。 |
| `asChild` | `boolean` | `false` | 使用你自己的元素作为菜单项。 |
| `...div props` | `ComponentPropsWithoutRef<"div">` | — | 转发给带 `role="menuitem"` 的菜单项 `div`。 |

### `ContextMenuCheckboxItem` / `ContextMenuRadioGroup` / `ContextMenuRadioItem` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `checked` / `defaultChecked` | `boolean` | — | 复选菜单项状态，受控或非受控。 |
| `onCheckedChange` | `(checked: boolean) => void` | — | 复选菜单项切换时调用。 |
| `value` / `defaultValue` | `string` | — | `RadioGroup` 的选中值；`RadioItem` 需要 `value`。 |
| `onValueChange` | `(value: string) => void` | — | 单选选择变化时调用。 |
| `closeOnSelect` | `boolean` | `false` | 复选与单选菜单项默认保持菜单打开。 |
| `...div props` | `ComponentPropsWithoutRef<"div">` | — | 转发时带有 `role="menuitemcheckbox"` 或 `role="menuitemradio"` 以及 `aria-checked`。 |

`ContextMenuGroup`、`ContextMenuLabel`、`ContextMenuSeparator` 和 `ContextMenuShortcut` 是结构组件。子菜单使用 `ContextMenuSub`（`defaultOpen`，非受控）、`ContextMenuSubTrigger` 和 `ContextMenuSubContent`；后者与 `ContextMenuContent` 接受相同的定位属性，LTR 时向右展开，RTL 时向左展开。

### Controlled usage

```tsx
const [open, setOpen] = useState(false);

<ContextMenu open={open} onOpenChange={(next, reason) => setOpen(next)}>
  <ContextMenuTrigger>Edit profile</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Edit</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>;
```

### Animation configuration

```tsx
<ContextMenuContent animation={{ type: "expand", duration: 160 }}>
  <ContextMenuItem>Edit</ContextMenuItem>
</ContextMenuContent>
```

选项与 [Popover](https://github.com/zealakit/overlay/blob/main/packages/react/README_CN.md#arrow-and-animation-configuration) 相同。ContextMenu 没有箭头。

### `onSelect`

```tsx
<ContextMenuItem
  onSelect={(event) => {
    event.preventDefault(); // keep the menu open
    console.log(event.originalEvent);
  }}
>
  Edit
</ContextMenuItem>
```

选择菜单项会关闭整个菜单树。Escape 与外部点击先只关闭最上层的子菜单。

## Hooks

| Export | Purpose |
| --- | --- |
| `usePositioner(options)` | 回调 ref 加最新的 `PositionerResult`；接受 core positioner 选项和显式 `reference`。 |
| `useLayer(options)` | 挂载期间注册 layer：`element`、`reference`、`parent`、`boundaries`、`dismissOnEscape`、`dismissOnOutsidePress`、`onDismiss`。 |
| `useOverlay(options)` | 由上述两个 hook 组合的非受控开关状态；返回 `isOpen`、`open`、`close`、`toggle`、ref 与 `floatingStyles`。 |
| `useEscapeKey(handler, options?)` | 带 `enabled` 和 `target` 的 Escape 监听器。 |
| `Portal` | 挂载后把 children 渲染到 `document.body` 或容器；服务端渲染 `null`。 |

```tsx
const { referenceRef, floatingRef, result } = usePositioner({
  placement: "bottom-start",
  offset: 8,
});

<button ref={referenceRef}>Edit profile</button>;
<div
  ref={floatingRef}
  style={{ position: result?.strategy ?? "fixed", left: result?.x ?? 0, top: result?.y ?? 0 }}
/>;
```

Hook 在 effect 中创建 core 对象，绝不在渲染期间创建，并且在 Strict Mode 下是安全的。core 的焦点工具（`createFocusContainment`、`focusElement`、`focusFirst`、`getFocusableElements`、`isFocusable`、`getActiveElement`、`restoreFocus`）已重新导出。

## Styling hooks

| Attribute | Where | Purpose |
| --- | --- | --- |
| `data-state` | 弹层、trigger | `"open"` 或 `"closed"`；`"closed"` 仅在使用 `keepMounted` 或 `animation` 时可见。 |
| `data-open` / `data-closed` | 弹层 | 供 CSS 选择器使用的标记。 |
| `data-side` / `data-align` | 弹层、箭头 | flip 和 shift 之后的最终 placement。 |
| `data-animating` | 弹层 | 动画运行期间为 `"enter"` 或 `"exit"`。 |
| `data-modal` / `data-non-modal` / `data-nested` / `data-nested-dialog-open` | Dialog 弹层 | 模式与嵌套状态。 |
| `data-disabled` | 菜单项 | 设置在禁用的菜单项上。 |
| `--popover-anchor-width` / `--popover-anchor-height` | Popover 弹层 | trigger 的尺寸，用于匹配宽度。 |
| `--tooltip-anchor-width` / `--tooltip-anchor-height` | Tooltip 弹层 | trigger 的尺寸。 |
| `--overlay-transform-origin` | 弹层 | 基于 class 的动画使用的锚点边缘原点。 |
| `--overlay-arrow-*` | 面板或其祖先 | 箭头的背景、边框宽度和边框颜色。 |

## Next.js App Router

所有入口都带有 `"use client"`，请在客户端组件中导入组件。在服务端导入是安全的，overlay 内容仅在挂载后渲染。

```tsx
"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@zealakit/overlay-react";
```

## Agent Skill

将 [Overlay React skill](https://github.com/zealakit/overlay/blob/main/skills/overlay-react.md) 添加到 agent 的 skills 目录，让它遵循此 package 的组件、样式和无障碍规则。

## License

MIT © Zealakit
