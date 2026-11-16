<script lang="ts">
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@zealakit/overlay-svelte/components";
import ExampleCard from "./example-card.svelte";

let open = $state(false);
let saved = $state(false);
</script>

<div class="example-grid">
  <ExampleCard
    title="A. Basic"
    description="A modal Dialog: focus is contained, the page behind is inert, and scrolling is locked."
  >
    <Dialog>
      <DialogTrigger class="example-trigger">Open basic dialog</DialogTrigger>
      <DialogBackdrop>
        <div data-dialog-backdrop></div>
        <div data-dialog-viewport>
          <DialogContent class="dialog-popup">
            <DialogHeader class="dialog-header">
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>Update your profile information.</DialogDescription>
            </DialogHeader>
            <DialogFooter class="dialog-footer">
              <DialogClose class="example-trigger">Cancel</DialogClose>
              <DialogClose class="example-trigger">Save</DialogClose>
            </DialogFooter>
          </DialogContent>
        </div>
      </DialogBackdrop>
    </Dialog>
  </ExampleCard>

  <ExampleCard
    title="B. Controlled"
    description="bind:open owns visibility, so the parent can open and close it."
  >
    <Dialog bind:open onOpenChange={() => (saved = false)}>
      <DialogTrigger class="example-trigger">Open controlled dialog</DialogTrigger>
      <DialogBackdrop>
        <div data-dialog-backdrop></div>
        <div data-dialog-viewport>
          <DialogContent class="dialog-popup">
            <DialogHeader class="dialog-header">
              <DialogTitle>Controlled dialog</DialogTitle>
              <DialogDescription>Saving closes it from the parent.</DialogDescription>
            </DialogHeader>
            <DialogFooter class="dialog-footer">
              <button
                type="button"
                class="example-trigger"
                onclick={() => {
                  saved = true;
                  open = false;
                }}
              >
                Save
              </button>
            </DialogFooter>
          </DialogContent>
        </div>
      </DialogBackdrop>
    </Dialog>
    <p class="example-small">{saved ? "Saved." : "Not saved."}</p>
  </ExampleCard>

  <ExampleCard
    title="C. Non-modal"
    description="No backdrop, focus trap, inert page, or scroll lock. The page stays interactive."
  >
    <Dialog modal={false}>
      <DialogTrigger class="example-trigger">Open non-modal dialog</DialogTrigger>
      <DialogContent
        class="dialog-popup"
        style="position: fixed; right: 24px; bottom: 24px; z-index: 72"
      >
        <DialogHeader class="dialog-header">
          <DialogTitle>Non-modal</DialogTitle>
          <DialogDescription>You can still use the page.</DialogDescription>
        </DialogHeader>
        <DialogClose class="example-trigger">Close</DialogClose>
      </DialogContent>
    </Dialog>
  </ExampleCard>

  <ExampleCard title="D. Nested" description="Escape closes the topmost dialog first.">
    <Dialog>
      <DialogTrigger class="example-trigger">Open parent dialog</DialogTrigger>
      <DialogBackdrop>
        <div data-dialog-backdrop></div>
        <div data-dialog-viewport>
          <DialogContent class="dialog-popup">
            <DialogHeader class="dialog-header">
              <DialogTitle>Parent</DialogTitle>
            </DialogHeader>
            <Dialog>
              <DialogTrigger class="example-trigger">Open child dialog</DialogTrigger>
              <DialogBackdrop>
                <div data-dialog-backdrop></div>
                <div data-dialog-viewport>
                  <DialogContent class="dialog-popup">
                    <DialogTitle>Child</DialogTitle>
                    <DialogClose class="example-trigger">Close child</DialogClose>
                  </DialogContent>
                </div>
              </DialogBackdrop>
            </Dialog>
          </DialogContent>
        </div>
      </DialogBackdrop>
    </Dialog>
  </ExampleCard>
</div>
