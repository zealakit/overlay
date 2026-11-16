<script setup lang="ts">
import { useOverlay } from "@zealakit/overlay-vue";

const { isOpen, toggle, referenceRef, floatingRef, floatingStyles } =
  useOverlay({
    placement: "bottom-start",
    offset: 8,
  });
</script>

<template>
  <button
    ref="referenceRef"
    type="button"
    aria-controls="vue-overlay-panel"
    :aria-expanded="isOpen"
    @click="toggle"
  >
    Toggle Vue overlay
  </button>

  <Teleport to="body">
    <div
      v-if="isOpen"
      id="vue-overlay-panel"
      ref="floatingRef"
      class="panel"
      role="dialog"
      aria-label="Vue overlay demo"
      :style="floatingStyles"
      :data-state="isOpen ? 'open' : 'closed'"
    >
      <p>
        Vue island — <code>useOverlay()</code> plus the native
        <code>Teleport</code> target, hydrated by Astro.
      </p>
    </div>
  </Teleport>
</template>
