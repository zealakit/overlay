<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";

let { ...rest }: HTMLAttributes<HTMLHRElement> = $props();
</script>

<hr {...rest} />
