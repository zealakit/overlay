import assert from "node:assert/strict";
import { test } from "node:test";
import { createPositioner } from "../dist/index.js";
import type { PositionerOptions } from "../dist/index.js";
import { setBox, setViewport } from "./support/dom.ts";

setViewport(1280, 720);

function pair(parent: HTMLElement = document.body) {
  const reference = document.createElement("button");
  const floating = document.createElement("div");
  parent.append(reference);
  document.body.append(floating);
  setBox(reference, { x: 100, y: 100, width: 80, height: 30 });
  setBox(floating, { x: 0, y: 0, width: 120, height: 60 });
  return { reference, floating };
}

async function strategyFor(
  reference: Element | { getBoundingClientRect: () => DOMRect },
  floating: HTMLElement,
  strategy?: PositionerOptions["strategy"],
) {
  const positioner = createPositioner({
    reference: reference as Element,
    floating,
    autoUpdate: false,
    ...(strategy ? { strategy } : {}),
  });
  const result = await positioner.update();
  positioner.dispose();
  assert.ok(result);
  return result.strategy;
}

test("defaults to absolute so the popup scrolls with the page", async () => {
  const { reference, floating } = pair();
  assert.equal(await strategyFor(reference, floating), "absolute");
});

test("uses fixed when the anchor is inside a fixed ancestor", async () => {
  const bar = document.createElement("div");
  bar.style.position = "fixed";
  document.body.append(bar);
  const { reference, floating } = pair(bar);
  assert.equal(await strategyFor(reference, floating), "fixed");
});

test("uses fixed when the anchor is inside a sticky ancestor", async () => {
  const header = document.createElement("div");
  header.style.position = "sticky";
  document.body.append(header);
  const { reference, floating } = pair(header);
  assert.equal(await strategyFor(reference, floating), "fixed");
});

test("uses fixed for a bare viewport point", async () => {
  const floating = document.createElement("div");
  document.body.append(floating);
  setBox(floating, { x: 0, y: 0, width: 120, height: 60 });
  const point = {
    getBoundingClientRect: () =>
      ({
        x: 40,
        y: 50,
        width: 0,
        height: 0,
        top: 50,
        left: 40,
        right: 40,
        bottom: 50,
        toJSON: () => ({}),
      }) as DOMRect,
  };
  assert.equal(await strategyFor(point, floating), "fixed");
});

test("a virtual anchor with a contextElement follows that element", async () => {
  const { reference, floating } = pair();
  const virtual = {
    getBoundingClientRect: () => reference.getBoundingClientRect(),
    contextElement: reference,
  };
  assert.equal(await strategyFor(virtual, floating), "absolute");
});

test("an explicit strategy always wins", async () => {
  const { reference, floating } = pair();
  assert.equal(await strategyFor(reference, floating, "fixed"), "fixed");
  const bar = document.createElement("div");
  bar.style.position = "fixed";
  document.body.append(bar);
  const second = pair(bar);
  assert.equal(
    await strategyFor(second.reference, second.floating, "absolute"),
    "absolute",
  );
});
