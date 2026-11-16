import {
  type AnimationSetting,
  type OverlayController,
  type OverlayControllerKind,
  type Placement,
  type Strategy,
  createOverlayController,
  isBrowser,
} from "@zealakit/overlay-core";

export type OverlayInstances = {
  /** Number of overlays created by this call. */
  readonly size: number;
  /** Find a controller by host id or by the host element. */
  get(target: string | Element): OverlayController | undefined;
  /** Initialize hosts added since the last call and destroy removed ones. */
  refresh(): void;
  /** Destroy every controller created by this call. Safe to repeat. */
  destroy(): void;
};

type Entry = { controller: OverlayController; stop: () => void };

/** Hosts that already own a controller; guards against double initialization. */
const initialized = new WeakMap<Element, Entry>();

const KINDS: readonly OverlayControllerKind[] = [
  "popover",
  "tooltip",
  "dialog",
  "context-menu",
];

function number(value: string | undefined): number | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function flag(value: string | undefined): boolean | undefined {
  return value === undefined ? undefined : value !== "false";
}

function animation(data: DOMStringMap): AnimationSetting | undefined {
  const value = data.animation;
  if (value === undefined || value === "false") {
    return undefined;
  }
  if (value === "" || value === "true") {
    const duration = number(data.animationDuration);
    return duration === undefined ? true : { duration };
  }
  if (value === "fade" || value === "expand") {
    return { type: value, duration: number(data.animationDuration) };
  }
  return true;
}

function portal(data: DOMStringMap): Element | null {
  if (data.portal === "inline") {
    return null;
  }
  if (data.portal?.startsWith("#")) {
    return document.querySelector(data.portal) ?? document.body;
  }
  return document.body;
}

function initialFocus(
  value: string | undefined,
): "container" | "first" | null | undefined {
  if (value === "none") {
    return null;
  }
  return value === "container" || value === "first" ? value : undefined;
}

let counter = 0;

function ensureId(element: Element, prefix: string): string {
  if (!element.id) {
    counter += 1;
    element.id = `${prefix}-${counter}`;
  }
  return element.id;
}

function create(host: HTMLElement): Entry | null {
  const kind = host.dataset.overlay as OverlayControllerKind;
  if (!KINDS.includes(kind)) {
    return null;
  }
  const backdrop = host.querySelector<HTMLElement>(":scope > [data-backdrop]");
  const content =
    host.querySelector<HTMLElement>(":scope > [data-content]") ??
    backdrop?.querySelector<HTMLElement>("[data-content]") ??
    null;
  if (!content) {
    return null;
  }
  const data = host.dataset;

  let trigger = host.querySelector<HTMLElement>(":scope > [data-trigger]");
  let standIn: HTMLButtonElement | null = null;
  if (!trigger) {
    // Programmatic use without a trigger: a hidden stand-in anchors the overlay.
    standIn = document.createElement("button");
    standIn.type = "button";
    standIn.hidden = true;
    host.prepend(standIn);
    trigger = standIn;
  }

  const arrowElement = content.querySelector<HTMLElement>("[data-arrow]");
  const title = content.querySelector<HTMLElement>("[data-title]");
  const description = content.querySelector<HTMLElement>("[data-description]");
  if (title && kind !== "tooltip") {
    content.setAttribute("aria-labelledby", ensureId(title, "overlay-title"));
  }
  if (description && kind !== "tooltip") {
    content.setAttribute(
      "aria-describedby",
      ensureId(description, "overlay-description"),
    );
  }
  for (const item of content.querySelectorAll<HTMLElement>("[data-item]")) {
    item.setAttribute("role", "menuitem");
    if (item.dataset.disabled !== undefined) {
      item.setAttribute("aria-disabled", "true");
    }
  }

  const controller = createOverlayController({
    kind,
    trigger,
    content,
    backdrop,
    defaultOpen: data.defaultOpen !== undefined && data.defaultOpen !== "false",
    disabled: data.disabled !== undefined && data.disabled !== "false",
    placement: data.placement as Placement | undefined,
    offset: number(data.offset),
    alignOffset: number(data.alignOffset),
    flip: flag(data.flip),
    shift: flag(data.shift),
    padding: number(data.padding),
    strategy: data.strategy as Strategy | undefined,
    autoUpdate: flag(data.autoUpdate),
    dir: data.dir === "rtl" || data.dir === "ltr" ? data.dir : undefined,
    dismissOnEscape: flag(data.dismissOnEscape),
    dismissOnOutsidePress: flag(data.dismissOnOutsidePress),
    portal: portal(data),
    animation: animation(data),
    arrow: arrowElement
      ? { element: arrowElement, size: number(data.arrowSize) }
      : null,
    delay: number(data.delay),
    closeDelay: number(data.closeDelay),
    hoverableContent: flag(data.hoverableContent),
    modal: flag(data.modal),
    lockScroll: flag(data.lockScroll),
    trapFocus: flag(data.trapFocus),
    initialFocus: initialFocus(data.initialFocus),
    restoreFocus: flag(data.restoreFocus),
    onOpenChange: (open, reason) => {
      host.dispatchEvent(
        new CustomEvent("overlay-change", {
          bubbles: true,
          detail: { open, reason },
        }),
      );
    },
    onSelect: (item, event) => {
      host.dispatchEvent(
        new CustomEvent("overlay-select", {
          bubbles: true,
          detail: { item, event },
        }),
      );
    },
  });

  // `[data-close]` buttons that belong to this overlay's content close it.
  const onContentClick = (event: MouseEvent): void => {
    const target = (event.target as Element | null)?.closest("[data-close]");
    if (target && target.closest("[data-content]") === content) {
      controller.close();
    }
  };
  content.addEventListener("click", onContentClick);

  return {
    controller,
    stop() {
      content.removeEventListener("click", onContentClick);
      controller.destroy();
      standIn?.remove();
    },
  };
}

/**
 * Turn `[data-overlay]` markup into overlay controllers.
 *
 * ```html
 * <div data-overlay="popover" data-placement="bottom-start">
 *   <button data-trigger>Open</button>
 *   <div data-content hidden>…<button data-close>Close</button></div>
 * </div>
 * ```
 *
 * A dialog may wrap its content in `[data-backdrop]`; the wrapper then portals
 * and toggles as one unit.
 *
 * Hosts that already own a controller are skipped, so repeated calls are
 * safe. Call `refresh()` after adding or removing markup.
 */
export function initOverlays(root: ParentNode = document): OverlayInstances {
  const owned = new Set<Element>();

  const refresh = (): void => {
    if (!isBrowser()) {
      return;
    }
    for (const host of owned) {
      if (!host.isConnected) {
        initialized.get(host)?.stop();
        initialized.delete(host);
        owned.delete(host);
      }
    }
    for (const host of root.querySelectorAll<HTMLElement>("[data-overlay]")) {
      if (initialized.has(host)) {
        continue;
      }
      const entry = create(host);
      if (entry) {
        initialized.set(host, entry);
        owned.add(host);
      }
    }
  };

  refresh();

  return {
    get size() {
      return owned.size;
    },
    get(target) {
      const host =
        typeof target === "string" ? document.getElementById(target) : target;
      return host && owned.has(host)
        ? initialized.get(host)?.controller
        : undefined;
    },
    refresh,
    destroy() {
      for (const host of owned) {
        initialized.get(host)?.stop();
        initialized.delete(host);
      }
      owned.clear();
    },
  };
}
