<script lang="ts">
import { onMount } from "svelte";
import { getOverlayContext, nextId } from "./context.js";
import type { PartProps } from "./types.js";

let { as, id, children, ...rest }: PartProps = $props();

const context = getOverlayContext("Title");
let generated = $state<string | undefined>(undefined);
const resolvedId = $derived(id ?? generated);

onMount(() => {
  generated = nextId("overlay-title");
});

$effect(() => {
  context.setTitleId(resolvedId ?? null);
  return () => context.setTitleId(null);
});
</script>

<svelte:element this={as ?? "h2"} id={resolvedId} {...rest}>
  {@render children?.({ open: context.isOpen })}
</svelte:element>
