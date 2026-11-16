<script lang="ts">
import OverlayRoot from "./overlay-root.svelte";
import type { TooltipProps } from "./types.js";

let { open = $bindable(), ...rest }: TooltipProps = $props();
</script>

<OverlayRoot kind="tooltip" bind:open {...rest} />
