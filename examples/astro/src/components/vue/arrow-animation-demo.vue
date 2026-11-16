<script setup lang="ts">
import { computed, ref } from "vue";
import ExampleCard from "./example-card.vue";
import Overlay from "./overlay.vue";

type Kind = "fade" | "expand" | "custom";
type Direction = "auto" | "up" | "down" | "left" | "right";
type Easing = "ease-in-out" | "linear";

const arrow = ref(true);
const animate = ref(true);
const kind = ref<Kind>("fade");
const direction = ref<Direction>("auto");
const easing = ref<Easing>("ease-in-out");
const duration = ref(200);

// Custom animation: grow from the anchor with a small overshoot.
const custom = {
  enter: (context: { transformOrigin: string }) => [
    { opacity: 0, scale: "0.6", transformOrigin: context.transformOrigin },
    {
      opacity: 1,
      scale: "1.06",
      offset: 0.7,
      transformOrigin: context.transformOrigin,
    },
    { opacity: 1, scale: "1", transformOrigin: context.transformOrigin },
  ],
};

const animation = computed(() =>
  animate.value
    ? {
        type: kind.value,
        direction: direction.value,
        easing: easing.value,
        duration: duration.value,
        ...(kind.value === "custom" ? { custom } : {}),
      }
    : false,
);
</script>

<template>
  <ExampleCard
    title="Arrow and animation"
    description="Both are opt-in. Toggle them and change the type, direction or timing. For expand, direction is the growth direction."
  >
    <div class="aa-controls">
      <label><input v-model="arrow" type="checkbox" /> Arrow</label>
      <label><input v-model="animate" type="checkbox" /> Animation</label>
      <label>
        Type
        <select v-model="kind">
          <option>fade</option><option>expand</option><option>custom</option>
        </select>
      </label>
      <label>
        Direction
        <select v-model="direction">
          <option>auto</option><option>up</option><option>down</option>
          <option>left</option><option>right</option>
        </select>
      </label>
      <label>
        Easing
        <select v-model="easing">
          <option>ease-in-out</option><option>linear</option>
        </select>
      </label>
      <label>
        Duration {{ duration }}ms
        <input v-model.number="duration" type="range" min="0" max="800" step="20" />
      </label>
    </div>
    <div class="example-body">
      <Overlay
        kind="popover"
        side="bottom"
        :offset="14"
        :arrow="arrow"
        :arrow-size="14"
        :animation="animation"
        content-class="aa-panel"
      >
        <template #trigger>
          <button type="button" class="example-trigger">Popover</button>
        </template>
        Arrow follows the panel. Close it to see the exit run in reverse.
      </Overlay>
      <Overlay
        kind="tooltip"
        side="top"
        :offset="12"
        :arrow="arrow"
        :arrow-size="11"
        :animation="animation"
        content-class="aa-panel"
      >
        <template #trigger>
          <button type="button" class="example-trigger">Tooltip</button>
        </template>
        Tooltip
      </Overlay>
    </div>
  </ExampleCard>
</template>
