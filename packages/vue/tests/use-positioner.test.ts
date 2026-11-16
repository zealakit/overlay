import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { defineComponent, h, nextTick, ref } from "vue";
import type { Placement } from "@zealakit/overlay-core";
import { enableAutoUnmount, mount } from "@vue/test-utils";
import { usePositioner } from "../dist/index.js";
import { resetDom, setBox, waitFor } from "./support/dom.ts";

enableAutoUnmount(afterEach);

afterEach(() => {
  resetDom();
});

test("positions mounted elements and exposes a reactive result", async () => {
  const reference = ref<HTMLElement | null>(null);
  const floating = ref<HTMLElement | null>(null);
  const controls: { update: (() => Promise<unknown>) | null } = {
    update: null,
  };

  const wrapper = mount(
    defineComponent({
      setup() {
        const { result, update: runUpdate } = usePositioner({
          reference,
          floating,
          autoUpdate: false,
          placement: "bottom-start",
          offset: 8,
          flip: false,
          shift: false,
        });
        controls.update = runUpdate;

        return () =>
          h("div", null, [
            h("button", { ref: reference, id: "trigger", type: "button" }),
            h("div", { ref: floating, id: "panel" }),
            h(
              "output",
              { id: "result" },
              result.value
                ? `${result.value.x},${result.value.y},${result.value.placement}`
                : "none",
            ),
          ]);
      },
    }),
    { attachTo: document.body },
  );

  await nextTick();
  const trigger = wrapper.get("#trigger").element as HTMLElement;
  const panel = wrapper.get("#panel").element as HTMLElement;
  assert.ok(trigger);
  assert.ok(panel);
  setBox(trigger, { x: 10, y: 20, width: 100, height: 40 });
  setBox(panel, { x: 0, y: 0, width: 200, height: 80 });

  const runUpdate = controls.update;
  assert.ok(runUpdate);
  await runUpdate();
  await nextTick();

  assert.equal(wrapper.get("#result").text(), "10,68,bottom-start");
});

test("reacts to option changes", async () => {
  const reference = ref<HTMLElement | null>(null);
  const floating = ref<HTMLElement | null>(null);
  const placement = ref<Placement>("bottom-start");

  const wrapper = mount(
    defineComponent({
      setup() {
        const { result } = usePositioner({
          reference,
          floating,
          placement,
          autoUpdate: false,
          offset: 8,
          flip: false,
          shift: false,
        });

        return () =>
          h("div", null, [
            h("button", { ref: reference, id: "trigger", type: "button" }),
            h("div", { ref: floating, id: "panel" }),
            h("output", { id: "placement" }, result.value?.placement ?? "none"),
          ]);
      },
    }),
    { attachTo: document.body },
  );

  await nextTick();
  const trigger = wrapper.get("#trigger").element as HTMLElement;
  const panel = wrapper.get("#panel").element as HTMLElement;
  assert.ok(trigger);
  assert.ok(panel);
  setBox(trigger, { x: 10, y: 20, width: 100, height: 40 });
  setBox(panel, { x: 0, y: 0, width: 200, height: 80 });

  await waitFor(() => {
    assert.equal(wrapper.get("#placement").text(), "bottom-start");
  });

  placement.value = "right-start";

  await waitFor(() => {
    assert.equal(wrapper.get("#placement").text(), "right-start");
  });
});

test("reacts to dynamic element references", async () => {
  const reference = ref<HTMLElement | null>(null);
  const floating = ref<HTMLElement | null>(null);
  const controls: { update: (() => Promise<unknown>) | null } = {
    update: null,
  };

  const wrapper = mount(
    defineComponent({
      setup() {
        const { result, update: runUpdate } = usePositioner({
          reference,
          floating,
          autoUpdate: false,
          placement: "bottom-start",
          offset: 8,
          flip: false,
          shift: false,
        });
        controls.update = runUpdate;

        return () =>
          h("div", null, [
            h("button", { id: "trigger", type: "button" }),
            h("div", { ref: floating, id: "panel" }),
            h("output", { id: "x" }, String(result.value?.x ?? -1)),
          ]);
      },
    }),
    { attachTo: document.body },
  );

  await nextTick();
  const trigger = wrapper.get("#trigger").element as HTMLElement;
  const panel = wrapper.get("#panel").element as HTMLElement;
  assert.ok(trigger);
  assert.ok(panel);
  setBox(trigger, { x: 10, y: 20, width: 100, height: 40 });
  setBox(panel, { x: 0, y: 0, width: 200, height: 80 });
  reference.value = trigger;

  const runUpdate = controls.update;
  assert.ok(runUpdate);
  await runUpdate();
  await waitFor(() => {
    assert.equal(wrapper.get("#x").text(), "10");
  });

  const replacement = document.createElement("button");
  document.body.append(replacement);
  setBox(replacement, { x: 300, y: 100, width: 50, height: 20 });
  reference.value = replacement;

  await waitFor(() => {
    assert.equal(wrapper.get("#x").text(), "300");
  });
});

test("does not update reactive state for unchanged measurements", async () => {
  const reference = ref<HTMLElement | null>(null);
  const floating = ref<HTMLElement | null>(null);
  const controls: { update: (() => Promise<unknown>) | null } = {
    update: null,
  };
  let renders = 0;

  const wrapper = mount(
    defineComponent({
      setup() {
        const { result, update: runUpdate } = usePositioner({
          reference,
          floating,
          autoUpdate: false,
          placement: "bottom-start",
          flip: false,
          shift: false,
        });
        controls.update = runUpdate;

        return () => {
          renders += 1;
          return h("div", null, [
            h("button", { ref: reference, id: "trigger", type: "button" }),
            h("div", { ref: floating, id: "panel" }),
            h("output", { id: "x" }, String(result.value?.x ?? -1)),
          ]);
        };
      },
    }),
    { attachTo: document.body },
  );

  await nextTick();
  const trigger = wrapper.get("#trigger").element as HTMLElement;
  const panel = wrapper.get("#panel").element as HTMLElement;
  assert.ok(trigger);
  assert.ok(panel);
  setBox(trigger, { x: 10, y: 20, width: 100, height: 40 });
  setBox(panel, { x: 0, y: 0, width: 200, height: 80 });

  const runUpdate = controls.update;
  assert.ok(runUpdate);
  await runUpdate();
  await waitFor(() => {
    assert.equal(wrapper.get("#x").text(), "10");
  });

  const rendersAfterFirstMeasurement = renders;
  assert.ok(controls.update);
  await controls.update();
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(renders, rendersAfterFirstMeasurement);
});
