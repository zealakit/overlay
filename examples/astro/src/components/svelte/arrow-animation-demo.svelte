<script lang="ts">
import ExampleCard from "./example-card.svelte";
import Overlay from "./overlay.svelte";

let arrow = $state(true);
let animate = $state(true);
let kind = $state<"fade" | "expand" | "custom">("fade");
let direction = $state<"auto" | "up" | "down" | "left" | "right">("auto");
let easing = $state<"ease-in-out" | "linear">("ease-in-out");
let duration = $state(200);

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

const animation = $derived(
  animate
    ? {
        type: kind,
        direction,
        easing,
        duration,
        ...(kind === "custom" ? { custom } : {}),
      }
    : false,
);
</script>

<ExampleCard
  title="Arrow and animation"
  description="Both are opt-in. Toggle them and change the type, direction or timing. For expand, direction is the growth direction."
>
  <div class="aa-controls">
    <label><input type="checkbox" bind:checked={arrow} /> Arrow</label>
    <label><input type="checkbox" bind:checked={animate} /> Animation</label>
    <label>
      Type
      <select bind:value={kind}>
        <option>fade</option><option>expand</option><option>custom</option>
      </select>
    </label>
    <label>
      Direction
      <select bind:value={direction}>
        <option>auto</option><option>up</option><option>down</option>
        <option>left</option><option>right</option>
      </select>
    </label>
    <label>
      Easing
      <select bind:value={easing}>
        <option>ease-in-out</option><option>linear</option>
      </select>
    </label>
    <label>
      Duration {duration}ms
      <input type="range" min="0" max="800" step="20" bind:value={duration} />
    </label>
  </div>
  <div class="example-body">
    <Overlay
      kind="popover"
      side="bottom"
      offset={14}
      {arrow}
      arrowSize={14}
      {animation}
      contentClass="aa-panel"
    >
      {#snippet trigger()}
        <button type="button" class="example-trigger">Popover</button>
      {/snippet}
      Arrow follows the panel. Close it to see the exit run in reverse.
    </Overlay>
    <Overlay
      kind="tooltip"
      side="top"
      offset={12}
      {arrow}
      arrowSize={11}
      {animation}
      contentClass="aa-panel"
    >
      {#snippet trigger()}
        <button type="button" class="example-trigger">Tooltip</button>
      {/snippet}
      Tooltip
    </Overlay>
  </div>
</ExampleCard>
