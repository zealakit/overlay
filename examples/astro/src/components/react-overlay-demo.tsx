import { Portal, useOverlay } from "@zealakit/overlay-react";

export default function ReactOverlayDemo() {
  const { isOpen, toggle, referenceRef, floatingRef, floatingStyles } =
    useOverlay({
      placement: "bottom-start",
      offset: 8,
    });

  return (
    <>
      <button
        ref={referenceRef}
        type="button"
        aria-controls="react-overlay-panel"
        aria-expanded={isOpen}
        onClick={toggle}
      >
        Toggle React overlay
      </button>

      <Portal>
        <div
          id="react-overlay-panel"
          ref={floatingRef}
          className="panel"
          role="dialog"
          aria-label="React overlay demo"
          hidden={!isOpen}
          data-state={isOpen ? "open" : "closed"}
          style={floatingStyles}
        >
          <p>
            React island — <code>useOverlay()</code> plus the{" "}
            <code>Portal</code> primitive, hydrated by Astro.
          </p>
        </div>
      </Portal>
    </>
  );
}
