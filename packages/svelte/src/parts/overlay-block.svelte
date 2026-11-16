<script lang="ts">
import { getOverlayContext } from "./context.js";
import type { PartProps } from "./types.js";

let { as, children, ...rest }: PartProps = $props();

const context = getOverlayContext("Block");
</script>

<svelte:element this={as ?? "div"} {...rest}>
  {@render children?.({ open: context.isOpen })}
</svelte:element>
