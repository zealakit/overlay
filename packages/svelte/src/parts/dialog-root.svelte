<script lang="ts">
import OverlayRoot from "./overlay-root.svelte";
import type { DialogProps } from "./types.js";

let { open = $bindable(), ...rest }: DialogProps = $props();
</script>

<OverlayRoot kind="dialog" bind:open {...rest} />
