<script lang="ts">
import { onMount } from "svelte";
import { getOverlayContext, nextId } from "./context.js";
import type { PartProps } from "./types.js";

let { as, id, children, ...rest }: PartProps = $props();

const context = getOverlayContext("Description");
let generated = $state<string | undefined>(undefined);
const resolvedId = $derived(id ?? generated);

onMount(() => {
  generated = nextId("overlay-description");
});

$effect(() => {
  context.setDescriptionId(resolvedId ?? null);
  return () => context.setDescriptionId(null);
});
</script>

<svelte:element this={as ?? "p"} id={resolvedId} {...rest}>
  {@render children?.({ open: context.isOpen })}
</svelte:element>
