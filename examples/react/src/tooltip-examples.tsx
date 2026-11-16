import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
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

function BasicTooltip() {
  return (
    <ExampleCard
      title="A. Basic"
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
  );
}

function IconTooltip() {
  return (
    <ExampleCard
      title="B. Icon button"
      description="An icon-only trigger keeps its accessible name through aria-label."
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="icon-button"
            aria-label="Delete item"
          >
            <span aria-hidden="true">⌫</span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="tooltip-surface">Delete item</TooltipContent>
      </Tooltip>
    </ExampleCard>
  );
}

function KeyboardTooltip() {
  return (
    <ExampleCard
      title="C. Keyboard focus"
      description="Tab to the trigger. Focus opens the Tooltip immediately, without needing hover or click."
    >
      <Tooltip>
        <TooltipTrigger className="example-trigger">
          Tab to focus me
        </TooltipTrigger>
        <TooltipContent className="tooltip-surface">
          Keyboard focus supplements the trigger's accessible name.
        </TooltipContent>
      </Tooltip>
    </ExampleCard>
  );
}

function ShortcutTooltip() {
  return (
    <ExampleCard
      title="D. Keyboard shortcut"
      description="Shortcut text is informational. Tooltip does not register or intercept the shortcut."
    >
      <Tooltip>
        <TooltipTrigger className="example-trigger">Save</TooltipTrigger>
        <TooltipContent className="tooltip-surface">
          Save changes <kbd className="tooltip-kbd">⌘S</kbd>
        </TooltipContent>
      </Tooltip>
    </ExampleCard>
  );
}

function PlacementTooltip() {
  return (
    <ExampleCard
      title="E. Placement"
      description="Physical sides with center alignment. Content uses the same positioning engine as Popover."
    >
      <div className="tooltip-grid">
        {(["top", "bottom", "left", "right"] as const).map((side) => (
          <Tooltip key={side} delay={0}>
            <TooltipTrigger className="example-trigger">{side}</TooltipTrigger>
            <TooltipContent
              className="tooltip-surface"
              side={side}
              sideOffset={8}
            >
              Placed on the {side}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </ExampleCard>
  );
}

function MultipleTooltips() {
  return (
    <ExampleCard
      title="F. Shared provider timing"
      description="Move between the three triggers. After one opens, the next opens immediately within the skip-delay window."
    >
      <TooltipProvider delay={300} closeDelay={80} skipDelayDuration={500}>
        <div className="example-actions">
          {["Bold", "Italic", "Underline"].map((label) => (
            <Tooltip key={label}>
              <TooltipTrigger className="example-trigger">
                {label}
              </TooltipTrigger>
              <TooltipContent className="tooltip-surface">
                Format text: {label.toLowerCase()}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
      <p className="example-small">
        The outer page provider supplies defaults; this nested provider
        demonstrates scoped timing.
      </p>
    </ExampleCard>
  );
}

function DisabledTooltip() {
  return (
    <ExampleCard
      title="G. Disabled button"
      description="Native disabled buttons are not focusable. Wrap one in a focusable element; the button stays disabled."
    >
      <Tooltip delay={0}>
        <TooltipTrigger asChild>
          {/* biome-ignore lint/a11y/noNoninteractiveTabindex: focusable wrapper exposes the disabled control's hint */}
          <span className="tooltip-disabled-wrapper" tabIndex={0}>
            <span className="visually-hidden">Save unavailable</span>
            <button type="button" disabled>
              Save
            </button>
          </span>
        </TooltipTrigger>
        <TooltipContent className="tooltip-surface">
          Saving is currently unavailable.
        </TooltipContent>
      </Tooltip>
      <p className="example-small">
        The wrapper owns the tooltip focus/description relationship. The
        consumer remains responsible for the disabled action.
      </p>
    </ExampleCard>
  );
}

const CustomButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(function CustomButton(props, ref) {
  return <button {...props} ref={ref} type="button" />;
});

function CustomTriggerTooltip() {
  return (
    <ExampleCard
      title="H. Custom trigger"
      description="A consumer Button component receives refs, ARIA description, hover, focus, and native handlers."
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <CustomButton className="example-trigger">Custom button</CustomButton>
        </TooltipTrigger>
        <TooltipContent className="tooltip-surface">
          Rendered by a custom component.
        </TooltipContent>
      </Tooltip>
    </ExampleCard>
  );
}

function RtlTooltip() {
  return (
    <ExampleCard
      title="I. RTL"
      description="Start alignment follows text direction for horizontal sides; physical left/right stay physical."
    >
      <div dir="rtl" className="rtl-frame">
        <Tooltip dir="rtl">
          <TooltipTrigger className="example-trigger">معلومة</TooltipTrigger>
          <TooltipContent
            className="tooltip-surface"
            side="bottom"
            align="start"
            collisionAvoidance={{ flip: false }}
          >
            تبدأ المحاذاة من الجهة اليمنى في RTL.
          </TooltipContent>
        </Tooltip>
      </div>
    </ExampleCard>
  );
}

function NestedOverlayTooltip() {
  return (
    <ExampleCard
      title="J. Nested overlay"
      description="A Tooltip inside a Popover. Escape closes the Tooltip first, then the Popover can still be used."
    >
      <Popover>
        <PopoverTrigger className="example-trigger">
          Open overlay
        </PopoverTrigger>
        <PopoverContent className="example-popover">
          <p>Popover content</p>
          <Tooltip delay={0}>
            <TooltipTrigger className="example-trigger">
              Hover in Popover
            </TooltipTrigger>
            <TooltipContent className="tooltip-surface">
              Tooltip inside a parent overlay.
            </TooltipContent>
          </Tooltip>
        </PopoverContent>
      </Popover>
      <p className="example-small">
        Dialog integration is covered by the automated layer/focus tests; no
        Dialog component is implemented yet.
      </p>
    </ExampleCard>
  );
}

export function TooltipExamplesContent() {
  return (
    <TooltipProvider delay={350} closeDelay={80} skipDelayDuration={500}>
      <div className="example-grid">
        <BasicTooltip />
        <IconTooltip />
        <KeyboardTooltip />
        <ShortcutTooltip />
        <PlacementTooltip />
        <MultipleTooltips />
        <DisabledTooltip />
        <CustomTriggerTooltip />
        <RtlTooltip />
        <NestedOverlayTooltip />
      </div>
    </TooltipProvider>
  );
}
