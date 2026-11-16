<script lang="ts">
import { getOverlayContext } from "./context.js";
import type { PartProps } from "./types.js";

let {
  as,
  disabled = false,
  closeOnSelect = true,
  onselect,
  onclick,
  children,
  ...rest
}: PartProps & {
  disabled?: boolean;
  closeOnSelect?: boolean;
  /** Called when the item is activated by click or keyboard. */
  onselect?: (event: MouseEvent) => void;
} = $props();

const context = getOverlayContext("ContextMenuItem");

function handleClick(event: MouseEvent & { currentTarget: HTMLElement }): void {
  (onclick as ((event: MouseEvent) => void) | null | undefined)?.(event);
  if (disabled) {
    event.preventDefault();
    return;
  }
  onselect?.(event);
}
</script>

<svelte:element
  this={as ?? "div"}
  role="menuitem"
  tabindex="-1"
  aria-disabled={disabled ? "true" : undefined}
  data-disabled={disabled ? "" : undefined}
  data-keep-open={closeOnSelect ? undefined : ""}
  {...rest}
  onclick={handleClick}
>
  {@render children?.({ open: context.isOpen })}
</svelte:element>
