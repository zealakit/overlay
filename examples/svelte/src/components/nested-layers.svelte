<script lang="ts">
import {
  type DismissReason,
  type LayerStackHandle,
  layer,
} from "@zealakit/overlay-svelte";

let parentHandle = $state<LayerStackHandle | null>(null);
let parentId = $state<string | null>(null);
let childId = $state<string | null>(null);
let parentTopmost = $state(false);
let childTopmost = $state(false);
let log = $state("Escape/outside routes to the topmost layer.");

const onParentDismiss = (reason: DismissReason): void => {
  log = `parent dismissed: ${reason}`;
};

const onChildDismiss = (reason: DismissReason): void => {
  log = `child dismissed: ${reason}`;
};
</script>

<div
  use:layer={{
    onDismiss: onParentDismiss,
    onRegistered: (handle) => {
      parentHandle = handle;
      parentId = handle?.id ?? null;
    },
    onTopmostChange: (isTopmost) => {
      parentTopmost = isTopmost;
    },
  }}
  class="panel nested-parent"
>
  <p>
    Parent layer <code>{parentId ?? "pending"}</code>
    {parentTopmost ? " · topmost" : ""}
  </p>

  {#if parentHandle}
    <div
      use:layer={{
        parent: parentHandle,
        onDismiss: onChildDismiss,
        onRegistered: (handle) => {
          childId = handle?.id ?? null;
        },
        onTopmostChange: (isTopmost) => {
          childTopmost = isTopmost;
        },
      }}
      class="panel nested-child"
    >
      <p>
        Child layer <code>{childId ?? "pending"}</code>
        {childTopmost ? " · topmost" : ""}
      </p>
    </div>
  {/if}
</div>

<p class="status">{log}</p>
