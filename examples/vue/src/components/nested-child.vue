<script setup lang="ts">
import { ref } from "vue";
import {
  type DismissReason,
  type LayerStackHandle,
  useLayer,
} from "@zealakit/overlay-vue";

const props = defineProps<{
  parent: LayerStackHandle;
}>();
const emit = defineEmits<{
  dismiss: [reason: DismissReason];
}>();

const element = ref<HTMLElement | null>(null);
const layer = useLayer({
  element,
  parent: () => props.parent,
  onDismiss: (reason) => emit("dismiss", reason),
});

const childId = layer.id;
const childIsTopmost = layer.isTopmost;
</script>

<template>
  <div ref="element" class="panel nested-child">
    <p>
      Child layer <code>{{ childId ?? "pending" }}</code>
      <span v-if="childIsTopmost"> · topmost</span>
    </p>
  </div>
</template>
