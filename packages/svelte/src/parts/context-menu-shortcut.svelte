<script lang="ts">
import type { PartProps } from "./types.js";
import OverlayBlock from "./overlay-block.svelte";

let { children, ...rest }: PartProps = $props();
</script>

<OverlayBlock as="span" aria-hidden="true" {...rest} {children} />
