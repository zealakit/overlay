import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createElement as h } from "react";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../dist/index.js";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { resetDom, setViewport } from "./support/dom.ts";

afterEach(() => {
  cleanup();
  resetDom();
});

setViewport(1280, 720);

function popover(contentProps: Record<string, unknown>, children?: unknown) {
  return h(
    Popover,
    { defaultOpen: true },
    h(PopoverTrigger, null, "Open"),
    h(
      PopoverContent,
      { "data-testid": "popup", ...contentProps },
      "Body",
      children as never,
    ),
  );
}

async function popup(): Promise<HTMLElement> {
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );
  const element = document.querySelector<HTMLElement>("[data-testid='popup']");
  assert.ok(element);
  return element;
}

test("arrow is hidden by default", async () => {
  render(popover({}));
  const element = await popup();
  assert.equal(element.querySelector("[data-arrow]"), null);
});

test("arrow shorthand renders one decorative arrow with a side", async () => {
  render(popover({ arrow: true, arrowSize: 10 }));
  const element = await popup();
  const arrows = element.querySelectorAll<HTMLElement>("[data-arrow]");
  assert.equal(arrows.length, 1);
  const [arrow] = arrows;
  assert.ok(arrow);
  const side = arrow.dataset.side;
  assert.ok(side);
  assert.equal(arrow.getAttribute("aria-hidden"), "true");
  assert.equal(arrow.style.width, "10px");
  assert.ok(["top", "right", "bottom", "left"].includes(side));
});

test("explicit PopoverArrow works without the shorthand", async () => {
  render(popover({}, h(PopoverArrow, { className: "my-arrow" })));
  const element = await popup();
  assert.equal(element.querySelectorAll(".my-arrow").length, 1);
});

test("tooltip arrow is opt-in", async () => {
  const trigger = (props: Record<string, unknown>) =>
    h(
      Tooltip,
      { defaultOpen: true },
      h(TooltipTrigger, null, "Hover"),
      h(TooltipContent, { "data-testid": "tip", ...props }, "Tip"),
    );
  const view = render(trigger({}));
  await waitFor(() => assert.ok(document.querySelector("[data-testid='tip']")));
  assert.equal(document.querySelector("[data-arrow]"), null);
  view.unmount();
  render(trigger({ arrow: true }));
  await waitFor(() => assert.ok(document.querySelector("[data-arrow]")));
});

test("animation is off by default and unmounts immediately", async () => {
  render(popover({}));
  await popup();
  fireEvent.keyDown(document, { key: "Escape" });
  await waitFor(() =>
    assert.equal(document.querySelector("[data-testid='popup']"), null),
  );
});

test("animation true keeps the popup until the exit animation finishes", async () => {
  const finishers: Array<() => void> = [];
  const timings: string[] = [];
  const original = HTMLElement.prototype.animate;
  HTMLElement.prototype.animate = (_k, options) => {
    const animationOptions = options as KeyframeAnimationOptions;
    timings.push(`${animationOptions.duration}:${animationOptions.easing}`);
    return {
      finished: new Promise<void>((resolve) => {
        finishers.push(resolve);
      }),
      cancel() {},
    } as unknown as Animation;
  };
  try {
    render(
      popover({
        animation: { duration: 250, easing: "linear", direction: "up" },
      }),
    );
    const element = await popup();
    assert.deepEqual(timings, ["250:linear"]);
    assert.ok(element.isConnected);
    for (const finish of finishers.splice(0)) {
      finish();
    }
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => assert.ok(finishers.length > 0));
    assert.ok(document.querySelector("[data-testid='popup']"));
    for (const finish of finishers.splice(0)) {
      finish();
    }
    await waitFor(() =>
      assert.ok(!document.querySelector("[data-testid='popup']")),
    );
  } finally {
    HTMLElement.prototype.animate = original;
  }
});

test("expand animation passes keyframes that fade and scale from the anchor", async () => {
  const seen: Keyframe[][] = [];
  const original = HTMLElement.prototype.animate;
  HTMLElement.prototype.animate = (keyframes) => {
    seen.push(keyframes as Keyframe[]);
    return {
      finished: new Promise<void>(() => {}),
      cancel() {},
    } as unknown as Animation;
  };
  try {
    render(popover({ animation: { type: "expand" } }));
    await popup();
    await waitFor(() => assert.ok(seen.length > 0));
    assert.equal(seen[0]?.[0]?.opacity, 0);
    assert.equal(seen[0]?.[1]?.opacity, 1);
    assert.equal(typeof seen[0]?.[0]?.scale, "string");
    assert.equal(seen[0]?.[0]?.transformOrigin !== undefined, true);
  } finally {
    HTMLElement.prototype.animate = original;
  }
});
