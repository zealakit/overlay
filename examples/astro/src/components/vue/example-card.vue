<script setup lang="ts">
defineProps<{ title: string; description: string }>();
</script>

<template>
  <section class="example-card">
    <h2>{{ title }}</h2>
    <p class="example-description">{{ description }}</p>
    <div class="example-body"><slot /></div>
  </section>
</template>
