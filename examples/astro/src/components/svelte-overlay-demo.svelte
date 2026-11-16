<script lang="ts">
import { overlay, portal } from "@zealakit/overlay-svelte";

let trigger = $state<HTMLButtonElement | null>(null);
let open = $state(false);

const close = (): void => {
  open = false;
};
</script>

<button
  bind:this={trigger}
  type="button"
  aria-controls="svelte-overlay-panel"
  aria-expanded={open}
  onclick={() => (open = !open)}
>
  Toggle Svelte overlay
</button>

<div
  id="svelte-overlay-panel"
  class="panel"
  role="dialog"
  aria-label="Svelte overlay demo"
  use:portal
  use:overlay={{
    reference: trigger,
    open,
    placement: "bottom-start",
    offset: 8,
    onDismiss: close,
  }}
  hidden={!open}
  data-state={open ? "open" : "closed"}
>
  <p>
    Svelte island — <code>use:overlay</code> and <code>use:portal</code> actions,
    hydrated by Astro.
  </p>
</div>
