import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { defineComponent, effectScope, h, nextTick, ref } from "vue";
import type { MaybeRefOrGetter } from "vue";
import type {
  DismissReason,
  LayerStack,
  LayerStackHandle,
} from "@zealakit/overlay-core";
import { createLayerStack } from "@zealakit/overlay-core";
import { enableAutoUnmount, mount } from "@vue/test-utils";
import { useLayer } from "../dist/index.js";
import {
  dispatchEscape,
  dispatchPointer,
  resetDom,
  trackDocumentListeners,
  waitFor,
} from "./support/dom.ts";

enableAutoUnmount(afterEach);

afterEach(() => {
  resetDom();
});

type LayerViewOptions = {
  stack?: MaybeRefOrGetter<LayerStack | null | undefined>;
  dismissOnEscape?: MaybeRefOrGetter<boolean | undefined>;
  dismissOnOutsidePress?: MaybeRefOrGetter<boolean | undefined>;
  onDismiss?: (reason: DismissReason) => void;
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  parent?: MaybeRefOrGetter<LayerStackHandle | null | undefined>;
};

function createLayerView(options: LayerViewOptions) {
  return defineComponent({
    setup() {
      const element = ref<HTMLDivElement | null>(null);
      const reference = ref<HTMLButtonElement | null>(null);
      const layer = useLayer({
        element,
        reference,
        stack: options.stack,
        parent: options.parent,
        dismissOnEscape: options.dismissOnEscape,
        dismissOnOutsidePress: options.dismissOnOutsidePress,
        onDismiss: options.onDismiss,
        disabled: options.disabled,
      });

      return () =>
        h("div", null, [
          h("button", { ref: reference, id: "trigger", type: "button" }),
          h("div", { ref: element, id: "panel" }),
          h(
            "output",
            { id: "state" },
            `${layer.id.value ?? "none"}:${String(layer.isTopmost.value)}`,
          ),
        ]);
    },
  });
}

test("registers a layer and removes it on unmount", async () => {
  const stack = createLayerStack({ document });
  const wrapper = mount(createLayerView({ stack }), {
    attachTo: document.body,
  });

  await waitFor(() => {
    assert.equal(stack.size, 1);
  });
  assert.match(wrapper.get("#state").text(), /^layer-\d+:true$/);

  wrapper.unmount();
  assert.equal(stack.size, 0);
  stack.dispose();
});

test("cleans up when an effect scope is disposed", () => {
  const stack = createLayerStack({ document });
  const element = ref<HTMLDivElement | null>(document.createElement("div"));
  document.body.append(element.value as HTMLDivElement);

  const scope = effectScope();
  const layer = scope.run(() => useLayer({ element, stack }));
  assert.ok(layer);
  assert.equal(stack.size, 1);

  scope.stop();
  assert.equal(stack.size, 0);
  stack.dispose();
});

test("supports nested layers and tracks the topmost layer", async () => {
  const stack = createLayerStack({ document });
  const parentElement = ref<HTMLDivElement | null>(null);
  const childElement = ref<HTMLDivElement | null>(null);
  const parentTriggers: DismissReason[] = [];
  const childTriggers: DismissReason[] = [];

  const wrapper = mount(
    defineComponent({
      setup() {
        const parent = useLayer({
          element: parentElement,
          stack,
          onDismiss: (reason) => parentTriggers.push(reason),
        });
        const child = useLayer({
          element: childElement,
          parent: parent.handle,
          stack,
          onDismiss: (reason) => childTriggers.push(reason),
        });

        return () =>
          h("div", null, [
            h("div", { ref: parentElement, id: "parent-panel" }),
            h("div", { ref: childElement, id: "child-panel" }),
            h("output", { id: "parent" }, parent.id.value ?? "none"),
            h("output", { id: "child" }, child.id.value ?? "none"),
            h("output", { id: "child-topmost" }, String(child.isTopmost.value)),
          ]);
      },
    }),
    { attachTo: document.body },
  );

  await waitFor(() => {
    assert.equal(stack.size, 2);
  });
  assert.equal(stack.getTopmost()?.id, wrapper.get("#child").text());
  assert.equal(wrapper.get("#child-topmost").text(), "true");

  dispatchEscape();
  assert.deepEqual(childTriggers, ["escape-key"]);
  assert.equal(parentTriggers.length, 0);

  wrapper.unmount();
  assert.equal(stack.size, 0);
  stack.dispose();
});

test("routes outside presses to the topmost layer and ignores the reference", async () => {
  const stack = createLayerStack({ document });
  const calls: DismissReason[] = [];
  const outside = document.createElement("p");
  document.body.append(outside);

  const wrapper = mount(
    createLayerView({
      stack,
      onDismiss: (reason) => calls.push(reason),
    }),
    { attachTo: document.body },
  );

  await waitFor(() => {
    assert.equal(stack.size, 1);
  });

  const trigger = wrapper.get("#trigger").element;
  dispatchPointer(trigger);
  dispatchPointer(outside, { button: 2 });
  assert.equal(calls.length, 0);

  dispatchPointer(outside);
  assert.deepEqual(calls, ["outside-press"]);

  stack.dispose();
});

test("reactive policy and disabled flags re-register safely", async () => {
  const stack = createLayerStack({ document });
  const calls: DismissReason[] = [];
  const escapeAllowed = ref(false);
  const disabled = ref(false);

  const wrapper = mount(
    createLayerView({
      stack,
      dismissOnEscape: escapeAllowed,
      disabled,
      onDismiss: (reason) => calls.push(reason),
    }),
    { attachTo: document.body },
  );

  await waitFor(() => {
    assert.equal(stack.size, 1);
  });

  dispatchEscape();
  assert.equal(calls.length, 0);

  disabled.value = true;
  await waitFor(() => {
    assert.equal(stack.size, 0);
  });

  disabled.value = false;
  escapeAllowed.value = true;
  await waitFor(() => {
    assert.equal(stack.size, 1);
  });

  dispatchEscape();
  assert.deepEqual(calls, ["escape-key"]);

  wrapper.unmount();
  stack.dispose();
});

test("layers without a stack share document listeners", async (t) => {
  const tracker = trackDocumentListeners();
  t.after(() => tracker.restore());
  const calls: DismissReason[] = [];

  const FirstLayer = createLayerView({
    onDismiss: (reason) => calls.push(reason),
  });
  const SecondLayer = createLayerView({
    onDismiss: (reason) => calls.push(reason),
  });

  const wrapper = mount(
    defineComponent({
      setup: () => () => h("div", null, [h(FirstLayer), h(SecondLayer)]),
    }),
    { attachTo: document.body },
  );

  await waitFor(() => {
    assert.equal(tracker.counts.keydownAdds, 1);
    assert.equal(tracker.counts.pointerdownAdds, 1);
  });

  dispatchEscape();
  assert.equal(calls.length, 1);

  wrapper.unmount();
  assert.equal(tracker.counts.keydownRemoves, 1);
  assert.equal(tracker.counts.pointerdownRemoves, 1);
  await nextTick();
});
