import {
  createTypeaheadBuffer,
  focusFirstMenuItem,
  focusLastMenuItem,
  focusMenuTypeahead,
  getMenuItems,
  moveMenuFocus,
} from "../menu/navigation.js";
import { getActiveElement } from "../focus/focus.js";
import type { ControllerHost } from "./host.js";

export type ContextMenuPoint = { x: number; y: number };

export type ContextMenuBehavior = {
  /** Explicit anchor point; `null` anchors to the trigger. */
  point: ContextMenuPoint | null;
  attach(): void;
  detach(): void;
  /** Forget typeahead input (called on every close). */
  reset(): void;
};

/** Pointer/keyboard invocation, item navigation, and selection for menus. */
export function createContextMenuBehavior(
  host: ControllerHost,
): ContextMenuBehavior {
  const typeahead = createTypeaheadBuffer();
  let keyboardInvokedAt = 0;

  const isMenu = (): boolean => host.getOptions().kind === "context-menu";

  const behavior: ContextMenuBehavior = {
    point: null,
    attach() {},
    detach() {},
    reset() {
      typeahead.clear();
    },
  };

  const onContextMenu = (event: MouseEvent): void => {
    if (host.isDisabled() || !isMenu()) {
      return;
    }
    if (
      event.button === 0 &&
      keyboardInvokedAt > 0 &&
      Date.now() - keyboardInvokedAt < 500
    ) {
      keyboardInvokedAt = 0;
      event.preventDefault();
      return;
    }
    event.preventDefault();
    behavior.point = { x: event.clientX, y: event.clientY };
    host.requestOpen("trigger");
  };

  const onTriggerKeyDown = (event: KeyboardEvent): void => {
    if (
      !isMenu() ||
      host.isDisabled() ||
      (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10"))
    ) {
      return;
    }
    event.preventDefault();
    keyboardInvokedAt = Date.now();
    behavior.point = null;
    host.requestOpen("trigger");
  };

  const onMenuKeyDown = (event: KeyboardEvent): void => {
    const { content } = host.getOptions();
    if (!isMenu() || event.defaultPrevented) {
      return;
    }
    const items = getMenuItems(content);
    if (items.length === 0) {
      return;
    }
    const active = getActiveElement(host.doc);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      moveMenuFocus(content, event.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      focusFirstMenuItem(content);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      focusLastMenuItem(content);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      if (active instanceof HTMLElement && items.includes(active)) {
        event.preventDefault();
        active.click();
      }
      return;
    }
    if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      focusMenuTypeahead(content, typeahead.push(event.key), active);
    }
  };

  const onMenuClick = (event: MouseEvent): void => {
    const options = host.getOptions();
    if (!isMenu() || event.defaultPrevented) {
      return;
    }
    const target = event.target as Element | null;
    const item = target?.closest<HTMLElement>(
      '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
    );
    if (!item || !options.content.contains(item)) {
      return;
    }
    if (
      item.getAttribute("aria-disabled") === "true" ||
      item.hasAttribute("disabled")
    ) {
      return;
    }
    options.onSelect?.(item, event);
    const role = item.getAttribute("role");
    if (role === "menuitem" && !item.hasAttribute("data-keep-open")) {
      host.requestClose("select");
    }
  };

  let bound: { trigger: HTMLElement; content: HTMLElement } | null = null;

  behavior.attach = () => {
    const { trigger, content } = host.getOptions();
    bound = { trigger, content };
    trigger.addEventListener("contextmenu", onContextMenu);
    trigger.addEventListener("keydown", onTriggerKeyDown);
    content.addEventListener("keydown", onMenuKeyDown);
    content.addEventListener("click", onMenuClick);
  };
  behavior.detach = () => {
    if (!bound) {
      return;
    }
    const { trigger, content } = bound;
    bound = null;
    trigger.removeEventListener("contextmenu", onContextMenu);
    trigger.removeEventListener("keydown", onTriggerKeyDown);
    content.removeEventListener("keydown", onMenuKeyDown);
    content.removeEventListener("click", onMenuClick);
  };

  return behavior;
}
