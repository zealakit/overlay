<script lang="ts">
import OverlayRoot from "./overlay-root.svelte";
import type { ContextMenuProps } from "./types.js";

let { open = $bindable(), ...rest }: ContextMenuProps = $props();
</script>

<OverlayRoot kind="context-menu" bind:open {...rest} />
