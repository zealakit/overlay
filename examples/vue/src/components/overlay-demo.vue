<script setup lang="ts">
import { useOverlay } from "@zealakit/overlay-vue";

const { isOpen, toggle, referenceRef, floatingRef, floatingStyles } =
  useOverlay({
    placement: "bottom-start",
    offset: 8,
    padding: 8,
  });
</script>

<template>
  <button
    ref="referenceRef"
    type="button"
    aria-controls="overlay-panel"
    :aria-expanded="isOpen"
    @click="toggle"
  >
    Toggle overlay
  </button>

  <Teleport to="body">
    <div
      v-if="isOpen"
      id="overlay-panel"
      ref="floatingRef"
      class="panel overlay-panel"
      role="dialog"
      aria-label="Overlay demo"
      :style="floatingStyles"
      :data-state="isOpen ? 'open' : 'closed'"
    >
      <p>
        Registered as a layer while open. Escape or an outside click closes it.
      </p>
    </div>
  </Teleport>
</template>
