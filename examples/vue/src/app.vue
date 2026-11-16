<script setup lang="ts">
import { computed, ref } from "vue";
import { type Placement, usePositioner } from "@zealakit/overlay-vue";
import HighLevelDemo from "./components/high-level-demo.vue";
import NestedLayers from "./components/nested-layers.vue";
import OverlayDemo from "./components/overlay-demo.vue";

const placements: Placement[] = [
  "bottom-start",
  "bottom-end",
  "top-start",
  "right-start",
];

const placementIndex = ref(0);
const placement = computed<Placement>(
  () => placements[placementIndex.value] ?? "bottom-start",
);

const referenceA = ref<HTMLElement | null>(null);
const referenceB = ref<HTMLElement | null>(null);
const useSecondReference = ref(false);
const activeReference = computed<HTMLElement | null>(() =>
  useSecondReference.value ? referenceB.value : referenceA.value,
);

const floating = ref<HTMLElement | null>(null);
const { result, update } = usePositioner({
  reference: activeReference,
  floating,
  placement,
  offset: 8,
  padding: 8,
});

const nextPlacement = (): void => {
  placementIndex.value = (placementIndex.value + 1) % placements.length;
};

const swapReference = (): void => {
  useSecondReference.value = !useSecondReference.value;
};

const overlayMounted = ref(true);
</script>

<template>
  <main class="page">
    <h1>@zealakit/overlay-vue</h1>
    <p class="lede">
      Composition API utilities for positioning, layers, outside interaction,
      and Escape — no styles shipped by the library.
    </p>

    <section class="demo">
      <h2>1–3. Positioning, reactive options, dynamic references</h2>
      <p class="copy">
        <code>usePositioner()</code> accepts refs/getters. Placement is reactive,
        and the reference element can be swapped.
      </p>

      <div class="row">
        <button
          ref="referenceA"
          type="button"
          :data-active="!useSecondReference"
        >
          Reference A
        </button>
        <button
          ref="referenceB"
          type="button"
          :data-active="useSecondReference"
        >
          Reference B
        </button>
      </div>

      <div class="row">
        <button type="button" @click="nextPlacement">
          Placement: {{ placement }}
        </button>
        <button type="button" @click="swapReference">
          Use reference {{ useSecondReference ? "A" : "B" }}
        </button>
        <button type="button" @click="update()">Measure now</button>
      </div>

      <p class="status">
        {{
          result
            ? `x=${Math.round(result.x)} y=${Math.round(result.y)} · ${result.placement}`
            : "Waiting for measurement…"
        }}
      </p>

      <div ref="floating" class="panel floating-panel">
        <p>
          Floating content driven by <code>usePositioner()</code>. Resize the
          window or scroll to see automatic updates.
        </p>
      </div>
    </section>

    <HighLevelDemo />

    <section class="demo">
      <h2>4–8. Overlay, layers, outside, Escape, cleanup</h2>
      <p class="copy">
        <code>useOverlay()</code> composes positioning and a registered layer.
        Unmounting the demo disposes both.
      </p>

      <div class="row">
        <button type="button" @click="overlayMounted = !overlayMounted">
          {{ overlayMounted ? "Unmount demo" : "Mount demo" }}
        </button>
      </div>

      <div class="demo-body">
        <OverlayDemo v-if="overlayMounted" />
        <p v-else class="status">
          Unmounted. Positioner and layer cleaned up.
        </p>
      </div>
    </section>

    <section class="demo">
      <h2>Nested layers</h2>
      <p class="copy">
        Child layers register with a parent handle; only the topmost layer
        receives Escape and outside interactions.
      </p>
      <NestedLayers />
    </section>
  </main>
</template>
