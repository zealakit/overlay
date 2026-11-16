import { useState, type CSSProperties } from "react";
import {
  type Placement,
  useEscapeKey,
  usePositioner,
} from "@zealakit/overlay-react";

type PlacementRailProps = {
  label: string;
  placements: readonly Placement[];
  selected: Placement;
  side: "top" | "right" | "bottom" | "left";
  onSelect: (placement: Placement) => void;
};

const PLACEMENTS = {
  top: ["top-start", "top", "top-end"],
  right: ["right-start", "right", "right-end"],
  bottom: ["bottom-start", "bottom", "bottom-end"],
  left: ["left-start", "left", "left-end"],
} as const satisfies Record<string, readonly Placement[]>;

function PlacementRail({
  label,
  placements,
  selected,
  side,
  onSelect,
}: PlacementRailProps) {
  return (
    <fieldset className={`placement-rail placement-rail-${side}`}>
      <legend className="visually-hidden">{label} placements</legend>
      {placements.map((placement) => (
        <button
          key={placement}
          type="button"
          className="placement-button"
          data-active={placement === selected}
          aria-pressed={placement === selected}
          onClick={() => onSelect(placement)}
        >
          {placement}
        </button>
      ))}
    </fieldset>
  );
}

export function PlacementPlayground() {
  const [placement, setPlacement] = useState<Placement>("bottom");
  const [open, setOpen] = useState(true);

  const { referenceRef, floatingRef, result } = usePositioner({
    placement,
    offset: 10,
    padding: 12,
  });

  useEscapeKey(
    () => {
      setOpen(false);
    },
    { enabled: open },
  );

  const renderedPlacement = result?.placement ?? placement;
  const floatingStyle: CSSProperties = result
    ? {
        position: result.strategy,
        left: result.x,
        top: result.y,
      }
    : {
        position: "fixed",
        left: 0,
        top: 0,
        visibility: "hidden",
      };

  return (
    <section
      className="playground"
      aria-labelledby="placement-playground-title"
    >
      <div className="playground-heading">
        <div>
          <h2 id="placement-playground-title">Placement playground</h2>
          <p>
            Choose one of the twelve placements around the reference. The
            preview updates immediately.
          </p>
        </div>
        <p className="placement-indicator" aria-live="polite">
          Current placement
          <code>{renderedPlacement}</code>
        </p>
      </div>

      <div className="playground-grid">
        <PlacementRail
          label="Top"
          side="top"
          placements={PLACEMENTS.top}
          selected={placement}
          onSelect={setPlacement}
        />

        <PlacementRail
          label="Left"
          side="left"
          placements={PLACEMENTS.left}
          selected={placement}
          onSelect={setPlacement}
        />

        <div className="reference-stage">
          <button
            ref={referenceRef}
            type="button"
            className="reference-button"
            aria-expanded={open}
            aria-controls="placement-preview"
            onClick={() => {
              setOpen((current) => !current);
            }}
          >
            Reference element
          </button>
          <span className="reference-hint">
            {open ? "Click to close" : "Click to open"}
          </span>
        </div>

        <PlacementRail
          label="Right"
          side="right"
          placements={PLACEMENTS.right}
          selected={placement}
          onSelect={setPlacement}
        />

        <PlacementRail
          label="Bottom"
          side="bottom"
          placements={PLACEMENTS.bottom}
          selected={placement}
          onSelect={setPlacement}
        />
      </div>

      {open ? (
        <div
          ref={floatingRef}
          id="placement-preview"
          className="floating-preview"
          style={floatingStyle}
          data-placement={renderedPlacement}
        >
          <span>Floating preview</span>
          <strong>{renderedPlacement}</strong>
          {renderedPlacement !== placement ? (
            <small>requested {placement}</small>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
