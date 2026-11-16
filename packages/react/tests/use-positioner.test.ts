import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { StrictMode, createElement } from "react";
import type { Placement, PositionerOptions } from "@zealakit/overlay-core";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import { usePositioner } from "../dist/index.js";
import { resetDom, setBox, setViewport } from "./support/dom.ts";

afterEach(() => {
  cleanup();
  resetDom();
});

type DemoProps = {
  options: PositionerOptions;
  showFloating?: boolean;
};

function PositionerDemo({ options, showFloating = true }: DemoProps) {
  const { referenceRef, floatingRef, result, update } = usePositioner(options);

  return createElement(
    "div",
    null,
    createElement(
      "button",
      { ref: referenceRef, id: "trigger", type: "button" },
      "trigger",
    ),
    showFloating
      ? createElement("div", { ref: floatingRef, id: "panel" })
      : null,
    createElement(
      "button",
      {
        id: "measure",
        type: "button",
        onClick: () => {
          void update();
        },
      },
      "measure",
    ),
    createElement(
      "output",
      { id: "result" },
      result ? `${result.x},${result.y},${result.placement}` : "none",
    ),
  );
}

function measure() {
  return act(async () => {
    fireEvent.click(document.getElementById("measure") as HTMLElement);
    await Promise.resolve();
  });
}

function setGeometry(): void {
  const trigger = document.getElementById("trigger");
  const panel = document.getElementById("panel");
  assert.ok(trigger);
  assert.ok(panel);
  setBox(trigger, { x: 10, y: 20, width: 100, height: 40 });
  setBox(panel, { x: 0, y: 0, width: 200, height: 80 });
}

test("positions once callback refs have mounted elements", async () => {
  render(
    createElement(PositionerDemo, {
      options: {
        autoUpdate: false,
        placement: "bottom-start",
        offset: 8,
        flip: false,
        shift: false,
      },
    }),
  );

  setGeometry();
  await measure();

  await waitFor(() => {
    assert.equal(
      document.getElementById("result")?.textContent,
      "10,68,bottom-start",
    );
  });
});

test("updates when positioning options change", async () => {
  const view = render(
    createElement(PositionerDemo, {
      options: {
        autoUpdate: false,
        placement: "bottom-start",
        offset: 8,
        flip: false,
        shift: false,
      },
    }),
  );

  setGeometry();
  await measure();
  await waitFor(() => {
    assert.equal(
      document.getElementById("result")?.textContent,
      "10,68,bottom-start",
    );
  });

  view.rerender(
    createElement(PositionerDemo, {
      options: {
        autoUpdate: false,
        placement: "right-start",
        offset: 4,
        flip: false,
        shift: false,
      },
    }),
  );

  await waitFor(() => {
    assert.equal(
      document.getElementById("result")?.textContent,
      "114,20,right-start",
    );
  });
});

test("clears the result when the floating element unmounts", async () => {
  const view = render(
    createElement(PositionerDemo, {
      options: { autoUpdate: false, placement: "bottom-start" },
    }),
  );

  setGeometry();
  await measure();
  await waitFor(() => {
    assert.notEqual(document.getElementById("result")?.textContent, "none");
  });

  view.rerender(
    createElement(PositionerDemo, {
      options: { autoUpdate: false, placement: "bottom-start" },
      showFloating: false,
    }),
  );

  await waitFor(() => {
    assert.equal(document.getElementById("result")?.textContent, "none");
  });
});

let renderCount = 0;

function CountingDemo() {
  renderCount += 1;
  const { referenceRef, floatingRef, result, update } = usePositioner({
    autoUpdate: false,
    placement: "bottom-start",
    flip: false,
    shift: false,
  });

  return createElement(
    "div",
    null,
    createElement("button", {
      ref: referenceRef,
      id: "count-trigger",
      type: "button",
    }),
    createElement("div", { ref: floatingRef, id: "count-panel" }),
    createElement("button", {
      id: "count-measure",
      type: "button",
      onClick: () => {
        void update();
      },
    }),
    createElement(
      "output",
      { id: "count-result" },
      result ? `${result.x}` : "none",
    ),
  );
}

test("does not re-render when a measurement is unchanged", async () => {
  renderCount = 0;
  render(createElement(CountingDemo));

  const trigger = document.getElementById("count-trigger");
  const panel = document.getElementById("count-panel");
  assert.ok(trigger);
  assert.ok(panel);
  setBox(trigger, { x: 10, y: 20, width: 100, height: 40 });
  setBox(panel, { x: 0, y: 0, width: 200, height: 80 });

  await act(async () => {
    fireEvent.click(document.getElementById("count-measure") as HTMLElement);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  assert.equal(document.getElementById("count-result")?.textContent, "10");

  const rendersAfterFirstMeasurement = renderCount;

  await act(async () => {
    fireEvent.click(document.getElementById("count-measure") as HTMLElement);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  assert.equal(renderCount, rendersAfterFirstMeasurement);
});

test("works under Strict Mode and cleans up its observers", async () => {
  const doc = document as unknown as {
    addEventListener: (...args: unknown[]) => void;
    removeEventListener: (...args: unknown[]) => void;
  };
  const originalAdd = doc.addEventListener.bind(doc);
  const originalRemove = doc.removeEventListener.bind(doc);
  let adds = 0;
  let removes = 0;
  doc.addEventListener = (type, ...rest) => {
    adds += 1;
    originalAdd(type, ...rest);
  };
  doc.removeEventListener = (type, ...rest) => {
    removes += 1;
    originalRemove(type, ...rest);
  };

  try {
    const view = render(
      createElement(
        StrictMode,
        null,
        createElement(PositionerDemo, {
          options: { autoUpdate: true, placement: "bottom-start" },
        }),
      ),
    );

    setGeometry();
    await measure();
    await waitFor(() => {
      assert.notEqual(document.getElementById("result")?.textContent, "none");
    });

    view.unmount();
    assert.equal(adds - removes, 0);
  } finally {
    doc.addEventListener = originalAdd;
    doc.removeEventListener = originalRemove;
  }
});

const ALL_PLACEMENTS: Placement[] = [
  "top-start",
  "top",
  "top-end",
  "bottom-start",
  "bottom",
  "bottom-end",
  "left-start",
  "left",
  "left-end",
  "right-start",
  "right",
  "right-end",
];

test("supports all twelve placements through the public hook", async () => {
  setViewport(2000, 2000);
  const view = render(
    createElement(PositionerDemo, {
      options: {
        autoUpdate: false,
        placement: "top-start",
        offset: 8,
        flip: false,
        shift: false,
      },
    }),
  );

  const trigger = document.getElementById("trigger");
  const panel = document.getElementById("panel");
  assert.ok(trigger);
  assert.ok(panel);
  setBox(trigger, { x: 900, y: 900, width: 80, height: 40 });
  setBox(panel, { x: 0, y: 0, width: 120, height: 50 });

  for (const placement of ALL_PLACEMENTS) {
    view.rerender(
      createElement(PositionerDemo, {
        options: {
          autoUpdate: false,
          placement,
          offset: 8,
          flip: false,
          shift: false,
        },
      }),
    );
    await measure();

    await waitFor(() => {
      const result = document.getElementById("result")?.textContent ?? "";
      assert.equal(result.split(",")[2], placement);
    });
  }
});

test("supports a virtual point reference without a DOM anchor", async () => {
  function VirtualDemo() {
    const { floatingRef, result } = usePositioner({
      reference: {
        getBoundingClientRect: () => ({
          x: 120,
          y: 80,
          width: 0,
          height: 0,
        }),
      },
      placement: "bottom-start",
      autoUpdate: false,
    });
    return createElement("div", {
      ref: floatingRef,
      id: "virtual-panel",
      "data-result": result ? `${result.x},${result.y}` : "none",
    });
  }

  render(createElement(VirtualDemo));
  await waitFor(() => {
    assert.equal(
      document.getElementById("virtual-panel")?.getAttribute("data-result"),
      "120,80",
    );
  });
});

test("flushes position updates synchronously before the update promise resolves", async () => {
  let updatePosition: () => Promise<unknown> = async () => null;

  function FlushDemo() {
    const positioner = usePositioner({
      placement: "bottom-start",
      autoUpdate: false,
      offset: 8,
      flip: false,
      shift: false,
    });
    updatePosition = positioner.update;
    const result = positioner.result;
    return createElement(
      "div",
      null,
      createElement("button", {
        ref: positioner.referenceRef,
        id: "flush-reference",
        type: "button",
      }),
      createElement("div", {
        ref: positioner.floatingRef,
        id: "flush-panel",
        style: {
          position: result?.strategy,
          left: result ? `${result.x}px` : undefined,
          top: result ? `${result.y}px` : undefined,
        },
      }),
    );
  }

  render(createElement(FlushDemo));
  const reference = document.getElementById("flush-reference");
  const panel = document.getElementById("flush-panel") as HTMLDivElement | null;
  assert.ok(reference && panel);

  setBox(reference, { x: 10, y: 20, width: 100, height: 40 });
  setBox(panel, { x: 0, y: 0, width: 200, height: 80 });

  await act(async () => {
    await updatePosition();
  });
  assert.equal(panel.style.top, "68px");

  setBox(reference, { x: 10, y: 100, width: 100, height: 40 });
  await updatePosition();
  // flushSync makes the DOM style current when update() resolves.
  assert.equal(panel.style.top, "148px");
});

test("repositions on window scroll while open", async () => {
  function ScrollDemo() {
    const positioner = usePositioner({
      placement: "bottom-start",
      offset: 8,
      flip: false,
      shift: false,
    });
    const result = positioner.result;
    return createElement(
      "div",
      null,
      createElement("button", {
        ref: positioner.referenceRef,
        id: "scroll-reference",
        type: "button",
      }),
      createElement("div", {
        ref: positioner.floatingRef,
        id: "scroll-panel",
        style: {
          position: result?.strategy,
          left: result ? `${result.x}px` : undefined,
          top: result ? `${result.y}px` : undefined,
        },
      }),
    );
  }

  render(createElement(ScrollDemo));
  const reference = document.getElementById("scroll-reference");
  const panel = document.getElementById(
    "scroll-panel",
  ) as HTMLDivElement | null;
  assert.ok(reference && panel);
  setBox(reference, { x: 10, y: 20, width: 100, height: 40 });
  setBox(panel, { x: 0, y: 0, width: 200, height: 80 });

  await waitFor(() => assert.equal(panel.style.top, "68px"));

  setBox(reference, { x: 10, y: 10, width: 100, height: 40 });
  window.dispatchEvent(new Event("scroll"));
  await waitFor(() => assert.equal(panel.style.top, "58px"));
});
