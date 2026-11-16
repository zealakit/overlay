import {
  forwardRef,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  useLayer,
  type PopoverAlign,
  type PopoverChangeReason,
  type PopoverSide,
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

function BasicExample() {
  return (
    <ExampleCard
      title="A. Basic"
      description="A native button trigger, compact content, Escape, outside press, and an optional close control."
    >
      <Popover>
        <PopoverTrigger className="example-trigger">Open basic</PopoverTrigger>
        <PopoverContent className="example-popover" sideOffset={8}>
          <PopoverHeader>
            <PopoverTitle>Basic popover</PopoverTitle>
            <PopoverDescription>
              This is a non-modal popover. Focus stays on the trigger unless you
              configure otherwise.
            </PopoverDescription>
          </PopoverHeader>
          <PopoverClose className="example-close">Close</PopoverClose>
        </PopoverContent>
      </Popover>
    </ExampleCard>
  );
}

const SIDES: PopoverSide[] = ["top", "right", "bottom", "left"];
const ALIGNS: PopoverAlign[] = ["start", "center", "end"];

function PlacementExample() {
  const [side, setSide] = useState<PopoverSide>("bottom");
  const [align, setAlign] = useState<PopoverAlign>("center");

  return (
    <ExampleCard
      title="B. Alignment and placement"
      description="All twelve physical placements. Open the popover, then change placement. Outside dismissal is disabled so the controls can be used while it stays open."
    >
      <Popover dismissOnOutsidePress={false}>
        <PopoverTrigger className="example-trigger">
          Open placement
        </PopoverTrigger>
        <PopoverContent
          className="example-popover"
          side={side}
          align={align}
          sideOffset={8}
          collisionAvoidance={{ flip: false, shift: false }}
        >
          <strong>
            {side} / {align}
          </strong>
          <p className="example-small">
            Change the placement while the popover is open.
          </p>
        </PopoverContent>
      </Popover>

      <fieldset className="placement-picker">
        <legend className="visually-hidden">Placement</legend>
        {SIDES.flatMap((candidateSide) =>
          ALIGNS.map((candidateAlign) => {
            const active = candidateSide === side && candidateAlign === align;
            return (
              <button
                key={`${candidateSide}-${candidateAlign}`}
                type="button"
                data-active={active}
                onClick={() => {
                  setSide(candidateSide);
                  setAlign(candidateAlign);
                }}
              >
                {candidateSide}-{candidateAlign}
              </button>
            );
          }),
        )}
      </fieldset>
    </ExampleCard>
  );
}

function FormExample() {
  const [message, setMessage] = useState("Nothing submitted yet.");

  return (
    <ExampleCard
      title="C. Form"
      description="Labels, text fields, a select, checkboxes, radios, and actions remain interactive. Focus and typing do not dismiss the popover."
    >
      <Popover>
        <PopoverTrigger className="example-trigger">Open form</PopoverTrigger>
        <PopoverContent className="example-popover example-form-popover">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setMessage("Submitted — the popover stays open.");
            }}
          >
            <label className="field">
              Name
              <input name="name" defaultValue="Huy" />
            </label>
            <label className="field">
              Notes
              <textarea name="notes" rows={2} defaultValue="Hello" />
            </label>
            <label className="field">
              Plan
              <select name="plan" defaultValue="team">
                <option value="personal">Personal</option>
                <option value="team">Team</option>
              </select>
            </label>
            <label className="check">
              <input type="checkbox" name="updates" defaultChecked />
              Product updates
            </label>
            <fieldset className="radio-group">
              <legend>Visibility</legend>
              <label className="check">
                <input type="radio" name="visibility" defaultChecked />
                Private
              </label>
              <label className="check">
                <input type="radio" name="visibility" />
                Shared
              </label>
            </fieldset>
            <div className="example-actions">
              <button type="submit" className="example-primary">
                Submit
              </button>
              <PopoverClose className="example-close">Cancel</PopoverClose>
            </div>
          </form>
          <p className="example-status" role="status">
            {message}
          </p>
        </PopoverContent>
      </Popover>
    </ExampleCard>
  );
}

const CustomButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(function CustomButton(props, ref) {
  return <button {...props} ref={ref} type="button" />;
});

function CustomTriggerExample() {
  return (
    <ExampleCard
      title="D. Custom trigger"
      description="A consumer button component and an icon-only button. Both receive refs, ARIA, and trigger behavior through asChild."
    >
      <div className="example-actions">
        <Popover>
          <PopoverTrigger asChild>
            <CustomButton className="example-trigger">
              Custom button
            </CustomButton>
          </PopoverTrigger>
          <PopoverContent className="example-popover">
            Opened by a custom button component.
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="icon-button"
              aria-label="More actions"
            >
              <span aria-hidden="true">⋯</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="example-popover">
            Icon-only trigger content.
          </PopoverContent>
        </Popover>
      </div>
    </ExampleCard>
  );
}

function InputGroupExample() {
  return (
    <ExampleCard
      title="E. Input group"
      description="The trigger is a real button inside a compound input-group layout, not a nested button wrapper."
    >
      <div className="example-input-group">
        <input aria-label="Search" placeholder="Search projects" />
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="example-trigger">
              Filters
            </button>
          </PopoverTrigger>
          <PopoverContent className="example-popover">
            <strong>Filters</strong>
            <label className="check">
              <input type="checkbox" defaultChecked /> Active
            </label>
            <label className="check">
              <input type="checkbox" /> Archived
            </label>
          </PopoverContent>
        </Popover>
      </div>
    </ExampleCard>
  );
}

function SeparateAnchorExample() {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  return (
    <ExampleCard
      title="F. Separate anchor"
      description="The trigger and the positioning reference are different elements using the Content anchor prop."
    >
      <div className="example-actions">
        <button
          ref={setAnchor}
          type="button"
          className="anchor-target"
          id="separate-anchor"
        >
          Anchor target
        </button>
        <Popover>
          <PopoverTrigger className="example-trigger">
            Open anchored
          </PopoverTrigger>
          <PopoverContent
            anchor={anchor}
            className="example-popover"
            side="bottom"
            align="start"
            sideOffset={8}
          >
            Positioned against the separate anchor, opened by its own trigger.
          </PopoverContent>
        </Popover>
      </div>
    </ExampleCard>
  );
}

function NestedExample() {
  return (
    <ExampleCard
      title="G. Nested popovers"
      description="A child popover registers with the parent layer. Escape closes the child first; the parent remains open."
    >
      <Popover>
        <PopoverTrigger className="example-trigger">Open parent</PopoverTrigger>
        <PopoverContent className="example-popover">
          <p>Parent popover</p>
          <Popover>
            <PopoverTrigger className="example-trigger">
              Open child
            </PopoverTrigger>
            <PopoverContent className="example-popover example-child">
              Child popover. Escape closes this layer first.
            </PopoverContent>
          </Popover>
        </PopoverContent>
      </Popover>
    </ExampleCard>
  );
}

function DialogFixture() {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(true);
  const layer = useLayer({
    element,
    onDismiss: () => setOpen(false),
  });

  if (!open) {
    return (
      <button
        type="button"
        className="example-trigger"
        onClick={() => setOpen(true)}
      >
        Reopen dialog fixture
      </button>
    );
  }

  return (
    <div
      ref={setElement}
      className="dialog-fixture"
      role="dialog"
      aria-label="Dialog fixture"
    >
      <strong>Dialog-like layer fixture</strong>
      <p className="example-small">
        Not a Dialog component; this fixture uses the public useLayer API to
        verify Popover layer order.
      </p>
      <Popover parentLayer={layer.handle}>
        <PopoverTrigger className="example-trigger">
          Open popover in dialog
        </PopoverTrigger>
        <PopoverContent className="example-popover">
          This popover is a child layer of the fixture.
        </PopoverContent>
      </Popover>
      <button
        type="button"
        className="example-close"
        onClick={() => setOpen(false)}
      >
        Close dialog fixture
      </button>
    </div>
  );
}

function DialogIntegrationExample() {
  return (
    <ExampleCard
      title="H. Dialog integration"
      description="Popover inside a dialog-like layer fixture. The Popover takes Escape priority while open; closing it returns control to the fixture."
    >
      <DialogFixture />
    </ExampleCard>
  );
}

function PortalExample() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  return (
    <ExampleCard
      title="I. Portal configuration"
      description="Default body portal, a custom portal container, and an inline popover that skips the portal entirely."
    >
      <div ref={setContainer} className="portal-target">
        Custom portal target
      </div>

      <div className="example-actions">
        <Popover>
          <PopoverTrigger className="example-trigger">
            Default portal
          </PopoverTrigger>
          <PopoverContent className="example-popover">
            Rendered into document.body.
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger className="example-trigger">
            Custom portal
          </PopoverTrigger>
          <PopoverContent
            className="example-popover"
            portal={container ?? undefined}
          >
            Rendered into the custom container.
          </PopoverContent>
        </Popover>

        <div className="inline-portal">
          <Popover>
            <PopoverTrigger className="example-trigger">
              No portal
            </PopoverTrigger>
            <PopoverContent className="example-popover" portal={false}>
              Rendered inline in the example card.
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </ExampleCard>
  );
}

function RtlExample() {
  return (
    <ExampleCard
      title="J. RTL"
      description="Start alignment follows text direction for top/bottom placements; physical left/right placements stay physical."
    >
      <div dir="rtl" className="rtl-frame">
        <Popover dir="rtl">
          <PopoverTrigger className="example-trigger">فتح</PopoverTrigger>
          <PopoverContent
            className="example-popover"
            side="bottom"
            align="start"
            sideOffset={8}
            collisionAvoidance={{ flip: false }}
          >
            Start alignment resolves to the physical end in RTL.
          </PopoverContent>
        </Popover>
      </div>
    </ExampleCard>
  );
}

function ControlledExample() {
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState("Closed");

  return (
    <ExampleCard
      title="K. Controlled state"
      description="The parent owns open state. Trigger and dismiss interactions call onOpenChange with a reason."
    >
      <div className="example-actions">
        <button
          type="button"
          className="example-trigger"
          onClick={() => setOpen(true)}
        >
          Open programmatically
        </button>
      </div>
      <Popover
        open={open}
        onOpenChange={(next: boolean, reason: PopoverChangeReason) => {
          setOpen(next);
          setLog(`${next ? "open" : "closed"} · ${reason}`);
        }}
      >
        <PopoverTrigger className="example-trigger">
          Controlled trigger
        </PopoverTrigger>
        <PopoverContent className="example-popover">
          Controlled content.
          <div className="example-actions">
            <button
              type="button"
              className="example-close"
              onClick={() => {
                setOpen(false);
                setLog("closed · programmatic");
              }}
            >
              Close programmatically
            </button>
          </div>
        </PopoverContent>
      </Popover>
      <p className="example-status" role="status">
        {log}
      </p>
    </ExampleCard>
  );
}

function LongContentExample() {
  const [count, setCount] = useState(8);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loading) {
      return;
    }
    const timer = window.setTimeout(() => {
      setCount((current) => current + 3);
      setLoading(false);
    }, 300);
    return () => {
      window.clearTimeout(timer);
    };
  }, [loading]);

  return (
    <ExampleCard
      title="L. Long and dynamic content"
      description="Content can scroll, grow, and change asynchronously without dismissing the popover."
    >
      <Popover>
        <PopoverTrigger className="example-trigger">
          Open long content
        </PopoverTrigger>
        <PopoverContent
          className="example-popover"
          style={{ maxHeight: 190, overflowY: "auto" }}
        >
          <strong>Items</strong>
          <ul className="long-list">
            {Array.from({ length: count }, (_, index) => {
              const label = `Item ${index + 1}`;
              return <li key={label}>{label}</li>;
            })}
          </ul>
          <div className="example-actions">
            <button
              type="button"
              className="example-close"
              onClick={() => setCount((current) => current + 5)}
            >
              Add 5 items
            </button>
            <button
              type="button"
              className="example-close"
              disabled={loading}
              onClick={() => setLoading(true)}
            >
              {loading ? "Loading…" : "Load async items"}
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </ExampleCard>
  );
}

export function PopoverExamplesContent() {
  return (
    <div className="example-grid">
      <BasicExample />
      <PlacementExample />
      <FormExample />
      <CustomTriggerExample />
      <InputGroupExample />
      <SeparateAnchorExample />
      <NestedExample />
      <DialogIntegrationExample />
      <PortalExample />
      <RtlExample />
      <ControlledExample />
      <LongContentExample />
    </div>
  );
}
