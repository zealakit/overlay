# @zealakit/overlay-react

[English](https://github.com/zealakit/overlay/blob/main/packages/react/README.md) | [Tiếng Việt](https://github.com/zealakit/overlay/blob/main/packages/react/README_VI.md) | [中文](https://github.com/zealakit/overlay/blob/main/packages/react/README_CN.md)

![Zealakit Overlay cover](https://github.com/zealakit/overlay/blob/main/assets/images/overlay-cover.jpg?raw=true)

Popover, Tooltip, Dialog và ContextMenu headless cho React. Cung cấp compound component, định vị, đóng theo lớp, quản lý focus và các hook cấp thấp. Bạn tự quyết định kiểu dáng.

Hãy style các phần qua `className`, `style` và các hook `data-*` bên dưới. Content đã đóng bị unmount (hoặc giữ lại với `keepMounted`), nên animation thoát cần prop `animation` để kết thúc gọn gàng.

> **Note**
> Overlay là bộ primitive headless tập trung cho Popover, Tooltip, Dialog và ContextMenu. Không kèm CSS và không render markup có kiểu dáng, nên mọi quyết định visual đều thuộc về bạn. Select, Combobox, DatePicker, DropdownMenu, Menubar và command palette chưa được triển khai.
>
> Overlay không phải là bản thay thế cho một UI library hay design system đầy đủ. Hãy dùng khi bạn cần các primitive overlay có accessibility mà không phải kéo theo một bộ UI lớn, hoặc khi overlay trong thư viện hiện tại khó restyle.

## Install

```bash
npm install @zealakit/overlay-react

# or yarn, pnpm, ...
```

Peer dependency: `react` và `react-dom` `^18.0.0 || ^19.0.0`; ứng dụng React đã cung cấp sẵn. Chỉ ESM. Các entry có `"use client"` cho Next.js App Router. Kernel nội bộ `@zealakit/overlay-core` đã được đóng gói sẵn trong package này và không có trên npm; không cần cài thêm gì.

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
| `open` | `boolean` | — | Hiển thị được điều khiển. |
| `defaultOpen` | `boolean` | `false` | Hiển thị ban đầu khi không điều khiển. |
| `onOpenChange` | `(open: boolean, reason) => void` | — | `reason` là `trigger`, `outside-press`, `escape`, `close-button` hoặc `programmatic`. |
| `dismissOnEscape` | `boolean` | `true` | Đóng khi nhấn Escape. |
| `dismissOnOutsidePress` | `boolean` | `true` | Đóng khi nhấn chính bên ngoài. |
| `dir` | `"ltr" \| "rtl"` | `"ltr"` | Hướng cho căn start/end. |
| `parentLayer` | `LayerStackHandle \| null` | — | Layer cha khi lồng trong layer tùy biến. |
| `children` | `ReactNode` | — | `Popover` không render phần tử nào nên không chuyển tiếp prop khác. |

Root giữ state và các id được sinh. Popover lồng nhau thừa kế layer cha nên Escape đóng con trước.

### `PopoverTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `asChild` | `boolean` | `false` | Gộp hành vi trigger vào phần tử con duy nhất thay vì bọc nó. |
| `...button props` | `ComponentPropsWithoutRef<"button">` | — | Chuyển tiếp tới `button` gốc. Đặt `aria-expanded` và, khi mở, `aria-controls`. |

`onClick` của bạn chạy trước; gọi `event.preventDefault()` sẽ chặn việc bật/tắt. Trigger bị disabled sẽ không mở.

### `PopoverContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `anchor` | `Element \| null` | trigger | Phần tử tham chiếu tường minh. |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"bottom"` | Cạnh vật lý của neo. |
| `align` | `"start" \| "center" \| "end"` | `"center"` | Theo `dir` với cạnh top và bottom. |
| `sideOffset` | `number` | `0` | Khoảng cách trục chính (px). |
| `alignOffset` | `number` | `0` | Độ lệch trục phụ (px). |
| `collisionBoundary` | `Element \| "clippingAncestors" \| "viewport"` | `"clippingAncestors"` | Biên va chạm. |
| `collisionPadding` | `number` | `0` | Khoảng cách tới biên. |
| `collisionAvoidance` | `{ flip?: boolean; shift?: boolean }` | `{ flip: true, shift: true }` | Bật/tắt flip và shift độc lập. |
| `positionMethod` | `"absolute" \| "fixed"` | automatic | Tự động: `absolute`, hoặc `fixed` cho neo fixed/sticky. |
| `arrow` | `boolean` | `false` | Render phần mũi tên mặc định. |
| `arrowSize` | `number` | `8` | Độ dài cạnh mũi tên (px). |
| `arrowPadding` | `number` | `0` | Khoảng cách giữa mũi tên và mép popup. |
| `arrowClassName` / `arrowStyle` | `string` / `CSSProperties` | — | Class và style inline cho mũi tên mặc định. |
| `initialFocus` | `boolean` | `false` | Focus phần tử focus được đầu tiên khi mở. |
| `trapFocus` | `boolean` | `false` | Giữ focus trong khi layer này ở trên cùng. |
| `restoreFocus` | `boolean` | `true` | Trả focus về trigger khi đóng từ bên trong. |
| `animation` | `boolean \| AnimationConfig` | — | Tắt trừ khi truyền `true` hoặc config. |
| `portal` | `boolean \| Element \| null` | `true` | `true` portal vào `document.body`, một element chọn container, `false` render tại chỗ. |
| `...div props` | `HTMLAttributes<HTMLDivElement>` | — | Chuyển tiếp tới `div` popup; prop định vị được tiêu thụ và không tới DOM. |

Mặc định không thêm `role`, `aria-modal` hay focus trap; hãy chọn role phù hợp với nội dung. `PopoverTitle` và `PopoverDescription` nối `aria-labelledby` và `aria-describedby`. `PopoverPortal`, `PopoverPositioner` và `PopoverPopup` được export cho cách ghép nâng cao.

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

### `asChild`

```tsx
<PopoverTrigger asChild>
  <MyButton>Edit profile</MyButton>
</PopoverTrigger>
```

`asChild` nhân bản đúng một phần tử con và giữ ref cùng handler của bạn. Component tùy biến phải forward ref để popup định vị theo chúng.

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
| `delay` | `number` | `500` | Độ trễ mở khi hover (ms). |
| `closeDelay` | `number` | `100` | Độ trễ trước khi đóng sau khi con trỏ hoặc focus rời đi. |
| `skipDelayDuration` | `number` | `300` | Khoảng thời gian sau khi mở mà Tooltip kế tiếp mở ngay. |
| `disableHoverableContent` | `boolean` | `false` | Đóng khi rời trigger dù con trỏ vào content. |
| `children` | `ReactNode` | — | Provider không render phần tử. Nó là tùy chọn; Tooltip không có provider dùng mặc định. |

### `Tooltip` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Hiển thị được điều khiển. |
| `defaultOpen` | `boolean` | `false` | Hiển thị ban đầu khi không điều khiển. |
| `onOpenChange` | `(open: boolean, reason) => void` | — | `reason` là `hover`, `focus`, `escape`, `outside-press`, `trigger` hoặc `programmatic`. |
| `disabled` | `boolean` | `false` | Không bao giờ mở. |
| `delay` / `closeDelay` / `disableHoverableContent` | — | giá trị provider | Ghi đè provider cho Tooltip này. |
| `dir` | `"ltr" \| "rtl"` | `"ltr"` | Hướng cho căn start/end. |
| `children` | `ReactNode` | — | `Tooltip` không render phần tử nào nên không chuyển tiếp prop khác. |

Hover mở sau `delay`, focus mở ngay, còn Escape hoặc nhấn bên ngoài sẽ đóng. Hover bằng cảm ứng bị bỏ qua. Tooltip không đăng ký layer nên không chặn Popover hay Dialog cha.

### `TooltipTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `asChild` | `boolean` | `false` | Gộp hành vi trigger vào phần tử con duy nhất. |
| `...button props` | `ComponentPropsWithoutRef<"button">` | — | Chuyển tiếp tới `button` gốc. Khi mở có `aria-describedby`; bấm sẽ đóng nhưng không bao giờ mở. |

### `TooltipContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `anchor` | `Element \| null` | trigger | Phần tử tham chiếu tường minh. |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"bottom"` | Cạnh vật lý của neo. |
| `align` | `"start" \| "center" \| "end"` | `"center"` | Theo `dir` với cạnh top và bottom. |
| `sideOffset` | `number` | `0` | Khoảng cách trục chính (px). |
| `alignOffset` | `number` | `0` | Độ lệch trục phụ (px). |
| `collisionBoundary` | `Element \| "clippingAncestors" \| "viewport"` | `"clippingAncestors"` | Biên va chạm. |
| `collisionPadding` | `number` | `0` | Khoảng cách tới biên. |
| `collisionAvoidance` | `{ flip?: boolean; shift?: boolean }` | `{ flip: true, shift: true }` | Bật/tắt flip và shift độc lập. |
| `positionMethod` | `"absolute" \| "fixed"` | automatic | Tự động: `absolute`, hoặc `fixed` cho neo fixed/sticky. |
| `arrow` | `boolean` | `false` | Render phần mũi tên mặc định. |
| `arrowSize` | `number` | `8` | Độ dài cạnh mũi tên (px). |
| `arrowPadding` | `number` | `0` | Khoảng cách giữa mũi tên và mép popup. |
| `arrowClassName` / `arrowStyle` | `string` / `CSSProperties` | — | Class và style inline cho mũi tên mặc định. |
| `animation` | `boolean \| AnimationConfig` | — | Tắt trừ khi truyền `true` hoặc config. |
| `portal` | `boolean \| Element \| null` | `true` | `true` portal vào `document.body`, một element chọn container, `false` render tại chỗ. |
| `...div props` | `HTMLAttributes<HTMLDivElement>` | — | Chuyển tiếp tới `div` popup có `role="tooltip"`. Popup không focus được. |

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

Các option giống [Popover](https://github.com/zealakit/overlay/blob/main/packages/react/README_VI.md#arrow-and-animation-configuration).

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

Button disabled gốc không nhận được focus, nên hãy bọc nó trong phần tử focus được. Dùng Popover khi nội dung có tương tác.

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
| `open` | `boolean` | — | Hiển thị được điều khiển. |
| `defaultOpen` | `boolean` | `false` | Hiển thị ban đầu khi không điều khiển. |
| `onOpenChange` | `(open: boolean, reason) => void` | — | `reason` là `trigger`, `outside-press`, `escape`, `close-button` hoặc `programmatic`. |
| `modal` | `boolean` | `true` | Modal: `aria-modal`, giữ focus, nền inert, khóa scroll. |
| `lockScroll` | `boolean` | `modal` | Khóa scroll tài liệu khi mở. |
| `dismissOnEscape` | `boolean` | `true` | Đóng khi nhấn Escape. |
| `dismissOnOutsidePress` | `boolean` | `true` | Đóng khi nhấn backdrop hoặc bên ngoài. |
| `dir` | `"ltr" \| "rtl"` | `"ltr"` | Hướng truyền cho popup. |
| `parentLayer` | `LayerStackHandle \| null` | — | Layer cha khi lồng trong layer tùy biến. |
| `children` | `ReactNode` | — | `Dialog` không render phần tử nào nên không chuyển tiếp prop khác. |

### `DialogTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `asChild` | `boolean` | `false` | Gộp hành vi trigger vào phần tử con duy nhất. |
| `...button props` | `ComponentPropsWithoutRef<"button">` | — | Chuyển tiếp tới `button` gốc. Đặt `aria-haspopup="dialog"`, `aria-expanded` và `aria-controls`. |

### `DialogContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `backdrop` | `boolean` | `modal` | Render backdrop cấu trúc. |
| `initialFocus` | `"container" \| "first" \| Element \| (() => Element \| null) \| null` | `"container"` khi modal | Nơi focus rơi vào khi mở; `null` giữ nguyên focus. |
| `finalFocus` | `Element \| (() => Element \| null) \| null` | — | Nơi focus quay về khi đóng; mặc định là trigger. |
| `restoreFocus` | `boolean` | `true` | Khôi phục focus khi đóng. |
| `keepMounted` | `boolean` | `false` | Giữ content đã đóng trong DOM dạng `hidden` cho transition của bạn. |
| `animation` | `boolean \| AnimationConfig` | — | Tắt trừ khi truyền `true` hoặc config. |
| `portal` | `boolean \| Element \| null` | `true` | `true` portal vào `document.body`, một element chọn container, `false` render tại chỗ. |
| `...div props` | `HTMLAttributes<HTMLDivElement>` | — | Chuyển tiếp tới `div` popup có `role="dialog"`. |

Hãy thêm `DialogTitle` hoặc `aria-label`; thiếu chúng dialog không có tên truy cập. `DialogHeader`, `DialogFooter` và `DialogClose` là helper bố cục và đóng; không có nút đóng nào được chèn. `DialogPortal`, `DialogBackdrop`, `DialogViewport` và `DialogPopup` được export cho cách ghép nâng cao.

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

Các option giống [Popover](https://github.com/zealakit/overlay/blob/main/packages/react/README_VI.md#arrow-and-animation-configuration). Dialog phóng từ tâm và backdrop chỉ mờ dần.

### `keepMounted`

Content đã đóng mặc định bị unmount. Với `keepMounted` nó giữ lại dạng `hidden` cùng `data-state="closed"`. Giữ focus và khóa scroll được nhả ngay khi dialog đóng nên transition thoát không làm trang bị modal.

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
| `open` | `boolean` | — | Hiển thị được điều khiển. |
| `defaultOpen` | `boolean` | `false` | Hiển thị ban đầu khi không điều khiển. |
| `onOpenChange` | `(open: boolean, reason) => void` | — | `reason` là `trigger`, `outside-press`, `escape`, `select` hoặc `programmatic`. |
| `disabled` | `boolean` | `false` | Để nguyên menu gốc của trình duyệt. |
| `dir` | `"ltr" \| "rtl"` | `"ltr"` | Hướng; đảo cạnh submenu và phím mũi tên. |
| `parentLayer` | `LayerStackHandle \| null` | — | Layer cha khi lồng trong layer tùy biến. |
| `children` | `ReactNode` | — | `ContextMenu` không render phần tử nào nên không chuyển tiếp prop khác. |

### `ContextMenuTrigger` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `asChild` | `boolean` | `false` | Dùng một phần tử có sẵn làm mục tiêu. |
| `disabled` | `boolean` | `false` | Bỏ qua việc kích hoạt. |
| `...div props` | `ComponentPropsWithoutRef<"div">` | — | Chuyển tiếp tới một `div` focus được. Chuột phải, phím Context Menu và Shift+F10 mở menu. |

Kích hoạt bằng chuột neo tại con trỏ; bằng bàn phím neo tại trigger. Hãy đặt role hoặc label phù hợp cho trigger.

### `ContextMenuContent` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"bottom"` | Cạnh vật lý của neo. |
| `align` | `"start" \| "center" \| "end"` | `"start"` | Theo `dir` với cạnh top và bottom. |
| `sideOffset` / `alignOffset` / `collisionPadding` | `number` | `0` | Độ lệch và khoảng cách biên (px). |
| `collisionBoundary` / `collisionAvoidance` / `positionMethod` | — | — | Giống Popover. |
| `animation` | `boolean \| AnimationConfig` | — | Tắt trừ khi truyền `true` hoặc config. |
| `portal` | `boolean \| Element \| null` | `true` | `true` portal vào `document.body`, một element chọn container, `false` render tại chỗ. |
| `...div props` | `HTMLAttributes<HTMLDivElement>` | — | Chuyển tiếp tới `div` popup có `role="menu"`. Phím mũi tên, Home, End và typeahead di chuyển focus; menu không giữ focus. |

### `ContextMenuItem` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `disabled` | `boolean` | `false` | Bị bỏ qua khi điều hướng bàn phím và không bao giờ kích hoạt. |
| `onSelect` | `(event) => void` | — | Nhận một event có `preventDefault()` và `originalEvent`. |
| `closeOnSelect` | `boolean` | `true` | Đặt `false` hoặc gọi `event.preventDefault()` để giữ menu mở. |
| `asChild` | `boolean` | `false` | Dùng phần tử của bạn làm item. |
| `...div props` | `ComponentPropsWithoutRef<"div">` | — | Chuyển tiếp tới `div` item có `role="menuitem"`. |

### `ContextMenuCheckboxItem` / `ContextMenuRadioGroup` / `ContextMenuRadioItem` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `checked` / `defaultChecked` | `boolean` | — | State của checkbox item, điều khiển hoặc không. |
| `onCheckedChange` | `(checked: boolean) => void` | — | Gọi khi checkbox item đổi trạng thái. |
| `value` / `defaultValue` | `string` | — | Giá trị đã chọn của `RadioGroup`; `RadioItem` yêu cầu `value`. |
| `onValueChange` | `(value: string) => void` | — | Gọi khi lựa chọn radio đổi. |
| `closeOnSelect` | `boolean` | `false` | Checkbox và radio item mặc định giữ menu mở. |
| `...div props` | `ComponentPropsWithoutRef<"div">` | — | Chuyển tiếp cùng `role="menuitemcheckbox"` hoặc `role="menuitemradio"` và `aria-checked`. |

`ContextMenuGroup`, `ContextMenuLabel`, `ContextMenuSeparator` và `ContextMenuShortcut` là phần cấu trúc. Submenu dùng `ContextMenuSub` (`defaultOpen`, không điều khiển), `ContextMenuSubTrigger` và `ContextMenuSubContent`, nhận cùng prop định vị với `ContextMenuContent` và mở sang phải khi LTR, sang trái khi RTL.

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

Các option giống [Popover](https://github.com/zealakit/overlay/blob/main/packages/react/README_VI.md#arrow-and-animation-configuration). ContextMenu không có mũi tên.

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

Chọn một item sẽ đóng cả cây menu. Escape và nhấn bên ngoài chỉ đóng submenu trên cùng trước.

## Hooks

| Export | Purpose |
| --- | --- |
| `usePositioner(options)` | Callback ref cùng `PositionerResult` mới nhất; nhận option positioner của core và `reference` tường minh. |
| `useLayer(options)` | Đăng ký layer khi đã mount: `element`, `reference`, `parent`, `boundaries`, `dismissOnEscape`, `dismissOnOutsidePress`, `onDismiss`. |
| `useOverlay(options)` | State mở không điều khiển ghép từ hai hook trên; trả `isOpen`, `open`, `close`, `toggle`, ref và `floatingStyles`. |
| `useEscapeKey(handler, options?)` | Listener Escape với `enabled` và `target`. |
| `Portal` | Render children vào `document.body` hoặc container sau khi mount; render `null` trên server. |

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

Hook tạo đối tượng core trong effect, không bao giờ trong lúc render, và an toàn với Strict Mode. Các helper focus của core (`createFocusContainment`, `focusElement`, `focusFirst`, `getFocusableElements`, `isFocusable`, `getActiveElement`, `restoreFocus`) được re-export.

## Styling hooks

| Attribute | Where | Purpose |
| --- | --- | --- |
| `data-state` | Popup, trigger | `"open"` hoặc `"closed"`; `"closed"` quan sát được với `keepMounted` hoặc `animation`. |
| `data-open` / `data-closed` | Popup | Cờ có/không cho CSS selector. |
| `data-side` / `data-align` | Popup, mũi tên | Placement sau khi flip và shift. |
| `data-animating` | Popup | `"enter"` hoặc `"exit"` khi animation đang chạy. |
| `data-modal` / `data-non-modal` / `data-nested` / `data-nested-dialog-open` | Popup Dialog | Chế độ và trạng thái lồng nhau. |
| `data-disabled` | Menu item | Đặt trên item bị disabled. |
| `--popover-anchor-width` / `--popover-anchor-height` | Popup Popover | Kích thước trigger, để khớp chiều rộng. |
| `--tooltip-anchor-width` / `--tooltip-anchor-height` | Popup Tooltip | Kích thước trigger. |
| `--overlay-transform-origin` | Popup | Gốc theo cạnh neo cho animation dùng class. |
| `--overlay-arrow-*` | Panel hoặc phần tử cha | Màu nền, độ dày và màu viền của mũi tên. |

## Next.js App Router

Mọi entry đều có `"use client"`, nên hãy import component từ client component. Import an toàn trên server, và nội dung overlay chỉ render sau khi mount.

```tsx
"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@zealakit/overlay-react";
```

## Agent Skill

Thêm [Overlay React skill](https://github.com/zealakit/overlay/blob/main/skills/overlay-react.md) vào thư mục skills của agent để nó tuân theo quy tắc component, styling và accessibility của package này.

## License

MIT © Zealakit
