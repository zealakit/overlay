<script lang="ts">
import {
  Popover,
  PopoverArrow,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@zealakit/overlay-svelte";
import ExampleCard from "./example-card.svelte";

const SIDES = ["top", "right", "bottom", "left"] as const;
const ALIGNS = ["start", "center", "end"] as const;
let side = $state<(typeof SIDES)[number]>("bottom");
let align = $state<(typeof ALIGNS)[number]>("center");
const placement = $derived(`${side}-${align}` as const);

let open = $state(false);
let log = $state("Closed");
let message = $state("Nothing submitted yet.");
</script>

<div class="example-grid">
  <ExampleCard
    title="A. Basic"
    description="A button trigger, compact content, Escape, outside press, and an optional close control."
  >
    <Popover offset={8}>
      <PopoverTrigger class="example-trigger">Open basic</PopoverTrigger>
      <PopoverContent class="example-popover">
        <PopoverHeader>
          <PopoverTitle>Basic popover</PopoverTitle>
          <PopoverDescription>
            This is a non-modal popover. Focus stays on the trigger.
          </PopoverDescription>
        </PopoverHeader>
        <PopoverClose class="example-close">Close</PopoverClose>
      </PopoverContent>
    </Popover>
  </ExampleCard>

  <ExampleCard
    title="B. Placement"
    description="Change the placement while the popover is open. Outside dismissal is off so the controls stay usable."
  >
    <Popover {placement} offset={8} flip={false} shift={false} dismissOnOutsidePress={false}>
      <PopoverTrigger class="example-trigger">Open placement</PopoverTrigger>
      <PopoverContent class="example-popover">
        <strong>{placement}</strong>
      </PopoverContent>
    </Popover>
    <fieldset class="placement-picker">
      <legend class="visually-hidden">Placement</legend>
      {#each SIDES as s}
        {#each ALIGNS as a}
          <button
            type="button"
            data-active={s === side && a === align}
            onclick={() => {
              side = s;
              align = a;
            }}
          >
            {s}-{a}
          </button>
        {/each}
      {/each}
    </fieldset>
  </ExampleCard>

  <ExampleCard
    title="C. Form"
    description="Fields stay interactive. Typing and focus never dismiss the popover."
  >
    <Popover>
      <PopoverTrigger class="example-trigger">Open form</PopoverTrigger>
      <PopoverContent class="example-popover example-form-popover">
        <form
          onsubmit={(event) => {
            event.preventDefault();
            message = "Submitted. The popover stays open.";
          }}
        >
          <label class="field">Name <input name="name" value="Huy" /></label>
          <label class="check">
            <input type="checkbox" name="updates" checked /> Product updates
          </label>
          <div class="example-actions">
            <PopoverClose class="example-close">Cancel</PopoverClose>
            <button type="submit" class="example-trigger">Save</button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
    <p class="example-small">{message}</p>
  </ExampleCard>

  <ExampleCard
    title="D. Controlled"
    description="bind:open drives visibility; the reason arrives through onOpenChange."
  >
    <Popover
      bind:open
      onOpenChange={(next, reason) => (log = `${next ? "open" : "closed"} · ${reason}`)}
    >
      <PopoverTrigger class="example-trigger">Controlled</PopoverTrigger>
      <PopoverContent class="example-popover">Controlled content</PopoverContent>
    </Popover>
    <button type="button" class="example-trigger" onclick={() => (open = !open)}>
      Toggle from outside
    </button>
    <p class="example-small">{log}</p>
  </ExampleCard>

  <ExampleCard
    title="E. Nested"
    description="Escape closes the child first; pressing inside the child does not dismiss the parent."
  >
    <Popover>
      <PopoverTrigger class="example-trigger">Open parent</PopoverTrigger>
      <PopoverContent class="example-popover">
        Parent content
        <Popover portal={false}>
          <PopoverTrigger class="example-trigger">Open child</PopoverTrigger>
          <PopoverContent class="example-popover">Child content</PopoverContent>
        </Popover>
      </PopoverContent>
    </Popover>
  </ExampleCard>

  <ExampleCard title="F. Arrow and animation" description="Opt in with the arrow and animation props.">
    <Popover offset={12} arrow arrowSize={12} animation={{ type: "expand", duration: 200 }}>
      <PopoverTrigger class="example-trigger">Open animated</PopoverTrigger>
      <PopoverContent class="example-popover aa-panel">
        Grows out of the anchor edge.
        <PopoverArrow />
      </PopoverContent>
    </Popover>
  </ExampleCard>
</div>
