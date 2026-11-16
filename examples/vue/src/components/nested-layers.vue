<script setup lang="ts">
import { ref } from "vue";
import { type DismissReason, useLayer } from "@zealakit/overlay-vue";
import NestedChild from "./nested-child.vue";

const parentElement = ref<HTMLElement | null>(null);
const log = ref("Escape/outside routes to the topmost layer.");

const parent = useLayer({
  element: parentElement,
  onDismiss: (reason) => {
    log.value = `parent dismissed: ${reason}`;
  },
});

const parentId = parent.id;
const parentIsTopmost = parent.isTopmost;
const parentHandle = parent.handle;

const onChildDismiss = (reason: DismissReason): void => {
  log.value = `child dismissed: ${reason}`;
};
</script>

<template>
  <div ref="parentElement" class="panel nested-parent">
    <p>
      Parent layer <code>{{ parentId ?? "pending" }}</code>
      <span v-if="parentIsTopmost"> · topmost</span>
    </p>

    <NestedChild
      v-if="parentHandle"
      :parent="parentHandle"
      @dismiss="onChildDismiss"
    />
  </div>

  <p class="status">{{ log }}</p>
</template>
