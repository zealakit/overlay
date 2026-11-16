<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import ArrowAnimationDemo from "./components/arrow-animation-demo.vue";
import ContextMenuExamples from "./components/context-menu-examples.vue";
import DialogExamples from "./components/dialog-examples.vue";
import PlacementPlayground from "./components/placement-playground.vue";
import PopoverExamples from "./components/popover-examples.vue";
import TooltipExamples from "./components/tooltip-examples.vue";

const scrollToHash = (): void => {
  const id = window.location.hash.replace(/^#/, "");
  if (!id) return;
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  });
};
onMounted(() => {
  scrollToHash();
  window.addEventListener("hashchange", scrollToHash);
});
onBeforeUnmount(() => window.removeEventListener("hashchange", scrollToHash));
</script>

<template>
  <main class="page examples-page combined-examples">
    <header class="masthead">
      <p class="eyebrow">@zealakit/overlay-vue</p>
      <h1>Overlay examples</h1>
      <p class="lede">
        All Vue composable examples on one page. Use the section links to jump
        between the placement playground and each overlay family.
      </p>
      <nav class="examples-nav" aria-label="Example sections">
        <a href="#playground">Playground</a>
        <a href="#arrow-animation">Arrow &amp; animation</a>
        <a href="#popover">Popover</a>
        <a href="#tooltip">Tooltip</a>
        <a href="#dialog">Dialog</a>
        <a href="#context-menu">ContextMenu</a>
      </nav>
    </header>

    <section id="playground" class="examples-section">
      <h2 class="examples-section-title">Placement playground</h2>
      <PlacementPlayground />
    </section>
    <section id="arrow-animation" class="examples-section">
      <h2 class="examples-section-title">Arrow and animation</h2>
      <ArrowAnimationDemo />
    </section>
    <section id="popover" class="examples-section">
      <h2 class="examples-section-title">Popover examples</h2>
      <PopoverExamples />
    </section>
    <section id="tooltip" class="examples-section">
      <h2 class="examples-section-title">Tooltip examples</h2>
      <TooltipExamples />
    </section>
    <section id="dialog" class="examples-section">
      <h2 class="examples-section-title">Dialog examples</h2>
      <DialogExamples />
    </section>
    <section id="context-menu" class="examples-section">
      <h2 class="examples-section-title">ContextMenu examples</h2>
      <ContextMenuExamples />
    </section>
  </main>
</template>
