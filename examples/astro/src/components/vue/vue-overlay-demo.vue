<script setup lang="ts">
import ArrowAnimationDemo from "./arrow-animation-demo.vue";
import ExampleCard from "./example-card.vue";
import Overlay from "./overlay.vue";
</script>

<template>
  <div class="example-grid">
    <ArrowAnimationDemo />

    <ExampleCard
      title="Popover"
      description="A native button trigger, compact content, Escape, outside press, and an optional close control."
    >
      <Overlay kind="popover" :offset="8" content-class="example-popover">
        <template #trigger>
          <button type="button" class="example-trigger">Open basic</button>
        </template>
        <template #default="{ close }">
          <div>
            <h3>Basic popover</h3>
            <p>
              This is a non-modal popover. Focus stays on the trigger unless you
              configure otherwise.
            </p>
          </div>
          <button type="button" class="example-close" @click="close">Close</button>
        </template>
      </Overlay>
    </ExampleCard>

    <ExampleCard
      title="Tooltip"
      description="Hover or keyboard-focus the trigger. Tooltip content is informational and is not a focus destination."
    >
      <Overlay kind="tooltip" :delay="350" content-class="tooltip-surface">
        <template #trigger>
          <button type="button" class="example-trigger">Hover or focus</button>
        </template>
        A concise, non-interactive hint.
      </Overlay>
    </ExampleCard>

    <ExampleCard
      title="Dialog"
      description="A modal Dialog with a title, description, footer, and close control."
    >
      <Overlay kind="dialog" content-class="dialog-popup">
        <template #trigger>
          <button type="button" class="example-trigger">Open basic dialog</button>
        </template>
        <template #default="{ close }">
          <header class="dialog-header">
            <h2>Edit profile</h2>
            <p>Update the information shown on your public profile.</p>
          </header>
          <p>Changes are saved when you choose Save.</p>
          <footer class="dialog-footer">
            <button type="button" class="example-trigger" @click="close">Cancel</button>
            <button type="button" class="example-trigger">Save</button>
          </footer>
        </template>
      </Overlay>
    </ExampleCard>

    <ExampleCard
      title="ContextMenu"
      description="Right-click anywhere in the card. Selection closes the menu."
    >
      <Overlay kind="context-menu" content-class="context-menu-surface">
        <template #trigger>
          <div class="context-menu-target" tabindex="0">Right-click this card</div>
        </template>
        <div role="menuitem" tabindex="-1">Copy</div>
        <div role="menuitem" tabindex="-1">Cut</div>
        <div role="separator" data-context-menu-separator></div>
        <div role="menuitem" tabindex="-1">Paste</div>
      </Overlay>
    </ExampleCard>
  </div>
</template>
