import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createDialog, createPopover, createTooltip } from "../dist/index.js";
import { resetDom, setBox } from "./support/dom.ts";

afterEach(() => {
  resetDom();
});

function append<T extends HTMLElement>(markup: string): T {
  document.body.insertAdjacentHTML("beforeend", markup);
  const element = document.body.lastElementChild;
  assert.ok(element);
  return element as T;
}

function setup() {
  const trigger = append<HTMLButtonElement>("<button>Open</button>");
  const content = append<HTMLDivElement>("<div>Panel</div>");
  const arrow = document.createElement("div");
  content.append(arrow);
  setBox(trigger, { x: 300, y: 200, width: 80, height: 40 });
  setBox(content, { x: 0, y: 0, width: 200, height: 80 });
  setBox(arrow, { x: 0, y: 0, width: 8, height: 8 });
  return { trigger, content, arrow };
}

type Waapi = { finish(): void; cancelled: boolean };

function mockAnimate(element: HTMLElement) {
  const calls: Array<{ options: KeyframeAnimationOptions; waapi: Waapi }> = [];
  (element as unknown as { animate: unknown }).animate = (
    _keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
  ) => {
    let finish: () => void = () => {};
    const waapi: Waapi = { finish: () => finish(), cancelled: false };
    calls.push({ options, waapi });
    return {
      finished: new Promise<void>((resolve) => {
        finish = resolve;
      }),
      cancel() {
        waapi.cancelled = true;
      },
    };
  };
  return calls;
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

test("arrow is untouched unless configured", async () => {
  const { trigger, content, arrow } = setup();
  const popover = createPopover({ trigger, content });
  popover.open();
  await popover.update();
  assert.equal(arrow.hasAttribute("data-arrow"), false);
  assert.equal(arrow.style.position, "");
  popover.destroy();
});

test("configured arrow is positioned, styled, and restored", async () => {
  const { trigger, content, arrow } = setup();
  const popover = createPopover({
    trigger,
    content,
    placement: "bottom",
    arrow: { element: arrow, size: 10 },
  });
  assert.equal(arrow.style.width, "10px");
  popover.open();
  await popover.update();
  assert.equal(arrow.dataset.side, "bottom");
  assert.equal(arrow.style.top, "-5px");
  assert.equal(arrow.getAttribute("aria-hidden"), "true");

  popover.setOptions({ arrow: null });
  assert.equal(arrow.hasAttribute("data-side"), false);
  assert.equal(arrow.style.width, "");
  popover.destroy();
});

test("tooltip arrow follows the placement", async () => {
  const { trigger, content, arrow } = setup();
  const tooltip = createTooltip({
    trigger,
    content,
    placement: "top",
    arrow: { element: arrow },
  });
  tooltip.open();
  await tooltip.update();
  assert.equal(arrow.dataset.side, "top");
  assert.equal(arrow.style.bottom, "-4px");
  tooltip.destroy();
});

test("dialogs ignore the arrow option", () => {
  const { trigger, content, arrow } = setup();
  const dialog = createDialog({ trigger, content, arrow: { element: arrow } });
  dialog.open();
  assert.equal(arrow.hasAttribute("data-arrow"), false);
  dialog.destroy();
});

test("animation is off by default: close hides immediately", () => {
  const { trigger, content } = setup();
  const calls = mockAnimate(content);
  const popover = createPopover({ trigger, content });
  popover.open();
  popover.close();
  assert.equal(content.hidden, true);
  assert.equal(calls.length, 0);
  popover.destroy();
});

test("animation plays on enter and defers hiding until exit finishes", async () => {
  const { trigger, content } = setup();
  const calls = mockAnimate(content);
  const popover = createPopover({
    trigger,
    content,
    placement: "bottom",
    portal: document.body,
    animation: { duration: 220, delay: 5, easing: "linear" },
  });
  popover.open();
  await popover.update();
  await tick();
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.options.duration, 220);
  assert.equal(calls[0]?.options.delay, 5);
  assert.equal(calls[0]?.options.easing, "linear");
  assert.equal(content.dataset.animating, "enter");

  calls[0]?.waapi.finish();
  await tick();
  assert.equal(content.dataset.animating, undefined);

  popover.close();
  assert.equal(popover.isOpen, false);
  assert.equal(content.dataset.state, "closed");
  assert.equal(content.dataset.animating, "exit");
  assert.equal(content.hidden, false);
  assert.equal(calls.length, 2);

  calls[1]?.waapi.finish();
  await tick();
  assert.equal(content.hidden, true);
  assert.equal(content.dataset.animating, undefined);
  popover.destroy();
});

test("reopening during exit cancels it and plays enter", async () => {
  const { trigger, content } = setup();
  const calls = mockAnimate(content);
  const popover = createPopover({ trigger, content, animation: true });
  popover.open();
  await popover.update();
  await tick();
  popover.close();
  assert.equal(content.hidden, false);
  popover.open();
  assert.equal(calls[1]?.waapi.cancelled, true);
  assert.equal(popover.isOpen, true);
  await popover.update();
  await tick();
  assert.equal(content.hidden, false);
  assert.equal(content.dataset.state, "open");
  assert.equal(calls.length >= 3, true);
  popover.destroy();
});

test("destroy mid-exit finishes immediately", async () => {
  const { trigger, content } = setup();
  mockAnimate(content);
  const popover = createPopover({ trigger, content, animation: true });
  popover.open();
  await popover.update();
  await tick();
  popover.close();
  popover.destroy();
  assert.equal(content.hidden, true);
});

test("dialog backdrop fades with the dialog", async () => {
  const { trigger, content } = setup();
  const backdrop = append<HTMLDivElement>("<div></div>");
  const dialogCalls = mockAnimate(content);
  const backdropCalls = mockAnimate(backdrop);
  const dialog = createDialog({ trigger, content, backdrop, animation: true });
  dialog.open();
  await tick();
  assert.equal(dialogCalls.length, 1);
  assert.equal(backdropCalls.length, 1);
  dialog.close();
  assert.equal(backdrop.hidden, false);
  dialogCalls[1]?.waapi.finish();
  await tick();
  assert.equal(backdrop.hidden, false);
  backdropCalls[1]?.waapi.finish();
  await tick();
  assert.equal(backdrop.hidden, true);
  assert.equal(content.hidden, true);
  dialog.destroy();
});

test("expand grows from the anchor edge and fades in and out", async () => {
  const { trigger, content } = setup();
  const calls: Array<{ keyframes: Keyframe[] }> = [];
  const finishers: Array<() => void> = [];
  (content as unknown as { animate: unknown }).animate = (
    keyframes: Keyframe[],
  ) => {
    calls.push({ keyframes });
    return {
      finished: new Promise<void>((resolve) => finishers.push(resolve)),
      cancel() {},
    };
  };
  const popover = createPopover({
    trigger,
    content,
    placement: "bottom-start",
    animation: { type: "expand", duration: 200 },
  });
  popover.open();
  await popover.update();
  await tick();
  const enter = calls[0]?.keyframes;
  assert.equal(enter?.[0]?.opacity, 0);
  assert.equal(enter?.[0]?.scale, "1 0");
  assert.equal(enter?.[0]?.transformOrigin, "left top");
  assert.equal(enter?.[1]?.opacity, 1);
  for (const finish of finishers.splice(0)) {
    finish();
  }
  popover.close();
  const exit = calls[1]?.keyframes;
  assert.equal(exit?.[0]?.opacity, 1);
  assert.equal(exit?.at(-1)?.opacity, 0);
  assert.equal(content.hidden, false);
  for (const finish of finishers.splice(0)) {
    finish();
  }
  await tick();
  assert.equal(content.hidden, true);
  popover.destroy();
});

test("custom keyframes animate with the placement context", async () => {
  const { trigger, content } = setup();
  const seen: string[] = [];
  (content as unknown as { animate: unknown }).animate = () => ({
    finished: new Promise<void>(() => {}),
    cancel() {},
  });
  const popover = createPopover({
    trigger,
    content,
    placement: "top",
    animation: {
      custom: {
        enter: (context) => {
          seen.push(`${context.side}:${context.transformOrigin}`);
          return [{ opacity: 0 }, { opacity: 1 }];
        },
      },
    },
  });
  popover.open();
  await popover.update();
  await tick();
  assert.deepEqual(seen, ["top:center bottom"]);
  popover.destroy();
});
