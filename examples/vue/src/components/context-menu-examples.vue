<script setup lang="ts">
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@zealakit/overlay-vue";
import { ref } from "vue";
import ExampleCard from "./example-card.vue";

const last = ref("Nothing selected.");
const pick = (name: string): void => {
  last.value = `Selected: ${name}`;
};
</script>

<template>
  <div class="example-grid">
    <ExampleCard
      title="A. Basic"
      description="Right-click, press the Context Menu key, or Shift+F10 on the target."
    >
      <ContextMenu>
        <ContextMenuTrigger class="context-menu-target">
          Right-click here
        </ContextMenuTrigger>
        <ContextMenuContent class="context-menu-surface">
          <ContextMenuItem @select="pick('Copy')">Copy</ContextMenuItem>
          <ContextMenuItem @select="pick('Paste')">Paste</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem disabled>Unavailable</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <p class="example-small">{{ last }}</p>
    </ExampleCard>

    <ExampleCard
      title="B. Groups and shortcuts"
      description="Arrow keys, Home, End, and typeahead move focus. Keep-open items use :close-on-select=false."
    >
      <ContextMenu>
        <ContextMenuTrigger class="context-menu-card">Project card</ContextMenuTrigger>
        <ContextMenuContent class="context-menu-surface">
          <ContextMenuGroup>
            <ContextMenuLabel>Edit</ContextMenuLabel>
            <ContextMenuItem @select="pick('Rename')">
              Rename <ContextMenuShortcut>F2</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem :close-on-select="false" @select="pick('Pin')">
              Pin (stays open)
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuItem class="context-menu-item--danger" @select="pick('Delete')">
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </ExampleCard>
  </div>
</template>
