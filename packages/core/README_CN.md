# @zealakit/overlay-core

[English](https://github.com/zealakit/overlay/blob/main/packages/core/README.md) | [Tiếng Việt](https://github.com/zealakit/overlay/blob/main/packages/core/README_VI.md) | [中文](https://github.com/zealakit/overlay/blob/main/packages/core/README_CN.md)

![Zealakit Overlay cover](https://github.com/zealakit/overlay/blob/main/assets/overlay-cover.jpg)

供所有 Zealakit Overlay 适配器使用的无样式内核，负责定位、分层、焦点和 DOM 控制器。提供支持碰撞检测的 positioner、layer stack、焦点工具和共享的 overlay controller。视觉样式由你自己决定。

Core 不渲染任何内容，也不附带 CSS。控制器只写入内联的 `position`、`left`、`top` 与 `data-*` 属性，因此所有视觉都由你的 CSS 决定，退出动画也能干净收尾。

> **Note**
> Overlay 是无样式（headless）的：不附带 CSS，也不渲染带样式的标记。已实现 Popover、Tooltip、Dialog 和 ContextMenu；尚未实现 Select、Combobox、DatePicker、DropdownMenu、Menubar 和命令面板。

## Install

```bash
npm install @zealakit/overlay-core
```

无 peer 依赖。唯一的运行时依赖是 `@floating-ui/dom`，它隐藏在 `createPositioner()` 之后，不会出现在公开类型中。

## Public API

| Export | Purpose |
| --- | --- |
| `createPositioner(options)` | 支持碰撞检测的 positioner：`setReference`、`setFloating`、`setOptions`、`update`、`subscribe`、`dispose`。 |
| `computePosition`, `resolvePlacementCoordinates`, `parsePlacement`, `DEFAULT_PLACEMENT` | 不含碰撞处理的同步 placement 计算。 |
| `getArrowStyles`, `applyArrowStyles`, `resetArrowStyles`, `snapshotArrowStyles` | 供自定义集成使用的箭头几何工具。 |
| `createLayerStack`, `acquireSharedLayerStack`, `createLayerStackRegistry` | layer 排序，以及每个 document 一对 Escape/外部点击监听器。 |
| `createLayer` | 带订阅的开/关状态机。 |
| `createOverlayController` | popover、tooltip、dialog 和 context menu 共用的 DOM 控制器。 |
| `createFocusContainment`, `focusElement`, `focusFirst`, `getFocusableElements`, `isFocusable`, `getActiveElement`, `restoreFocus` | 焦点原语。 |
| `acquireModalBackground` | 模态打开时让 body 的同级元素 inert；按 document 叠加。 |
| `moveToPortal`, `restorePortal` | 把元素移入 portal 目标并还原。 |
| `getMenuItems`, `moveMenuFocus`, `focusFirstMenuItem`, `focusLastMenuItem`, `focusMenuTypeahead`, `createTypeaheadBuffer` | 菜单的 roving 焦点与 typeahead。 |
| `lockBodyScroll` | 带引用计数的 body 滚动锁。 |
| `runOverlayAnimation`, `createFadeKeyframes`, `createExpandKeyframes`, `normalizeAnimationConfig` | 进入/退出动画执行器及工具。 |
| `listen`, `isEscapeKey`, `isOutsidePress`, `isPointerOutside`, `isPrimaryPointer`, `isBrowser` | 事件与环境工具。 |
| `isSamePositionerResult` | 比较 positioner 结果以跳过冗余更新。 |

## Usage

### Quick start

```ts
import { createPositioner } from "@zealakit/overlay-core";

const positioner = createPositioner({
  reference: trigger,
  floating: panel,
  placement: "bottom-start",
  offset: 8,
});

positioner.subscribe(({ x, y, placement, strategy }) => {
  Object.assign(panel.style, { position: strategy, left: `${x}px`, top: `${y}px` });
  panel.dataset.placement = placement;
});

await positioner.update();
positioner.dispose();
```

### `createPositioner` options

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `reference` | `ReferenceElement \| null` | — | 锚点元素或虚拟的 `{ getBoundingClientRect }`。 |
| `floating` | `HTMLElement \| null` | — | 要定位的元素。 |
| `placement` | `Placement` | `"bottom"` | 边加可选的 `-start` 或 `-end`。 |
| `offset` | `number` | `0` | 主轴间距（像素）。 |
| `alignOffset` | `number` | `0` | 交叉轴偏移（像素）。 |
| `flip` | `boolean` | `true` | 溢出时翻转到对侧。 |
| `shift` | `boolean` | `true` | 沿交叉轴移动以保持可见。 |
| `padding` | `number` | `0` | 与边界的间距。 |
| `boundary` | `Element \| "clippingAncestors" \| "viewport"` | `"clippingAncestors"` | 碰撞边界。 |
| `strategy` | `"absolute" \| "fixed"` | automatic | 自动：`absolute`，固定/粘性锚点用 `fixed`。 |
| `autoUpdate` | `boolean` | `true` | 滚动、缩放和布局变化时重新定位。 |
| `arrow` | `{ element, padding? } \| null` | `null` | 测量箭头元素并报告其偏移。 |
| `...` | — | — | positioner 只接受这些选项，绝不会修改焦点、ARIA 或 `hidden`。 |

元素缺失、已脱离 DOM，或被更新的 `update()` 取代时，`update()` 返回 `null`。订阅者只会收到最新的测量结果。

### Controller options

`createOverlayController({ kind, ... })` 接受 `kind`（`"popover" | "tooltip" | "dialog" | "context-menu"`）以及下列选项。

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

控制器会按所选类型设置 `role`、`aria-expanded`、`aria-controls`、`aria-haspopup`、`hidden` 和 `data-state`。Escape 与外部点击只会到达最上层 layer。

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

### Animation configuration

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

## Lifecycle

- 仅在浏览器中、元素存在之后创建 positioner 和 controller。
- 挂载期间可调用 `update()` 或 `setOptions()`；重复调用是安全的。
- 卸载时调用 `dispose()` 或 `destroy()`。两者都是幂等的，重复调用或重复初始化不会有副作用。
- SSR 期间导入 package 是安全的；没有 DOM 时 `createOverlayController` 会抛出错误。

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

## AI Agent Skill

在此 package 上工作的编码 agent 应先加载 [overlay skill](https://github.com/zealakit/overlay/blob/main/.agents/skills/overlay/SKILL.md)。

## License

MIT © Zealakit
