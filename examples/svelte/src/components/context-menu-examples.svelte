<script lang="ts">
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@zealakit/overlay-svelte";
import ExampleCard from "./example-card.svelte";

let last = $state("Nothing selected.");
const pick = (name: string): void => {
  last = `Selected: ${name}`;
};
</script>

<div class="example-grid">
  <ExampleCard
    title="A. Basic"
    description="Right-click, press the Context Menu key, or Shift+F10 on the target."
  >
    <ContextMenu>
      <ContextMenuTrigger class="context-menu-target">Right-click here</ContextMenuTrigger>
      <ContextMenuContent class="context-menu-surface">
        <ContextMenuItem onselect={() => pick("Copy")}>Copy</ContextMenuItem>
        <ContextMenuItem onselect={() => pick("Paste")}>Paste</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled>Unavailable</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
    <p class="example-small">{last}</p>
  </ExampleCard>

  <ExampleCard
    title="B. Groups and shortcuts"
    description="Arrow keys, Home, End, and typeahead move focus. Keep-open items use closeOnSelect={false}."
  >
    <ContextMenu>
      <ContextMenuTrigger class="context-menu-card">Project card</ContextMenuTrigger>
      <ContextMenuContent class="context-menu-surface">
        <ContextMenuGroup>
          <ContextMenuLabel>Edit</ContextMenuLabel>
          <ContextMenuItem onselect={() => pick("Rename")}>
            Rename <ContextMenuShortcut>F2</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem closeOnSelect={false} onselect={() => pick("Pin")}>
            Pin (stays open)
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem class="context-menu-item--danger" onselect={() => pick("Delete")}>
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  </ExampleCard>
</div>
