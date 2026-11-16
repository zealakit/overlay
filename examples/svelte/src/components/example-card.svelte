<script lang="ts">
import type { Snippet } from "svelte";

let {
  title,
  description,
  children,
}: { title: string; description: string; children?: Snippet } = $props();
</script>

<section class="example-card">
  <h2>{title}</h2>
  <p class="example-description">{description}</p>
  <div class="example-body">{@render children?.()}</div>
</section>
