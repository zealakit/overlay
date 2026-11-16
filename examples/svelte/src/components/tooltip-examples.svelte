<script lang="ts">
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from "@zealakit/overlay-svelte";
import ExampleCard from "./example-card.svelte";

const PLACEMENTS = ["top", "right", "bottom", "left"] as const;
</script>

<div class="example-grid">
  <ExampleCard
    title="A. Basic"
    description="Opens on hover and focus, closes on Escape or an outside press."
  >
    <Tooltip placement="top" offset={8}>
      <TooltipTrigger class="example-trigger">Save</TooltipTrigger>
      <TooltipContent class="tooltip-surface">Save changes</TooltipContent>
    </Tooltip>
  </ExampleCard>

  <ExampleCard
    title="B. Placement"
    description="Tooltips follow the same placement strings as every other overlay."
  >
    <div class="tooltip-grid">
      {#each PLACEMENTS as placement}
        <Tooltip {placement} offset={8}>
          <TooltipTrigger class="example-trigger">{placement}</TooltipTrigger>
          <TooltipContent class="tooltip-surface">{placement} tooltip</TooltipContent>
        </Tooltip>
      {/each}
    </div>
  </ExampleCard>

  <ExampleCard
    title="C. Icon button"
    description="The trigger keeps its own accessible name; the tooltip only supplements it."
  >
    <Tooltip delay={150} arrow arrowSize={8}>
      <TooltipTrigger class="icon-button" aria-label="More actions">⋯</TooltipTrigger>
      <TooltipContent class="tooltip-surface">
        More actions
        <TooltipArrow />
      </TooltipContent>
    </Tooltip>
  </ExampleCard>

  <ExampleCard
    title="D. Disabled control"
    description="A disabled button cannot take focus, so a focusable wrapper is the trigger."
  >
    <Tooltip>
      <TooltipTrigger as="span" class="tooltip-disabled-wrapper" tabindex={0}>
        <button type="button" class="example-trigger" disabled>Save</button>
      </TooltipTrigger>
      <TooltipContent class="tooltip-surface">Saving is unavailable.</TooltipContent>
    </Tooltip>
  </ExampleCard>
</div>
