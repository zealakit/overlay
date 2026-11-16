<script lang="ts">
import { getOverlayContext } from "./context.js";
import { register } from "./register.js";
import type { PartProps } from "./types.js";

let { as, children, ...rest }: PartProps = $props();

const context = getOverlayContext("Trigger");
const tag = $derived(
  as ?? (context.kind === "context-menu" ? "div" : "button"),
);
</script>

<svelte:element
  this={tag}
  use:register={context.setTrigger}
  type={tag === "button" ? "button" : undefined}
  tabindex={context.kind === "context-menu" ? 0 : undefined}
  {...rest}
>
  {@render children?.({ open: context.isOpen })}
</svelte:element>
