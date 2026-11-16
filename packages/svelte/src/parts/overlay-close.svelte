<script lang="ts">
import { getOverlayContext } from "./context.js";
import type { PartProps } from "./types.js";

let { as, onclick, children, ...rest }: PartProps = $props();

const context = getOverlayContext("Close");
const tag = $derived(as ?? "button");

function handleClick(event: MouseEvent & { currentTarget: HTMLElement }): void {
  (onclick as ((event: MouseEvent) => void) | null | undefined)?.(event);
  if (!event.defaultPrevented) {
    context.close("programmatic");
  }
}
</script>

<svelte:element
  this={tag}
  type={tag === "button" ? "button" : undefined}
  {...rest}
  onclick={handleClick}
>
  {@render children?.({ open: context.isOpen })}
</svelte:element>
