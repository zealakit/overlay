<script lang="ts">
import OverlayRoot from "./overlay-root.svelte";
import type { PopoverProps } from "./types.js";

let { open = $bindable(), ...rest }: PopoverProps = $props();
</script>

<OverlayRoot kind="popover" bind:open {...rest} />
