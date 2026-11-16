import type { OverlayChangeReason, OverlayControllerOptions } from "./types.js";

/** What a behavior module may ask of the controller that owns it. */
export type ControllerHost = {
  readonly doc: Document;
  getOptions(): OverlayControllerOptions;
  isDisabled(): boolean;
  isOpen(): boolean;
  requestOpen(reason?: OverlayChangeReason): void;
  requestClose(reason?: OverlayChangeReason): void;
};
