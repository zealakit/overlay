# @zealakit/overlay-core

[English](https://github.com/zealakit/overlay/blob/main/packages/core/README.md) | [Tiếng Việt](https://github.com/zealakit/overlay/blob/main/packages/core/README_VI.md) | [中文](https://github.com/zealakit/overlay/blob/main/packages/core/README_CN.md)

![Zealakit Overlay cover](https://github.com/zealakit/overlay/blob/main/assets/images/overlay-cover.jpg?raw=true)

Kernel nội bộ cho định vị, phân lớp, focus và DOM controller của mọi adapter Zealakit Overlay. Mọi adapter tự cài core, nên code ứng dụng nên dùng adapter của framework thay vì import core trực tiếp. Public API vẫn dành cho người viết adapter tùy biến.

Core không render gì và không kèm CSS. Controller chỉ ghi `position`, `left`, `top` inline cùng các thuộc tính `data-*`, nên CSS của bạn quyết định mọi hiển thị và animation thoát kết thúc gọn gàng.

> **Note**
> Overlay là bộ primitive headless tập trung cho Popover, Tooltip, Dialog và ContextMenu. Không kèm CSS và không render markup có kiểu dáng, nên mọi quyết định visual đều thuộc về bạn. Select, Combobox, DatePicker, DropdownMenu, Menubar và command palette chưa được triển khai.
>
> Overlay không phải là bản thay thế cho một UI library hay design system đầy đủ. Hãy dùng khi bạn cần các primitive overlay có accessibility mà không phải kéo theo một bộ UI lớn, hoặc khi overlay trong thư viện hiện tại khó restyle.

## Install

```bash
npm install @zealakit/overlay-core
```

Core được cài tự động cùng adapter; chỉ cài trực tiếp khi bạn viết adapter tùy biến. Không có peer dependency. Runtime dependency duy nhất là `@floating-ui/dom`, nằm sau `createPositioner()` và không bao giờ xuất hiện trong public type.

## Public API

| Export | Purpose |
| --- | --- |
| `createPositioner(options)` | Positioner có xử lý va chạm: `setReference`, `setFloating`, `setOptions`, `update`, `subscribe`, `dispose`. |
| `computePosition`, `resolvePlacementCoordinates`, `parsePlacement`, `DEFAULT_PLACEMENT` | Tính toán placement đồng bộ, không xử lý va chạm. |
| `getArrowStyles`, `applyArrowStyles`, `resetArrowStyles`, `snapshotArrowStyles` | Helper hình học mũi tên cho tích hợp tùy biến. |
| `createLayerStack`, `acquireSharedLayerStack`, `createLayerStackRegistry` | Sắp xếp layer cùng một cặp listener Escape/outside cho mỗi document. |
| `createLayer` | Máy trạng thái mở/đóng có subscribe. |
| `createOverlayController` | DOM controller dùng chung cho popover, tooltip, dialog và context menu. |
| `createFocusContainment`, `focusElement`, `focusFirst`, `getFocusableElements`, `isFocusable`, `getActiveElement`, `restoreFocus` | Primitive focus. |
| `acquireModalBackground` | Đánh dấu phần tử anh em của body là inert khi modal mở; xếp chồng theo document. |
| `moveToPortal`, `restorePortal` | Chuyển phần tử vào portal và đặt lại chỗ cũ. |
| `getMenuItems`, `moveMenuFocus`, `focusFirstMenuItem`, `focusLastMenuItem`, `focusMenuTypeahead`, `createTypeaheadBuffer` | Roving focus và typeahead cho menu. |
| `lockBodyScroll` | Khóa scroll body có đếm tham chiếu. |
| `runOverlayAnimation`, `createFadeKeyframes`, `createExpandKeyframes`, `normalizeAnimationConfig` | Bộ chạy animation vào/ra cùng helper. |
| `listen`, `isEscapeKey`, `isOutsidePress`, `isPointerOutside`, `isPrimaryPointer`, `isBrowser` | Helper cho sự kiện và môi trường. |
| `isSamePositionerResult` | So sánh kết quả positioner để bỏ qua cập nhật thừa. |

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
| `reference` | `ReferenceElement \| null` | — | Phần tử neo hoặc ảo `{ getBoundingClientRect }`. |
| `floating` | `HTMLElement \| null` | — | Phần tử cần đặt. |
| `placement` | `Placement` | `"bottom"` | Cạnh cùng `-start` hoặc `-end` tùy chọn. |
| `offset` | `number` | `0` | Khoảng cách trục chính (px). |
| `alignOffset` | `number` | `0` | Độ lệch trục phụ (px). |
| `flip` | `boolean` | `true` | Lật sang phía đối diện khi tràn. |
| `shift` | `boolean` | `true` | Dịch theo trục phụ để luôn hiển thị. |
| `padding` | `number` | `0` | Khoảng cách tới biên. |
| `boundary` | `Element \| "clippingAncestors" \| "viewport"` | `"clippingAncestors"` | Biên va chạm. |
| `strategy` | `"absolute" \| "fixed"` | automatic | Tự động: `absolute`, hoặc `fixed` cho neo fixed/sticky. |
| `autoUpdate` | `boolean` | `true` | Đặt lại vị trí khi scroll, resize và đổi layout. |
| `arrow` | `{ element, padding? } \| null` | `null` | Đo phần tử mũi tên và báo độ lệch của nó. |
| `...` | — | — | Positioner chỉ nhận các option này và không bao giờ đụng tới focus, ARIA hay `hidden`. |

`update()` trả `null` khi thiếu phần tử, phần tử đã tách khỏi DOM, hoặc có lần update mới hơn thay thế. Subscriber chỉ nhận lần đo mới nhất.

### Controller options

`createOverlayController({ kind, ... })` nhận `kind` (`"popover" | "tooltip" | "dialog" | "context-menu"`) cùng các option bên dưới.

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

Controller đặt `role`, `aria-expanded`, `aria-controls`, `aria-haspopup`, `hidden` và `data-state` theo loại đã chọn. Escape và nhấn bên ngoài chỉ tới layer trên cùng.

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

### Animation configuration

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

## Lifecycle

- Chỉ tạo positioner và controller trong trình duyệt, sau khi phần tử đã tồn tại.
- Gọi `update()` hoặc `setOptions()` khi đã mount; cả hai đều an toàn khi lặp lại.
- Gọi `dispose()` hoặc `destroy()` khi gỡ bỏ. Cả hai đều idempotent nên gọi hai lần hoặc init lần hai không gây gì.
- Import package an toàn khi SSR; `createOverlayController` ném lỗi khi không có DOM.

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

## License

MIT © Zealakit
