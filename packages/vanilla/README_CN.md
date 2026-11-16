# @zealakit/overlay-vanilla

[English](https://github.com/zealakit/overlay/blob/main/packages/vanilla/README.md) | [Tiếng Việt](https://github.com/zealakit/overlay/blob/main/packages/vanilla/README_VI.md) | [中文](https://github.com/zealakit/overlay/blob/main/packages/vanilla/README_CN.md)

![Zealakit Overlay cover](https://github.com/zealakit/overlay/blob/main/assets/images/overlay-cover.jpg?raw=true)

面向原生 TypeScript 和 JavaScript 的无样式 Popover、Tooltip、Dialog 和 ContextMenu。在你自己的元素上提供声明式 `data-*` 标记、命令式控制器、定位、layer stack、焦点处理和 ARIA 连接。视觉样式由你自己决定。

请用你自己的 CSS 和下方的 `data-*` 钩子为 trigger 与 content 设置样式。控制器会切换 content 的 `hidden`，因此退出动画请使用 `animation`，不要依赖 `display: none`。

> **Note**
> Overlay 是一组专注的 headless 浮层原语，涵盖 Popover、Tooltip、Dialog 和 ContextMenu。它不附带 CSS，也不渲染带样式的标记，所有视觉细节都由你掌控。Select、Combobox、DatePicker、DropdownMenu、Menubar 和命令面板尚未实现。
>
> Overlay 不能替代完整的 UI 库或设计系统。当你需要无障碍的浮层基础组件、又不想引入大型 UI 套件，或现有库中的浮层组件难以重设样式时，可以使用它。

## Install

```bash
npm install @zealakit/overlay-vanilla

# or yarn, pnpm, ...
```

无 peer 依赖。`@zealakit/overlay-core` 是自动安装的内部依赖，请勿单独安装。仅支持 ESM。

## Public API

| Export | Purpose |
| --- | --- |
| `initOverlays(root?)` | 把 `[data-overlay]` 标记转换为控制器；返回 `{ get, refresh, destroy }`。 |
| `createPopover(options)` | 非模态锚定面板，点击切换。 |
| `createTooltip(options)` | 带延迟和 `role="tooltip"` 的悬停/聚焦提示。 |
| `createDialog(options)` | 模态或非模态对话框，带焦点约束和滚动锁。 |
| `createContextMenu(options)` | 右键/键盘菜单，带 roving 焦点和 typeahead。 |
| `createOverlay(options)` | 基于 reference 与浮层元素、点击触发的底层 popover。 |
| `createFloating(options)` | 写入 `position`、`left`、`top` 和 `data-placement` 的 core positioner。 |
| `createLayerStack(options?)` | 单个 document 的 layer 注册表：排序、嵌套、Escape 与外部点击路由。 |
| `createFocusContainment`, `focusElement`, `focusFirst`, `getFocusableElements`, `isFocusable`, `getActiveElement`, `restoreFocus` | 供自定义 overlay 使用的焦点原语。 |

## Markup

### Quick start

```html
<div data-overlay="popover" data-placement="bottom-start" data-offset="8">
  <button data-trigger type="button">Edit profile</button>
  <div data-content hidden>
    <h2 data-title>Edit profile</h2>
    <p data-description>Update your profile information.</p>
    <button data-close type="button">Close</button>
  </div>
</div>
```

```ts
import { initOverlays } from "@zealakit/overlay-vanilla";

const overlays = initOverlays();

document.addEventListener("overlay-change", (event) => {
  console.log((event as CustomEvent).detail); // { open, reason }
});
```

### Host attributes

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data-overlay` | `"popover" \| "tooltip" \| "dialog" \| "context-menu"` | **required** | host 创建的 overlay 类型。 |
| `data-placement` | `Placement` | `"bottom-start"` | Tooltip 默认 `top`；Dialog 不锚定。 |
| `data-offset` / `data-align-offset` / `data-padding` | `number` | `0` | 间距与偏移（像素）。 |
| `data-flip` / `data-shift` / `data-auto-update` | `boolean` | `true` | 写入 `false` 可关闭。 |
| `data-strategy` | `"absolute" \| "fixed"` | automatic | 自动：`absolute`，固定/粘性锚点用 `fixed`。 |
| `data-dir` | `"ltr" \| "rtl"` | — | 应用到 content 元素。 |
| `data-dismiss-on-escape` / `data-dismiss-on-outside-press` | `boolean` | `true` | 写入 `false` 可关闭。 |
| `data-portal` | `"inline" \| "#selector"` | `document.body` | `inline` 让内容留在原处；选择器用于指定容器。 |
| `data-animation` / `data-animation-duration` | `"true" \| "fade" \| "expand"` / `number` | — | 除非设置，否则关闭。时长单位为毫秒。 |
| `data-arrow-size` | `number` | `8` | content 含有 `[data-arrow]` 时使用。 |
| `data-delay` / `data-close-delay` / `data-hoverable-content` | `number` / `boolean` | `500` / `100` / `true` | 仅 Tooltip。 |
| `data-modal` / `data-lock-scroll` / `data-trap-focus` | `boolean` | `true` / `modal` / `modal` | 仅 Dialog。 |
| `data-initial-focus` / `data-restore-focus` | `"container" \| "first" \| "none"` / `boolean` | 模态时为 `"container"` / `true` | 打开时焦点落点，以及关闭时是否还原。 |
| `data-default-open` / `data-disabled` | `boolean` | `false` | 初始状态与禁用状态。 |
| `...` | — | — | 其他属性保留在 host 上。host 会触发带 `{ open, reason }` 的 `overlay-change`，对于 context menu 还会触发带 `{ item, event }` 的 `overlay-select`；二者都会冒泡。 |

### Child markers

| Attribute | Where | Purpose |
| --- | --- | --- |
| `[data-trigger]` | host 的直接子元素 | 打开 overlay 的元素。缺失时使用隐藏的替身元素。 |
| `[data-content]` | host 的直接子元素，或位于 `[data-backdrop]` 内 | 浮层元素；请在标记中为其设置 `hidden`。 |
| `[data-backdrop]` | host 的直接子元素 | Dialog 的包装元素。可包含 content，此时两者作为一个整体 portal 与切换。 |
| `[data-arrow]` | 位于 content 内 | Popover 与 Tooltip 的箭头元素；由控制器定位。 |
| `[data-title]` / `[data-description]` | 位于 content 内 | 会获得 id，并在 content 上连接 `aria-labelledby` / `aria-describedby`。 |
| `[data-close]` | 位于 content 内 | 点击时关闭其所属的 overlay。 |
| `[data-item]` | 位于 context-menu 的 content 内 | 成为 `role="menuitem"`；添加 `data-disabled` 可禁用，添加 `data-keep-open` 可保持打开。 |

`initOverlays()` 会跳过已拥有控制器的 host，因此调用两次是安全的。增删标记后请调用 `refresh()`；页面卸载时调用 `destroy()`。`get(idOrElement)` 返回某个 host 的控制器。

## Usage

### Quick start

```ts
import { createDialog } from "@zealakit/overlay-vanilla";

const dialog = createDialog({
  trigger: document.querySelector<HTMLElement>("#open")!,
  content: document.querySelector<HTMLElement>("#panel")!,
  onOpenChange: (open, reason) => console.log(open, reason),
});

document.querySelector("#close")?.addEventListener("click", () => dialog.close());
```

### Controller options

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

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `isOpen` | `boolean` | — | 当前可见性（只读）。 |
| `contentId` | `string` | — | 分配给 content 元素的 id。 |
| `open(reason?)` / `close(reason?)` / `toggle(reason?)` | `void` | — | 改变可见性并调用 `onOpenChange`。 |
| `openAt(point, reason?)` | `void` | — | ContextMenu：在 `{ x, y }` 打开；`null` 锚定到 trigger。 |
| `setOpen(open)` | `void` | — | 同步受控状态，不调用 `onOpenChange`。 |
| `setOptions(patch)` | `void` | — | 创建后更新选项。 |
| `update()` | `Promise<PositionerResult \| null>` | — | 重新测量；关闭时返回 `null`。 |
| `subscribe(listener)` | `() => void` | — | 立即调用并在每次变化时以 `{ isOpen, placement, point }` 调用。 |
| `destroy()` | `void` | — | 幂等；移除监听器并还原属性。 |

控制器默认为非受控。当由你自己的状态决定可见性时，传入 `open` 并调用 `setOpen()`；`onOpenChange` 仍会报告用户意图。

### Controlled usage

```ts
let open = false;
const popover = createPopover({
  trigger,
  content,
  open,
  onOpenChange: (next) => {
    open = next;
    popover.setOpen(open);
  },
});
```

### Animation configuration

```ts
createPopover({
  trigger,
  content,
  arrow: { element: arrowEl, size: 10, padding: 8 },
  animation: { type: "expand", duration: 220 },
});
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

### `createOverlay`

```ts
const overlay = createOverlay({
  reference: trigger,
  floating: panel,
  placement: "bottom-start",
  portal: document.body,
  onOpenChange: (open, reason) => console.log(open, reason),
});
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `reference` | `Element` | **required** | 锚点元素；`trigger` 为 `"click"` 时点击会切换。 |
| `floating` | `HTMLElement` | **required** | 要定位的元素。关闭时隐藏。 |
| `trigger` | `"click" \| "none"` | `"click"` | `none` 表示由你的代码负责切换。 |
| `placement` / `offset` / `alignOffset` / `flip` / `shift` / `padding` / `boundary` / `strategy` / `autoUpdate` | — | — | 与上方控制器选项相同；`placement` 默认 `"bottom"`。 |
| `portal` | `Element \| null` | — | 打开时把 `floating` 移到此处；关闭时还原。 |
| `stack` / `boundaries` / `defaultOpen` / `dismissOnEscape` / `dismissOnOutsidePress` | — | — | 与上方控制器选项相同。 |
| `onOpenChange` | `(open, reason?) => void` | — | 关闭时 `reason` 为关闭原因，如 `"escape-key"` 或 `"reference-press"`。 |

`createOverlay` 返回 `isOpen`、`placement`、`open()`、`close(reason?)`、`toggle()`、`update()`、`subscribe(listener)` 和 `destroy()`。它是 popover 控制器的薄封装。

## Lifecycle

- 仅在浏览器中、元素存在之后创建控制器；没有 DOM 时 `initOverlays`、`createOverlay` 和各控制器不执行任何操作或抛出错误。
- 避免重复初始化：`initOverlays` 会跳过已初始化的 host；手动创建的控制器应每个 trigger 一个，并通过 `setOptions()` 复用。
- 元素移除时调用 `destroy()`。它是幂等的，会还原属性、portal 位置和焦点。
- 除非传入 `stack`，各控制器共用每个 document 一个带引用计数的 layer stack。

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

## Agent Skill

将 [Overlay Vanilla skill](https://github.com/zealakit/overlay/blob/main/skills/overlay-vanilla.md) 添加到 agent 的 skills 目录，让它遵循此 package 的组件、样式和无障碍规则。

## License

MIT © Zealakit
