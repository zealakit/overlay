import { Window } from "happy-dom";

/**
 * Minimal DOM registration for core tests. Runs via `node --import` before the
 * test modules, so importing core never sees browser globals in production and
 * tests still get a real-enough DOM.
 */
const window = new Window({ url: "http://localhost/" });

const globals = globalThis as unknown as Record<string, unknown>;
globals.window = window;
globals.document = window.document;
globals.Element = window.Element;
globals.HTMLElement = window.HTMLElement;
globals.Node = window.Node;
globals.getComputedStyle = window.getComputedStyle.bind(window);
