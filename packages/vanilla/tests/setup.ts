import { Window } from "happy-dom";

/**
 * Register a DOM for vanilla adapter tests before they import the built
 * package. Core itself never needs browser globals at import time.
 */
const window = new Window({ url: "http://localhost/" });

const globals = globalThis as unknown as Record<string, unknown>;
globals.window = window;
globals.document = window.document;
globals.Element = window.Element;
globals.HTMLElement = window.HTMLElement;
globals.Node = window.Node;
globals.CustomEvent = window.CustomEvent;
globals.KeyboardEvent = window.KeyboardEvent;
globals.getComputedStyle = window.getComputedStyle.bind(window);
