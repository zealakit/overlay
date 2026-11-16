import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { after, afterEach, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compile } from "svelte/compiler";
import { flushSync, mount, tick, unmount } from "svelte";
import { dispatchEscape, dispatchPointer, resetDom } from "./support/dom.ts";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const partsUrl = pathToFileURL(
  join(packageRoot, "dist", "parts", "index.js"),
).href;
const directory = mkdtempSync(join(packageRoot, "tests", "parts-"));
const mounted: Array<ReturnType<typeof mount>> = [];
let fixtureCount = 0;

afterEach(() => {
  for (const app of mounted.splice(0)) {
    unmount(app);
  }
  resetDom();
});

after(() => {
  rmSync(directory, { recursive: true, force: true });
});

async function render(
  markup: string,
  script = "",
  props: Record<string, unknown> = {},
): Promise<void> {
  fixtureCount += 1;
  const source = `
    <script>
      import {
        ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger,
        Dialog, DialogBackdrop, DialogClose, DialogContent, DialogDescription,
        DialogTitle, DialogTrigger,
        Popover, PopoverClose, PopoverContent, PopoverTrigger,
        Tooltip, TooltipContent, TooltipTrigger,
      } from "${partsUrl}";
      let props = $props();
      ${script}
    </script>
    ${markup}
  `;
  const compiled = compile(source, {
    generate: "client",
    dev: true,
    filename: `fixture-${fixtureCount}.svelte`,
  });
  const file = join(directory, `fixture-${fixtureCount}.mjs`);
  writeFileSync(file, compiled.js.code, "utf8");
  const module = (await import(pathToFileURL(file).href)) as {
    default: Parameters<typeof mount>[0];
  };
  const target = document.createElement("div");
  document.body.append(target);
  mounted.push(mount(module.default, { target, props }));
  flushSync();
  await tick();
}

function click(element: Element): void {
  element.dispatchEvent(
    new window.MouseEvent("click", { bubbles: true, cancelable: true }),
  );
}

function byId(id: string): HTMLElement {
  const element = document.getElementById(id);
  assert.ok(element, `#${id} should exist`);
  return element;
}

test("Popover parts open on click and close on Escape, outside press, and PopoverClose", async () => {
  await render(`
    <Popover>
      <PopoverTrigger id="trigger">Open</PopoverTrigger>
      <PopoverContent id="content">
        Body <PopoverClose id="close">Close</PopoverClose>
      </PopoverContent>
    </Popover>
  `);
  const trigger = byId("trigger");
  const content = byId("content");
  assert.equal(content.hidden, true);
  assert.equal(trigger.getAttribute("type"), "button");

  click(trigger);
  await tick();
  assert.equal(content.hidden, false);
  assert.equal(trigger.getAttribute("aria-expanded"), "true");

  dispatchEscape(document);
  await tick();
  assert.equal(content.hidden, true);

  click(trigger);
  await tick();
  dispatchPointer(document.body);
  await tick();
  assert.equal(content.hidden, true);

  click(trigger);
  await tick();
  click(byId("close"));
  await tick();
  assert.equal(content.hidden, true);
});

test("Popover supports bind:open", async () => {
  const seen: boolean[] = [];
  await render(
    `
    <Popover bind:open onOpenChange={(value) => props.record(value)}>
      <PopoverTrigger id="trigger">Open</PopoverTrigger>
      <PopoverContent id="content">Body</PopoverContent>
    </Popover>
    <button id="external" onclick={() => (open = false)}>External</button>
  `,
    "let open = $state(false);",
    { record: (value: boolean) => seen.push(value) },
  );
  const content = byId("content");

  click(byId("trigger"));
  await tick();
  assert.deepEqual(seen, [true]);
  assert.equal(content.hidden, false);

  click(byId("external"));
  await tick();
  await tick();
  assert.equal(content.hidden, true);
});

test("Dialog parts wire title, description, backdrop, and close", async () => {
  await render(`
    <Dialog>
      <DialogTrigger id="trigger">Edit profile</DialogTrigger>
      <DialogBackdrop id="backdrop" />
      <DialogContent id="content">
        <DialogTitle id="title">Edit profile</DialogTitle>
        <DialogDescription id="description">Update your profile information.</DialogDescription>
        <DialogClose id="close">Cancel</DialogClose>
      </DialogContent>
    </Dialog>
  `);
  const content = byId("content");
  const backdrop = byId("backdrop");
  assert.equal(content.getAttribute("aria-labelledby"), "title");
  assert.equal(content.getAttribute("aria-describedby"), "description");

  click(byId("trigger"));
  await tick();
  assert.equal(content.getAttribute("role"), "dialog");
  assert.equal(content.getAttribute("aria-modal"), "true");
  assert.equal(content.hidden, false);
  assert.equal(backdrop.hidden, false);

  click(byId("close"));
  await tick();
  assert.equal(content.hidden, true);
  assert.equal(backdrop.hidden, true);
});

test("Tooltip parts open on hover with role tooltip", async () => {
  await render(`
    <Tooltip delay={0} closeDelay={0}>
      <TooltipTrigger id="trigger">Info</TooltipTrigger>
      <TooltipContent id="content">Hint</TooltipContent>
    </Tooltip>
  `);
  const trigger = byId("trigger");
  const content = byId("content");
  const enter = new window.PointerEvent("pointerenter", { bubbles: true });
  Object.defineProperty(enter, "pointerType", { value: "mouse" });
  trigger.dispatchEvent(enter);
  await tick();
  assert.equal(content.hidden, false);
  assert.equal(content.getAttribute("role"), "tooltip");
  assert.match(trigger.getAttribute("aria-describedby") ?? "", /content/);
});

test("ContextMenu parts open on contextmenu and select items", async () => {
  const selected: string[] = [];
  await render(
    `
    <ContextMenu>
      <ContextMenuTrigger id="trigger">Edit profile</ContextMenuTrigger>
      <ContextMenuContent id="content">
        <ContextMenuItem id="edit" onselect={() => props.record("edit")}>Edit</ContextMenuItem>
        <ContextMenuItem id="off" disabled onselect={() => props.record("off")}>Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  `,
    "",
    { record: (value: string) => selected.push(value) },
  );
  const trigger = byId("trigger");
  const content = byId("content");
  assert.equal(trigger.getAttribute("tabindex"), "0");

  trigger.dispatchEvent(
    new window.MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 10,
      clientY: 20,
    }),
  );
  await tick();
  assert.equal(content.hidden, false);
  assert.equal(content.getAttribute("role"), "menu");

  click(byId("off"));
  await tick();
  assert.deepEqual(selected, []);
  assert.equal(content.hidden, false);

  click(byId("edit"));
  await tick();
  assert.deepEqual(selected, ["edit"]);
  assert.equal(content.hidden, true);
});

test("parts throw a clear error outside their root", async () => {
  const originalError = console.error;
  console.error = () => {};
  try {
    await assert.rejects(
      render(`<PopoverTrigger>Open</PopoverTrigger>`),
      /must be used inside an overlay root/,
    );
  } finally {
    console.error = originalError;
  }
});
