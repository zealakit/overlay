import {
  forwardRef,
  useState,
  type ButtonHTMLAttributes,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  DialogViewport,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@zealakit/overlay-react";

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

const CustomButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(function CustomButton(props, ref) {
  return <button {...props} ref={ref} type="button" />;
});

function BasicDialog() {
  return (
    <ExampleCard
      title="A. Basic"
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
  );
}

function FormDialog() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    window.setTimeout(() => {
      setSaving(false);
      setSaved(true);
    }, 700);
  };

  return (
    <ExampleCard
      title="B. Form"
      description="Focus enters the Dialog. Submitting does not close it; the consumer decides when completion is safe."
    >
      <Dialog>
        <DialogTrigger className="example-trigger">
          Open form dialog
        </DialogTrigger>
        <DialogContent className="dialog-popup">
          <DialogHeader className="dialog-header">
            <DialogTitle>Notification settings</DialogTitle>
            <DialogDescription>
              Choose how account notifications are delivered.
            </DialogDescription>
          </DialogHeader>
          <form className="dialog-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input type="email" defaultValue="ada@example.com" />
            </label>
            <label>
              Display name
              <input type="text" defaultValue="Ada Lovelace" />
            </label>
            <label className="dialog-check">
              <input type="checkbox" defaultChecked /> Product updates
            </label>
            <p role="status" className="dialog-status">
              {saving ? "Saving…" : saved ? "Saved successfully." : ""}
            </p>
            <DialogFooter className="dialog-footer">
              <DialogClose className="example-trigger">Cancel</DialogClose>
              <button
                type="submit"
                className="example-trigger"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ExampleCard>
  );
}

function ControlledDialog() {
  const [open, setOpen] = useState(false);
  return (
    <ExampleCard
      title="C. Controlled"
      description="Visibility is owned by React state. The trigger is outside the Dialog tree."
    >
      <div className="example-actions">
        <button
          type="button"
          className="example-trigger"
          onClick={() => setOpen(true)}
        >
          Open controlled
        </button>
        <span className="example-small">State: {open ? "open" : "closed"}</span>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="dialog-popup">
          <DialogHeader className="dialog-header">
            <DialogTitle>Controlled dialog</DialogTitle>
            <DialogDescription>
              External state controls visibility.
            </DialogDescription>
          </DialogHeader>
          <p>The parent can close this dialog from anywhere.</p>
          <DialogFooter className="dialog-footer">
            <DialogClose className="example-trigger">Close</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ExampleCard>
  );
}

function CustomTriggerDialog() {
  return (
    <ExampleCard
      title="D. Custom trigger"
      description="A consumer Button component and an icon-only trigger both provide their own accessible names."
    >
      <div className="example-actions">
        <Dialog>
          <DialogTrigger asChild>
            <CustomButton className="example-trigger">
              Custom trigger
            </CustomButton>
          </DialogTrigger>
          <DialogContent className="dialog-popup">
            <DialogHeader className="dialog-header">
              <DialogTitle>Custom trigger</DialogTitle>
            </DialogHeader>
            <DialogClose className="example-trigger">Close</DialogClose>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="icon-button"
              aria-label="Open info dialog"
            >
              <span aria-hidden="true">i</span>
            </button>
          </DialogTrigger>
          <DialogContent className="dialog-popup">
            <DialogHeader className="dialog-header">
              <DialogTitle>Information</DialogTitle>
            </DialogHeader>
            <p>Icon-only triggers keep their accessible name.</p>
            <DialogClose className="example-trigger">Close</DialogClose>
          </DialogContent>
        </Dialog>
      </div>
    </ExampleCard>
  );
}

function NoCloseButtonDialog() {
  return (
    <ExampleCard
      title="E. No close button"
      description="Dialog never injects a close button. This example closes with Escape or outside interaction."
    >
      <Dialog>
        <DialogTrigger className="example-trigger">
          Open without close button
        </DialogTrigger>
        <DialogContent className="dialog-popup">
          <DialogHeader className="dialog-header">
            <DialogTitle>No built-in close control</DialogTitle>
            <DialogDescription>
              Press Escape or click outside to dismiss.
            </DialogDescription>
          </DialogHeader>
          <p>Consumers can compose whatever action set they need.</p>
        </DialogContent>
      </Dialog>
    </ExampleCard>
  );
}

function CustomCloseDialog() {
  return (
    <ExampleCard
      title="F. Custom close button"
      description="DialogClose supports asChild for consumer controls and icon buttons."
    >
      <Dialog>
        <DialogTrigger className="example-trigger">
          Open custom close
        </DialogTrigger>
        <DialogContent className="dialog-popup">
          <div className="dialog-title-row">
            <DialogHeader className="dialog-header">
              <DialogTitle>Custom close control</DialogTitle>
            </DialogHeader>
            <DialogClose asChild>
              <button
                type="button"
                className="dialog-icon-close"
                aria-label="Close dialog"
              >
                ×
              </button>
            </DialogClose>
          </div>
          <p>The close control is provided by the consumer.</p>
        </DialogContent>
      </Dialog>
    </ExampleCard>
  );
}

function ScrollableDialog() {
  return (
    <ExampleCard
      title="G. Scrollable content"
      description="The content region scrolls independently; the library applies no default max-height or overflow."
    >
      <Dialog>
        <DialogTrigger className="example-trigger">
          Open scrollable
        </DialogTrigger>
        <DialogContent className="dialog-popup dialog-popup--scroll">
          <DialogHeader className="dialog-header dialog-header--sticky">
            <DialogTitle>Terms and conditions</DialogTitle>
            <DialogDescription>A long readable document.</DialogDescription>
          </DialogHeader>
          <div className="dialog-scroll-body">
            {Array.from({ length: 18 }, (_, index) => index + 1).map(
              (section) => (
                <p key={section}>
                  Section {section}. This content scrolls inside its own region
                  while the Dialog remains in place. Consumers control layout,
                  padding, and overflow.
                </p>
              ),
            )}
          </div>
          <DialogFooter className="dialog-footer dialog-footer--sticky">
            <DialogClose className="example-trigger">Done</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ExampleCard>
  );
}

function StickyFooterDialog() {
  return (
    <ExampleCard
      title="H. Sticky footer"
      description="Header and footer stay visible while the middle region scrolls."
    >
      <Dialog>
        <DialogTrigger className="example-trigger">
          Open sticky footer
        </DialogTrigger>
        <DialogContent className="dialog-popup dialog-popup--scroll">
          <DialogHeader className="dialog-header dialog-header--sticky">
            <DialogTitle>Keyboard shortcuts</DialogTitle>
            <DialogDescription>Reference sheet</DialogDescription>
          </DialogHeader>
          <div className="dialog-scroll-body">
            {Array.from({ length: 14 }, (_, index) => index + 1).map(
              (group) => (
                <p key={group}>
                  Shortcut group {group}: use the command palette to search
                  actions without leaving the current task.
                </p>
              ),
            )}
          </div>
          <DialogFooter className="dialog-footer dialog-footer--sticky">
            <DialogClose className="example-trigger">Close</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ExampleCard>
  );
}

function FullscreenDialog() {
  return (
    <ExampleCard
      title="I. Fullscreen"
      description="Advanced composition uses a consumer-styled fullscreen viewport and popup."
    >
      <Dialog>
        <DialogTrigger className="example-trigger">
          Open fullscreen
        </DialogTrigger>
        <DialogPortal>
          <DialogBackdrop />
          <DialogViewport className="dialog-viewport--fullscreen">
            <DialogPopup className="dialog-popup dialog-popup--fullscreen">
              <DialogHeader className="dialog-header">
                <DialogTitle>Fullscreen workspace</DialogTitle>
                <DialogDescription>
                  The consumer owns width, height, and safe-area styling.
                </DialogDescription>
              </DialogHeader>
              <div className="dialog-fullscreen-body">
                Full-height content can be composed here.
              </div>
              <DialogFooter className="dialog-footer">
                <DialogClose className="example-trigger">Exit</DialogClose>
              </DialogFooter>
            </DialogPopup>
          </DialogViewport>
        </DialogPortal>
      </Dialog>
    </ExampleCard>
  );
}

function NonModalDialog() {
  const [backgroundCount, setBackgroundCount] = useState(0);
  return (
    <ExampleCard
      title="J. Non-modal"
      description="No backdrop, no focus trap, no scroll lock, and the background remains interactive."
    >
      <div className="example-actions">
        <Dialog modal={false}>
          <DialogTrigger className="example-trigger">
            Open non-modal
          </DialogTrigger>
          <DialogContent className="dialog-popup">
            <DialogHeader className="dialog-header">
              <DialogTitle>Non-modal panel</DialogTitle>
              <DialogDescription>
                You can still use the background.
              </DialogDescription>
            </DialogHeader>
            <DialogClose className="example-trigger">Close</DialogClose>
          </DialogContent>
        </Dialog>
        <button
          type="button"
          className="example-trigger"
          onClick={() => setBackgroundCount((value) => value + 1)}
        >
          Background action ({backgroundCount})
        </button>
      </div>
    </ExampleCard>
  );
}

function NestedDialog() {
  return (
    <ExampleCard
      title="K. Nested Dialog"
      description="The child has higher layer priority. Escape closes the child; focus returns inside the parent."
    >
      <Dialog>
        <DialogTrigger className="example-trigger">Open parent</DialogTrigger>
        <DialogContent className="dialog-popup">
          <DialogHeader className="dialog-header">
            <DialogTitle>Parent dialog</DialogTitle>
          </DialogHeader>
          <p>Open the child and press Escape.</p>
          <Dialog>
            <DialogTrigger className="example-trigger">
              Open child
            </DialogTrigger>
            <DialogContent className="dialog-popup">
              <DialogHeader className="dialog-header">
                <DialogTitle>Child dialog</DialogTitle>
              </DialogHeader>
              <p>Escape closes this child first.</p>
              <DialogClose className="example-trigger">Close child</DialogClose>
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>
    </ExampleCard>
  );
}

function DialogWithPopover() {
  return (
    <ExampleCard
      title="L. Dialog with Popover"
      description="A child Popover portals into the Dialog popup. Escape closes the Popover before the Dialog."
    >
      <Dialog>
        <DialogTrigger className="example-trigger">
          Open Dialog with Popover
        </DialogTrigger>
        <DialogContent className="dialog-popup">
          <DialogHeader className="dialog-header">
            <DialogTitle>Dialog with a Popover</DialogTitle>
          </DialogHeader>
          <p>The Popover stays within the dialog interaction boundary.</p>
          <Popover>
            <PopoverTrigger className="example-trigger">
              Open child Popover
            </PopoverTrigger>
            <PopoverContent className="example-popover">
              This is a child Popover. Escape closes it first.
            </PopoverContent>
          </Popover>
          <DialogFooter className="dialog-footer">
            <DialogClose className="example-trigger">Close dialog</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ExampleCard>
  );
}

function DialogInsidePopover() {
  return (
    <ExampleCard
      title="O. Dialog inside Popover"
      description="The Dialog opens above the Popover. Escape closes the Dialog first, and the Popover remains available."
    >
      <Popover>
        <PopoverTrigger className="example-trigger">
          Open parent Popover
        </PopoverTrigger>
        <PopoverContent className="example-popover">
          <p>Popover content</p>
          <Dialog>
            <DialogTrigger className="example-trigger">
              Open Dialog from Popover
            </DialogTrigger>
            <DialogContent className="dialog-popup">
              <DialogHeader className="dialog-header">
                <DialogTitle>Dialog above Popover</DialogTitle>
              </DialogHeader>
              <p>Escape closes this Dialog, not the Popover.</p>
              <DialogClose className="example-trigger">
                Close dialog
              </DialogClose>
            </DialogContent>
          </Dialog>
        </PopoverContent>
      </Popover>
    </ExampleCard>
  );
}

function RtlDialog() {
  return (
    <ExampleCard
      title="M. RTL"
      description="Consumer-owned layout and close placement follow the configured text direction."
    >
      <Dialog dir="rtl">
        <DialogTrigger className="example-trigger">فتح الحوار</DialogTrigger>
        <DialogContent className="dialog-popup dialog-rtl">
          <div className="dialog-title-row">
            <DialogHeader className="dialog-header">
              <DialogTitle>إعدادات الحساب</DialogTitle>
              <DialogDescription>
                واجهة من اليمين إلى اليسار مع زر إغلاق مخصص.
              </DialogDescription>
            </DialogHeader>
            <DialogClose asChild>
              <button
                type="button"
                className="dialog-icon-close"
                aria-label="إغلاق"
              >
                ×
              </button>
            </DialogClose>
          </div>
          <p>المحتوى يتبع اتجاه النص الذي يحدده المستهلك.</p>
        </DialogContent>
      </Dialog>
    </ExampleCard>
  );
}

function MobileDialog() {
  return (
    <ExampleCard
      title="N. Mobile viewport"
      description="At narrow widths the example CSS aligns the Dialog to the bottom. The library imposes no mobile layout."
    >
      <Dialog>
        <DialogTrigger className="example-trigger">
          Open responsive dialog
        </DialogTrigger>
        <DialogContent className="dialog-popup dialog-popup--mobile">
          <DialogHeader className="dialog-header">
            <DialogTitle>Responsive dialog</DialogTitle>
            <DialogDescription>
              Resize the preview to see the consumer CSS.
            </DialogDescription>
          </DialogHeader>
          <label>
            Email
            <input type="email" placeholder="you@example.com" />
          </label>
          <DialogFooter className="dialog-footer">
            <DialogClose className="example-trigger">Close</DialogClose>
            <button type="button" className="example-trigger">
              Continue
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ExampleCard>
  );
}

export function DialogExamplesContent() {
  return (
    <div className="example-grid">
      <BasicDialog />
      <FormDialog />
      <ControlledDialog />
      <CustomTriggerDialog />
      <NoCloseButtonDialog />
      <CustomCloseDialog />
      <ScrollableDialog />
      <StickyFooterDialog />
      <FullscreenDialog />
      <NonModalDialog />
      <NestedDialog />
      <DialogWithPopover />
      <DialogInsidePopover />
      <RtlDialog />
      <MobileDialog />
    </div>
  );
}
