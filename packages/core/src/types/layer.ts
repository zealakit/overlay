import type { DismissReason } from "./dismissal.js";
import type { Cleanup } from "./lifecycle.js";

export type LayerStatus = "open" | "closed";

/**
 * Declarative configuration for a layer. Adapters translate these flags into
 * framework-specific wiring; core only stores and exposes them.
 */
export type LayerConfig = {
  defaultOpen?: boolean;
  dismissOnEscape?: boolean;
  dismissOnOutsidePress?: boolean;
};

export type ResolvedLayerConfig = Required<LayerConfig>;

export type LayerEvent =
  | { type: "open"; status: "open" }
  | { type: "close"; status: "closed"; reason: DismissReason };

export type LayerListener = (event: LayerEvent) => void;

/**
 * Framework-free open/closed lifecycle. It owns no DOM and no listeners besides
 * its own subscribers, so it is safe to create during many render phases.
 */
export type Layer = {
  readonly status: LayerStatus;
  readonly config: Readonly<ResolvedLayerConfig>;
  open(): void;
  close(reason?: DismissReason): void;
  toggle(): void;
  subscribe(listener: LayerListener): () => void;
  destroy(): void;
};

/** Snapshot entry for one registered layer. */
export type LayerEntry = {
  readonly id: string;
  readonly parentId: string | null;
};

/**
 * Element (or lazy element getter) used for outside-interaction detection.
 * Getter form supports elements that change over time.
 */
export type LayerElementSource = Element | (() => Element | null) | null;

/**
 * Additional elements that belong to a layer's interaction boundary.
 * The primary `element` and `reference` are always included.
 */
export type LayerBoundarySource =
  | LayerElementSource
  | readonly LayerElementSource[];

export type RegisterLayerOptions = {
  /** Defaults to a manager-local incrementing id. */
  id?: string;
  parentId?: string | null;
  element?: LayerElementSource;
};

export type LayerHandle = {
  readonly id: string;
  readonly parentId: string | null;
  readonly isRegistered: boolean;
  dispose(): void;
};

export type LayerStackListener = (stack: readonly LayerEntry[]) => void;

/** Handle returned by a layer stack (manager handle plus stack position). */
export type LayerStackHandle = LayerHandle & {
  readonly isTopmost: boolean;
};

/** Per-layer registration options for a shared layer stack. */
export type LayerStackRegistration = {
  id?: string;
  /** Parent layer handle. Must belong to the same stack. */
  parent?: LayerStackHandle | null;
  element?: LayerElementSource;
  reference?: LayerElementSource;
  /** Extra elements that should not count as outside the layer. */
  boundaries?: LayerBoundarySource;
  dismissOnEscape?: boolean;
  dismissOnOutsidePress?: boolean;
  onDismiss?: (reason: DismissReason) => void;
};

export type LayerStackOptions = {
  /** Document that owns the shared keyboard/pointer listeners. */
  document?: Document;
};

/**
 * Shared layer stack: ordering, parent/child links, and one set of
 * document-level Escape/outside listeners for every registered layer.
 */
export type LayerStack = {
  readonly size: number;
  register(options?: LayerStackRegistration): LayerStackHandle;
  getTopmost(): LayerEntry | null;
  isTopmost(id: string): boolean;
  subscribe(listener: LayerStackListener): Cleanup;
  dispose(): void;
};

/** A reference-counted stack borrowed from a registry. */
export type LayerStackLease = {
  readonly stack: LayerStack;
  release(): void;
};

export type LayerStackRegistry = {
  acquire(document: Document): LayerStackLease;
};

/**
 * Minimal stack registry for layered UI.
 *
 * The manager tracks registration order (bottom → top), parent/child
 * relationships, and which registered element contains an event target.
 * It does not open, close, focus, or render anything.
 */
export type LayerManager = {
  readonly size: number;
  register(options?: RegisterLayerOptions): LayerHandle;
  unregister(id: string): boolean;
  get(id: string): LayerEntry | null;
  getStack(): readonly LayerEntry[];
  getTopmost(): LayerEntry | null;
  isTopmost(id: string): boolean;
  /** True when the event target is outside this layer and its descendants. */
  isOutside(id: string, event: Event): boolean;
  /** True when the event target is outside the topmost layer. */
  isOutsideActive(event: Event): boolean;
  subscribe(listener: LayerStackListener): Cleanup;
  dispose(): void;
};
