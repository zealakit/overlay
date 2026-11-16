import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
  type LayerStack,
  createLayerStack,
  createOverlay,
} from "../dist/index.js";
import {
  dispatchEscape,
  dispatchPointer,
  resetDom,
  setBox,
  trackDocumentListeners,
} from "./support/dom.ts";

beforeEach(resetDom);

type OverlayFixture = {
  reference: HTMLButtonElement;
  floating: HTMLDivElement;
  wrapper: HTMLDivElement;
  stack: LayerStack;
  overlay: ReturnType<typeof createOverlay>;
};

function createFixture(
  options: {
    stack?: LayerStack;
    defaultOpen?: boolean;
    portal?: Element | null;
  } = {},
): OverlayFixture {
  const wrapper = document.createElement("div");
  const reference = document.createElement("button");
  const floating = document.createElement("div");
  wrapper.append(floating);
  document.body.append(wrapper, reference);
  setBox(reference, { x: 10, y: 20, width: 100, height: 40 });
  setBox(floating, { x: 0, y: 0, width: 200, height: 80 });

  const stack = options.stack ?? createLayerStack({ document });
  const overlay = createOverlay({
    reference,
    floating,
    stack,
    autoUpdate: false,
    placement: "bottom-start",
    offset: 8,
    defaultOpen: options.defaultOpen,
    portal: options.portal,
  });

  return { reference, floating, wrapper, stack, overlay };
}

test("opens on trigger click and positions the floating element", async () => {
  const { reference, floating, overlay, stack } = createFixture();
  const events: Array<[boolean, string | undefined]> = [];
  overlay.subscribe((state) => events.push([state.open, state.placement]));

  assert.equal(overlay.isOpen, false);
  assert.equal(floating.hasAttribute("hidden"), true);

  reference.click();

  assert.equal(overlay.isOpen, true);
  assert.equal(floating.hasAttribute("hidden"), false);
  assert.equal(floating.dataset.state, "open");

  await overlay.update();
  assert.equal(floating.style.left, "10px");
  assert.equal(floating.style.top, "68px");
  assert.equal(overlay.placement, "bottom-start");

  assert.equal(events.at(-1)?.[0], true);
  overlay.destroy();
  stack.dispose();
});

test("closes on Escape and reports the dismissal reason", async () => {
  const { floating, overlay, stack } = createFixture();
  const reasons: Array<string | undefined> = [];
  overlay.subscribe((state) => {
    if (!state.open) {
      reasons.push("closed");
    }
  });

  overlay.open();
  assert.equal(overlay.isOpen, true);

  dispatchEscape();

  assert.equal(overlay.isOpen, false);
  assert.equal(floating.hasAttribute("hidden"), true);
  assert.deepEqual(reasons, ["closed"]);

  overlay.destroy();
  stack.dispose();
});

test("closes on an outside pointer press", () => {
  const { overlay, stack } = createFixture();
  const outside = document.createElement("p");
  document.body.append(outside);

  overlay.open();
  dispatchPointer(document.body);
  assert.equal(overlay.isOpen, false);

  overlay.destroy();
  stack.dispose();
});

test("trigger click closes an open overlay", () => {
  const { reference, overlay, stack } = createFixture();
  const reasons: string[] = [];
  overlay.subscribe((state) => {
    if (!state.open) {
      reasons.push("closed");
    }
  });

  reference.click();
  assert.equal(overlay.isOpen, true);

  reference.click();
  assert.equal(overlay.isOpen, false);

  overlay.destroy();
  stack.dispose();
});

test("can open by default without attaching duplicate listeners", (t) => {
  const tracker = trackDocumentListeners();
  t.after(() => tracker.restore());

  const { overlay, stack } = createFixture({ defaultOpen: true });

  assert.equal(overlay.isOpen, true);
  assert.equal(tracker.counts.keydownAdds, 1);

  overlay.destroy();
  stack.dispose();
});

test("overlays without an explicit stack share one document listener set", (t) => {
  const tracker = trackDocumentListeners();
  t.after(() => tracker.restore());

  const referenceA = document.createElement("button");
  const floatingA = document.createElement("div");
  const referenceB = document.createElement("button");
  const floatingB = document.createElement("div");
  document.body.append(referenceA, floatingA, referenceB, floatingB);

  const first = createOverlay({
    reference: referenceA,
    floating: floatingA,
    autoUpdate: false,
  });
  const second = createOverlay({
    reference: referenceB,
    floating: floatingB,
    autoUpdate: false,
  });

  first.open();
  second.open();

  assert.equal(tracker.counts.keydownAdds, 1);
  assert.equal(tracker.counts.pointerdownAdds, 1);

  first.destroy();
  assert.equal(tracker.counts.keydownRemoves, 0);

  second.destroy();
  assert.equal(tracker.counts.keydownRemoves, 1);
  assert.equal(tracker.counts.pointerdownRemoves, 1);
});

test("portals the floating element while open and restores it on destroy", () => {
  const { floating, wrapper, overlay, stack } = createFixture({
    portal: document.body,
  });

  overlay.open();
  assert.equal(floating.parentElement, document.body);

  overlay.destroy();
  assert.equal(floating.parentElement, wrapper);
  assert.equal(overlay.isOpen, false);

  stack.dispose();
});

test("destroy detaches trigger and document listeners", () => {
  const { reference, floating, overlay, stack } = createFixture();
  const outside = document.createElement("p");
  document.body.append(outside);

  overlay.open();
  overlay.destroy();
  overlay.destroy();

  reference.click();
  assert.equal(overlay.isOpen, false);
  assert.equal(floating.hasAttribute("hidden"), true);

  dispatchEscape();
  dispatchPointer(outside);
  assert.equal(overlay.isOpen, false);

  stack.dispose();
});

test("two overlays share a stack and only the topmost dismisses on Escape", () => {
  const stack = createLayerStack({ document });
  const first = createFixture({ stack });
  const second = createFixture({ stack });

  first.overlay.open();
  second.overlay.open();

  assert.equal(stack.size, 2);
  assert.ok(stack.getTopmost());

  dispatchEscape();
  assert.equal(second.overlay.isOpen, false);
  assert.equal(first.overlay.isOpen, true);

  dispatchEscape();
  assert.equal(first.overlay.isOpen, false);

  first.overlay.destroy();
  second.overlay.destroy();
  stack.dispose();
});
