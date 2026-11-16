<script lang="ts">
import {
  type Placement,
  type PositionerResult,
  floating,
} from "@zealakit/overlay-svelte";

const PLACEMENTS = {
  top: ["top-start", "top", "top-end"],
  right: ["right-start", "right", "right-end"],
  bottom: ["bottom-start", "bottom", "bottom-end"],
  left: ["left-start", "left", "left-end"],
} as const satisfies Record<string, readonly Placement[]>;

const RAILS = [
  { label: "Top", side: "top" },
  { label: "Left", side: "left" },
  { label: "Right", side: "right" },
  { label: "Bottom", side: "bottom" },
] as const;

let placement = $state<Placement>("bottom");
let open = $state(true);
let reference = $state<HTMLElement | null>(null);
let result = $state<PositionerResult | null>(null);

const rendered = $derived(result?.placement ?? placement);
</script>

<svelte:window
  onkeydown={(event) => {
    if (open && event.key === "Escape") open = false;
  }}
/>

<section class="playground" aria-labelledby="placement-playground-title">
  <div class="playground-heading">
    <div>
      <h2 id="placement-playground-title">Placement playground</h2>
      <p>
        Choose one of the twelve placements around the reference. The preview
        updates immediately.
      </p>
    </div>
    <p class="placement-indicator" aria-live="polite">
      Current placement
      <code>{rendered}</code>
    </p>
  </div>

  <div class="playground-grid">
    {#each RAILS as rail (rail.side)}
      <fieldset class={`placement-rail placement-rail-${rail.side}`}>
        <legend class="visually-hidden">{rail.label} placements</legend>
        {#each PLACEMENTS[rail.side] as candidate (candidate)}
          <button
            type="button"
            class="placement-button"
            data-active={candidate === placement}
            aria-pressed={candidate === placement}
            onclick={() => (placement = candidate)}
          >
            {candidate}
          </button>
        {/each}
      </fieldset>
    {/each}

    <div class="reference-stage">
      <button
        bind:this={reference}
        type="button"
        class="reference-button"
        aria-expanded={open}
        aria-controls="placement-preview"
        onclick={() => (open = !open)}
      >
        Reference element
      </button>
      <span class="reference-hint">{open ? "Click to close" : "Click to open"}</span>
    </div>
  </div>

  {#if open}
    <div
      id="placement-preview"
      class="floating-preview"
      data-placement={rendered}
      style="position: fixed; left: 0; top: 0; visibility: hidden"
      use:floating={{
        reference,
        placement,
        offset: 10,
        padding: 12,
        onUpdate: (next) => (result = next),
      }}
    >
      <span>Floating preview</span>
      <strong>{rendered}</strong>
      {#if rendered !== placement}<small>requested {placement}</small>{/if}
    </div>
  {/if}
</section>
