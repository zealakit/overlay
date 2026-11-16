"use client";

import { useState } from "react";
import { Portal, useOverlay } from "@zealakit/overlay-react";

function OverlayExample() {
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
        aria-controls="overlay-panel"
        aria-expanded={isOpen}
        onClick={toggle}
      >
        Toggle overlay
      </button>

      <Portal>
        <div
          id="overlay-panel"
          ref={floatingRef}
          className="panel"
          role="dialog"
          aria-label="Overlay demo"
          hidden={!isOpen}
          data-state={isOpen ? "open" : "closed"}
          style={floatingStyles}
        >
          <p>
            Server-rendered page, client-only portal. Press Escape or click
            outside to dismiss.
          </p>
        </div>
      </Portal>
    </>
  );
}

export function OverlayDemo() {
  const [mounted, setMounted] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setMounted((current) => !current);
        }}
      >
        {mounted ? "Unmount overlay demo" : "Mount overlay demo"}
      </button>

      {mounted ? (
        <OverlayExample />
      ) : (
        <p className="lede">
          Unmounted. Positioner, portal, and layer listeners were cleaned up.
        </p>
      )}
    </div>
  );
}
