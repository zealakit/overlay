<script setup lang="ts">
import {
  type Placement,
  useEscapeKey,
  usePositioner,
} from "@zealakit/overlay-vue";
import { type CSSProperties, computed, ref } from "vue";

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

const placement = ref<Placement>("bottom");
const open = ref(true);
const reference = ref<HTMLElement | null>(null);
const floating = ref<HTMLElement | null>(null);

const { result } = usePositioner({
  reference,
  floating,
  placement,
  offset: 10,
  padding: 12,
});

useEscapeKey(
  () => {
    open.value = false;
  },
  { enabled: open },
);

const rendered = computed(() => result.value?.placement ?? placement.value);
const floatingStyle = computed<CSSProperties>(() =>
  result.value
    ? {
        position: result.value.strategy,
        left: `${result.value.x}px`,
        top: `${result.value.y}px`,
      }
    : { position: "fixed", left: "0", top: "0", visibility: "hidden" },
);
</script>

<template>
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
        <code>{{ rendered }}</code>
      </p>
    </div>

    <div class="playground-grid">
      <fieldset
        v-for="rail in RAILS"
        :key="rail.side"
        :class="`placement-rail placement-rail-${rail.side}`"
      >
        <legend class="visually-hidden">{{ rail.label }} placements</legend>
        <button
          v-for="candidate in PLACEMENTS[rail.side]"
          :key="candidate"
          type="button"
          class="placement-button"
          :data-active="candidate === placement"
          :aria-pressed="candidate === placement"
          @click="placement = candidate"
        >
          {{ candidate }}
        </button>
      </fieldset>

      <div class="reference-stage">
        <button
          ref="reference"
          type="button"
          class="reference-button"
          :aria-expanded="open"
          aria-controls="placement-preview"
          @click="open = !open"
        >
          Reference element
        </button>
        <span class="reference-hint">{{ open ? "Click to close" : "Click to open" }}</span>
      </div>
    </div>

    <div
      v-if="open"
      id="placement-preview"
      ref="floating"
      class="floating-preview"
      :style="floatingStyle"
      :data-placement="rendered"
    >
      <span>Floating preview</span>
      <strong>{{ rendered }}</strong>
      <small v-if="rendered !== placement">requested {{ placement }}</small>
    </div>
  </section>
</template>
