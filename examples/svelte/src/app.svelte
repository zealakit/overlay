<script lang="ts">
import {
  type DismissReason,
  type Placement,
  floating,
  layer,
  portal,
} from "@zealakit/overlay-svelte";
import HighLevelDemo from "./components/high-level-demo.svelte";
import NestedLayers from "./components/nested-layers.svelte";

const placements: Placement[] = [
  "bottom-start",
  "bottom-end",
  "top-start",
  "right-start",
];

let placement = $state<Placement>("bottom-start");
let useSecondReference = $state(false);
let referenceA = $state<HTMLButtonElement | null>(null);
let referenceB = $state<HTMLButtonElement | null>(null);
let activeReference = $derived(useSecondReference ? referenceB : referenceA);
let positionInfo = $state("Waiting for measurement…");

let layerOpen = $state(false);
let layerMounted = $state(true);
let layerReference = $state<HTMLButtonElement | null>(null);
let layerId = $state<string | null>(null);
let layerTopmost = $state(false);
let layerInfo = $state("Layer is not registered.");

const cyclePlacement = (): void => {
  const index = placements.indexOf(placement);
  placement = placements[(index + 1) % placements.length] ?? "bottom-start";
};

const onPosition = (result: { x: number; y: number }): void => {
  positionInfo = `x=${Math.round(result.x)} y=${Math.round(result.y)}`;
};

const closeLayer = (reason?: DismissReason): void => {
  layerOpen = false;
  layerInfo = reason ? `Dismissed: ${reason}` : "Closed.";
};

const toggleLayer = (): void => {
  layerMounted = true;
  layerOpen = !layerOpen;
  layerInfo = layerOpen ? "Layer open." : "Closed.";
};

const unmountLayer = (): void => {
  layerOpen = false;
  layerMounted = false;
  layerInfo = "Unmounted. Layer and listeners cleaned up.";
};
</script>

<main class="page">
  <h1>@zealakit/overlay-svelte</h1>
  <p class="lede">
    Actions for positioning, layers, outside interaction, and Escape — with no
    styles shipped by the library.
  </p>

  <section class="demo">
    <h2>1–3. Positioning, dynamic options, dynamic references</h2>
    <p class="copy">
      <code>use:floating</code> positions the panel. Placement and the reference
      element are reactive action parameters.
    </p>

    <div class="row">
      <button
        bind:this={referenceA}
        type="button"
        data-active={!useSecondReference}
      >
        Reference A
      </button>
      <button
        bind:this={referenceB}
        type="button"
        data-active={useSecondReference}
      >
        Reference B
      </button>
    </div>

    <div class="row">
      <button type="button" onclick={cyclePlacement}>
        Placement: {placement}
      </button>
      <button
        type="button"
        onclick={() => (useSecondReference = !useSecondReference)}
      >
        Use reference {useSecondReference ? "A" : "B"}
      </button>
    </div>

    <p class="status">{positionInfo} · {placement}</p>

    <div
      use:floating={{
        reference: activeReference,
        placement,
        offset: 8,
        padding: 8,
        onUpdate: onPosition,
      }}
      class="panel floating-panel"
    >
      <p>
        Floating content driven by <code>use:floating</code>. Resize the window
        or scroll to see automatic updates.
      </p>
    </div>
  </section>

  <HighLevelDemo />

  <section class="demo">
    <h2>4–8. Layers, outside interaction, Escape, cleanup</h2>
    <p class="copy">
      <code>use:layer</code> registers the panel in the shared stack. Escape and
      outside clicks close it; unmounting destroys the action.
    </p>

    <div class="row">
      <button
        bind:this={layerReference}
        type="button"
        aria-expanded={layerOpen}
        onclick={toggleLayer}
      >
        Toggle layer
      </button>
      <button type="button" onclick={unmountLayer}>Unmount panel</button>
    </div>

    {#if layerMounted}
      <div
        use:portal
        use:layer={{
          reference: layerReference,
          disabled: !layerOpen,
          onDismiss: closeLayer,
          onRegistered: (handle) => {
            layerId = handle?.id ?? null;
          },
          onTopmostChange: (isTopmost) => {
            layerTopmost = isTopmost;
          },
        }}
        class="panel layer-panel"
        hidden={!layerOpen}
        data-state={layerOpen ? "open" : "closed"}
      >
        <p>
          Layer <code>{layerId ?? "pending"}</code>
          {layerTopmost ? " · topmost" : ""}
        </p>
      </div>
    {:else}
      <p class="status">Unmounted. Layer and listeners cleaned up.</p>
    {/if}

    <p class="status">{layerInfo}</p>
  </section>

  <section class="demo">
    <h2>Nested layers</h2>
    <p class="copy">
      A child layer registers with the parent handle; only the topmost layer
      receives Escape and outside interactions.
    </p>
    <NestedLayers />
  </section>
</main>
