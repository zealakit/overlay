import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { defineComponent, h } from "vue";
import type { LayerStack } from "@zealakit/overlay-core";
import { createLayerStack } from "@zealakit/overlay-core";
import { enableAutoUnmount, mount } from "@vue/test-utils";
import { useOverlay } from "../dist/index.js";
import {
  dispatchEscape,
  dispatchPointer,
  resetDom,
  setBox,
  waitFor,
} from "./support/dom.ts";

enableAutoUnmount(afterEach);

afterEach(() => {
  resetDom();
});

function createOverlayView(options: {
  stack: LayerStack;
  defaultOpen?: boolean;
}) {
  const view = defineComponent({
    setup() {
      const overlay = useOverlay({
        stack: options.stack,
        defaultOpen: options.defaultOpen ?? false,
        autoUpdate: false,
        placement: "bottom-start",
        offset: 8,
        flip: false,
        shift: false,
      });
      return () =>
        h("div", null, [
          h("button", {
            ref: overlay.referenceRef,
            id: "trigger",
            type: "button",
            onClick: overlay.toggle,
          }),
          h("div", {
            ref: overlay.floatingRef,
            id: "panel",
            style: overlay.floatingStyles.value,
          }),
          h(
            "button",
            { id: "open", type: "button", onClick: overlay.open },
            "open",
          ),
          h("output", { id: "state" }, String(overlay.isOpen.value)),
          h("output", { id: "placement" }, overlay.placement.value),
        ]);
    },
  });

  return { view };
}

test("opens, positions, and registers a layer", async () => {
  const stack = createLayerStack({ document });
  const { view } = createOverlayView({ stack });
  const wrapper = mount(view, { attachTo: document.body });

  const trigger = wrapper.get("#trigger").element;
  const panel = wrapper.get("#panel").element;
  setBox(trigger, { x: 10, y: 20, width: 100, height: 40 });
  setBox(panel, { x: 0, y: 0, width: 200, height: 80 });

  await wrapper.get("#open").trigger("click");

  await waitFor(() => {
    assert.equal(wrapper.get("#state").text(), "true");
    assert.equal(stack.size, 1);
  });

  await waitFor(() => {
    assert.equal((panel as HTMLElement).style.left, "10px");
    assert.equal((panel as HTMLElement).style.top, "68px");
    assert.equal(wrapper.get("#placement").text(), "bottom-start");
  });

  stack.dispose();
});

test("closes on Escape and removes its layer", async () => {
  const stack = createLayerStack({ document });
  const { view } = createOverlayView({ stack });
  const wrapper = mount(view, { attachTo: document.body });

  await wrapper.get("#open").trigger("click");
  await waitFor(() => {
    assert.equal(wrapper.get("#state").text(), "true");
    assert.equal(stack.size, 1);
  });

  dispatchEscape();

  await waitFor(() => {
    assert.equal(wrapper.get("#state").text(), "false");
    assert.equal(stack.size, 0);
  });

  stack.dispose();
});

test("closes on an outside pointer press", async () => {
  const stack = createLayerStack({ document });
  const outside = document.createElement("p");
  document.body.append(outside);
  const { view } = createOverlayView({ stack });
  const wrapper = mount(view, { attachTo: document.body });

  await wrapper.get("#open").trigger("click");
  await waitFor(() => {
    assert.equal(wrapper.get("#state").text(), "true");
  });

  dispatchPointer(outside);

  await waitFor(() => {
    assert.equal(wrapper.get("#state").text(), "false");
  });

  stack.dispose();
});

test("supports defaultOpen and cleans up on unmount", async () => {
  const stack = createLayerStack({ document });
  const { view } = createOverlayView({ stack, defaultOpen: true });
  const wrapper = mount(view, { attachTo: document.body });

  await waitFor(() => {
    assert.equal(wrapper.get("#state").text(), "true");
    assert.equal(stack.size, 1);
  });

  wrapper.unmount();
  assert.equal(stack.size, 0);
  stack.dispose();
});
