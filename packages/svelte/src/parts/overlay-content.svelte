<script lang="ts">
import { getOverlayContext } from "./context.js";
import { register } from "./register.js";
import type { PartProps } from "./types.js";

let { as, children, ...rest }: PartProps = $props();

const context = getOverlayContext("Content");
</script>

<!-- `hidden` is only the initial state; the controller owns it afterwards. -->
<svelte:element
  this={as ?? "div"}
  use:register={context.setContent}
  hidden
  aria-labelledby={context.titleId ?? undefined}
  aria-describedby={context.descriptionId ?? undefined}
  {...rest}
>
  {@render children?.({ open: context.isOpen })}
</svelte:element>
