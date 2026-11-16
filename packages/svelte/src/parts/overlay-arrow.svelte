<script lang="ts">
import { getOverlayContext } from "./context.js";
import { register } from "./register.js";
import type { PartProps } from "./types.js";

let { as, children, ...rest }: PartProps = $props();

const context = getOverlayContext("Arrow");
</script>

<svelte:element
  this={as ?? "div"}
  use:register={context.setArrow}
  aria-hidden="true"
  {...rest}
>
  {@render children?.({ open: context.isOpen })}
</svelte:element>
