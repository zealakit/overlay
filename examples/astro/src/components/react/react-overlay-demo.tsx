import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@zealakit/overlay-react";
import type { ReactNode } from "react";
import { ArrowAnimationExamplesContent } from "./arrow-animation-examples";

function ExampleCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="example-card">
      <h2>{title}</h2>
      <p className="example-description">{description}</p>
      <div className="example-body">{children}</div>
    </section>
  );
}

export default function ReactOverlayDemo() {
  return (
    <TooltipProvider delay={350} closeDelay={80} skipDelayDuration={500}>
      <div className="example-grid">
        <ArrowAnimationExamplesContent />

        <ExampleCard
          title="Popover"
          description="A native button trigger, compact content, Escape, outside press, and an optional close control."
        >
          <Popover>
            <PopoverTrigger className="example-trigger">
              Open basic
            </PopoverTrigger>
            <PopoverContent className="example-popover" sideOffset={8}>
              <PopoverHeader>
                <PopoverTitle>Basic popover</PopoverTitle>
                <PopoverDescription>
                  This is a non-modal popover. Focus stays on the trigger unless
                  you configure otherwise.
                </PopoverDescription>
              </PopoverHeader>
              <PopoverClose className="example-close">Close</PopoverClose>
            </PopoverContent>
          </Popover>
        </ExampleCard>

        <ExampleCard
          title="Tooltip"
          description="Hover or keyboard-focus the trigger. Tooltip content is informational and is not a focus destination."
        >
          <Tooltip>
            <TooltipTrigger className="example-trigger">
              Hover or focus
            </TooltipTrigger>
            <TooltipContent className="tooltip-surface">
              A concise, non-interactive hint.
            </TooltipContent>
          </Tooltip>
        </ExampleCard>

        <ExampleCard
          title="Dialog"
          description="A modal Dialog with a title, description, footer, and close control."
        >
          <Dialog>
            <DialogTrigger className="example-trigger">
              Open basic dialog
            </DialogTrigger>
            <DialogContent className="dialog-popup">
              <DialogHeader className="dialog-header">
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>
                  Update the information shown on your public profile.
                </DialogDescription>
              </DialogHeader>
              <p>Changes are saved when you choose Save.</p>
              <DialogFooter className="dialog-footer">
                <DialogClose className="example-trigger">Cancel</DialogClose>
                <button type="button" className="example-trigger">
                  Save
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ExampleCard>

        <ExampleCard
          title="ContextMenu"
          description="Right-click anywhere in the card. Selection closes the menu."
        >
          <ContextMenu>
            <ContextMenuTrigger className="context-menu-target">
              Right-click this card
            </ContextMenuTrigger>
            <ContextMenuContent className="context-menu-surface">
              <ContextMenuItem>Copy</ContextMenuItem>
              <ContextMenuItem>Cut</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem>Paste</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </ExampleCard>
      </div>
    </TooltipProvider>
  );
}
