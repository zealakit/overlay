"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefCallback,
} from "react";
import {
  createFocusContainment,
  focusFirst,
  getActiveElement,
  parsePlacement,
  restoreFocus,
  type AnimationSetting,
  type DismissReason,
  type Placement,
  type PositionerBoundary,
  type PositionerResult,
  type Strategy,
} from "@zealakit/overlay-core";
import { useLayer } from "../../hooks/use-layer.js";
import { usePositioner } from "../../hooks/use-positioner.js";
import { Portal } from "../portal.js";
import {
  PopoverContentContext,
  usePopoverContext,
  type PopoverChangeReason,
  type PopoverContentContextValue,
} from "./context.js";
import {
  OverlayLayerContext,
  OverlayPortalContainerContext,
  type OverlayLayerContextValue,
} from "../overlay-context.js";
import { composeRefs } from "../slot.js";
import {
  OverlayPresenceContext,
  useOverlayElementAnimation,
  useOverlayPresence,
  useOverlayPresenceContext,
} from "../../animation/presence.js";
import { DefaultArrow } from "../arrow.js";

export type PopoverSide = "top" | "right" | "bottom" | "left";
export type PopoverAlign = "start" | "center" | "end";

export type PopoverCollisionAvoidance = {
  /** Flip to the opposite side when there is not enough room. Defaults to true. */
  flip?: boolean;
  /** Shift along the cross axis to stay inside the boundary. Defaults to true. */
  shift?: boolean;
};

export type PopoverPositionerProps = {
  children?: ReactNode;
  /** Explicit positioning reference. Defaults to the trigger element. */
  anchor?: Element | null;
  /** Physical side. Defaults to bottom. */
  side?: PopoverSide;
  /** Alignment within the side. Defaults to center. */
  align?: PopoverAlign;
  /** Main-axis gap. */
  sideOffset?: number;
  /** Cross-axis offset. */
  alignOffset?: number;
  /** Core collision boundary. */
  collisionBoundary?: PositionerBoundary;
  /** Gap from the collision boundary. */
  collisionPadding?: number;
  /** Toggle flip/shift collision avoidance. Both default to true. */
  collisionAvoidance?: PopoverCollisionAvoidance;
  /** CSS positioning method. Defaults to fixed. */
  positionMethod?: Strategy;
  /** Render a default arrow. Disabled by default. */
  arrow?: boolean;
  /** Default arrow edge length in pixels. Defaults to 8. */
  arrowSize?: number;
  /** Default arrow padding from popup edges. Defaults to 0. */
  arrowPadding?: number;
  /** Default arrow class name. */
  arrowClassName?: string;
  /** Default arrow inline style; merged over base geometry. */
  arrowStyle?: CSSProperties;
};

export type PopoverPortalProps = {
  children?: ReactNode;
  /** Defaults to document.body. */
  container?: Element | null;
  /** Render in place instead of portaling. */
  disabled?: boolean;
};

export type PopoverDataAttributes = {
  [key: `data-${string}`]: string | number | boolean | undefined;
};

export type PopoverPopupProps = HTMLAttributes<HTMLDivElement> &
  PopoverDataAttributes & {
    /** Focus the first focusable element when the popup opens. Defaults to false. */
    initialFocus?: boolean;
    /** Contain focus while this layer is topmost. Defaults to false. */
    trapFocus?: boolean;
    /** Restore focus to the trigger when closing from inside. Defaults to true. */
    restoreFocus?: boolean;
    /** Fade/custom enter and exit animation. Enabled by default as fade. */
    animation?: AnimationSetting;
  };

export type PopoverContentProps = Omit<PopoverPositionerProps, "children"> &
  PopoverPopupProps & {
    /**
     * `true`/omitted portals to document.body, an Element selects a container,
     * and `false` renders in place.
     */
    portal?: boolean | Element | null;
  };

export type PopoverArrowConfig = {
  enabled: boolean;
  shorthand: boolean;
  size: number;
  padding: number;
  className?: string;
  style?: CSSProperties;
};

export type PopoverPositionerContextValue = {
  result: PositionerResult | null;
  referenceElement: Element | null;
  floatingElement: HTMLElement | null;
  floatingRef: RefCallback<HTMLElement>;
  placement: Placement;
  arrow: PopoverArrowConfig;
  setArrowElement(element: Element | null): void;
  setArrowPadding(padding: number): void;
};

const PopoverPositionerContext =
  createContext<PopoverPositionerContextValue | null>(null);

export function usePopoverPositionerContext(
  part: string,
): PopoverPositionerContextValue {
  const context = useContext(PopoverPositionerContext);
  if (!context) {
    throw new Error(
      `[overlay-react] ${part} must be rendered inside <PopoverPositioner>.`,
    );
  }
  return context;
}

function toPopoverReason(reason: DismissReason): PopoverChangeReason {
  switch (reason) {
    case "escape-key":
      return "escape";
    case "outside-press":
      return "outside-press";
    case "reference-press":
      return "trigger";
    default:
      return "programmatic";
  }
}

function sameAnchorSize(
  previous: { width: number; height: number } | null,
  next: { width: number; height: number },
): boolean {
  return (
    previous !== null &&
    previous.width === next.width &&
    previous.height === next.height
  );
}

/**
 * Portal part for advanced composition. The convenience Content uses it by
 * default. It renders nothing while the Popover is closed.
 */
export function PopoverPortal({
  children,
  container,
  disabled = false,
}: PopoverPortalProps) {
  const popover = usePopoverContext("PopoverPortal");
  const presence = useOverlayPresenceContext();
  const inheritedContainer = useContext(OverlayPortalContainerContext);
  if (!popover.isOpen && !presence?.present) {
    return null;
  }
  if (disabled) {
    return <>{children}</>;
  }
  const target = container === undefined ? inheritedContainer : container;
  return <Portal container={target}>{children}</Portal>;
}

/**
 * Advanced positioning part. Renders no DOM; provides the positioner state to
 * PopoverPopup. Positioning props are consumed here and never reach the popup.
 */
export function PopoverPositioner({
  children,
  anchor,
  side = "bottom",
  align = "center",
  sideOffset = 0,
  alignOffset = 0,
  collisionBoundary,
  collisionPadding = 0,
  collisionAvoidance,
  positionMethod,
  arrow = false,
  arrowSize = 8,
  arrowPadding = 0,
  arrowClassName,
  arrowStyle,
}: PopoverPositionerProps) {
  const popover = usePopoverContext("PopoverPositioner");
  const placement = (
    align === "center" ? side : `${side}-${align}`
  ) as Placement;
  const reference = anchor ?? popover.triggerElement;
  const [arrowElement, setArrowElement] = useState<Element | null>(null);
  const [activeArrowPadding, setActiveArrowPadding] = useState(arrowPadding);

  useEffect(() => {
    setActiveArrowPadding(arrowPadding);
  }, [arrowPadding]);

  const arrowOptions = useMemo(
    () =>
      arrowElement
        ? { element: arrowElement, padding: activeArrowPadding }
        : null,
    [activeArrowPadding, arrowElement],
  );

  const {
    referenceRef,
    floatingRef,
    referenceElement,
    floatingElement,
    result,
  } = usePositioner({
    placement,
    offset: sideOffset,
    alignOffset,
    padding: collisionPadding,
    boundary: collisionBoundary,
    strategy: positionMethod,
    flip: collisionAvoidance?.flip ?? true,
    shift: collisionAvoidance?.shift ?? true,
    arrow: arrowOptions,
  });

  useEffect(() => {
    referenceRef(reference);
  }, [reference, referenceRef]);

  const value = useMemo<PopoverPositionerContextValue>(
    () => ({
      result,
      referenceElement,
      floatingElement,
      floatingRef,
      placement,
      arrow: {
        enabled: arrow,
        shorthand: arrow,
        size: arrowSize,
        padding: activeArrowPadding,
        className: arrowClassName,
        style: arrowStyle,
      },
      setArrowElement,
      setArrowPadding: setActiveArrowPadding,
    }),
    [
      activeArrowPadding,
      arrow,
      arrowClassName,
      arrowSize,
      arrowStyle,
      floatingElement,
      floatingRef,
      placement,
      referenceElement,
      result,
      setArrowElement,
    ],
  );

  return (
    <PopoverPositionerContext.Provider value={value}>
      {children}
    </PopoverPositionerContext.Provider>
  );
}

/**
 * Advanced popup part. Owns the floating element, layer registration, ARIA
 * title/description wiring, focus policy, and state/data attributes.
 */
export const PopoverPopup = forwardRef<HTMLDivElement, PopoverPopupProps>(
  function PopoverPopup(
    {
      children,
      initialFocus = false,
      trapFocus = false,
      restoreFocus: restoreOnClose = true,
      animation,
      ...rest
    },
    forwardedRef,
  ) {
    const popover = usePopoverContext("PopoverPopup");
    const positioner = usePopoverPositionerContext("PopoverPopup");
    const inheritedPresence = useOverlayPresenceContext();
    const localPresence = useOverlayPresence(popover.isOpen, animation);
    const presence = inheritedPresence ?? localPresence;
    const [popupElement, setPopupElement] = useState<HTMLDivElement | null>(
      null,
    );
    const [titleId, setTitleId] = useState<string | null>(null);
    const [descriptionId, setDescriptionId] = useState<string | null>(null);
    const focusInsideRef = useRef(false);
    const initialFocusAppliedRef = useRef(false);
    const triggerElementRef = useRef(popover.triggerElement);
    triggerElementRef.current = popover.triggerElement;

    const layer = useLayer({
      element: popupElement,
      reference: positioner.referenceElement,
      parent: popover.parentLayer,
      dismissOnEscape: popover.dismissOnEscape,
      dismissOnOutsidePress: popover.dismissOnOutsidePress,
      disabled: !popover.isOpen,
      onDismiss: (reason) => {
        popover.close(toPopoverReason(reason));
      },
    });

    useOverlayElementAnimation({
      element: positioner.result ? popupElement : null,
      phase: presence.phase,
      animation: presence.animation,
      placement: positioner.result?.placement ?? positioner.placement,
      onExitComplete: presence.finishExit,
    });

    const refs = useMemo(
      () =>
        composeRefs(
          forwardedRef,
          positioner.floatingRef as RefCallback<HTMLDivElement>,
          setPopupElement,
        ),
      [forwardedRef, positioner.floatingRef],
    );

    useEffect(() => {
      if (!popover.isOpen || !popupElement) {
        return;
      }
      const handleFocusIn = (): void => {
        focusInsideRef.current = true;
      };
      const handleFocusOut = (event: globalThis.FocusEvent): void => {
        const next = event.relatedTarget as Node | null;
        if (!next || !popupElement.contains(next)) {
          focusInsideRef.current = false;
        }
      };
      popupElement.addEventListener("focusin", handleFocusIn);
      popupElement.addEventListener("focusout", handleFocusOut);
      return () => {
        popupElement.removeEventListener("focusin", handleFocusIn);
        popupElement.removeEventListener("focusout", handleFocusOut);
      };
    }, [popover.isOpen, popupElement]);

    useEffect(() => {
      if (
        !popover.isOpen ||
        !initialFocus ||
        !popupElement ||
        !positioner.result ||
        initialFocusAppliedRef.current
      ) {
        return;
      }
      initialFocusAppliedRef.current = true;
      focusFirst(popupElement);
    }, [initialFocus, popover.isOpen, popupElement, positioner.result]);

    useEffect(() => {
      if (!popover.isOpen || !restoreOnClose || !popupElement) {
        return;
      }
      return () => {
        const active = getActiveElement();
        const focusWasInside =
          focusInsideRef.current ||
          (active !== null && popupElement.contains(active));
        focusInsideRef.current = false;
        if (focusWasInside) {
          restoreFocus(triggerElementRef.current);
        }
      };
    }, [popover.isOpen, popupElement, restoreOnClose]);

    useEffect(() => {
      if (!popover.isOpen || !trapFocus || !popupElement) {
        return;
      }
      const containment = createFocusContainment({
        container: popupElement,
        enabled: layer.isTopmost,
        restoreFocus: false,
      });
      return () => {
        containment.dispose();
      };
    }, [layer.isTopmost, popover.isOpen, popupElement, trapFocus]);

    const [anchorSize, setAnchorSize] = useState<{
      width: number;
      height: number;
    } | null>(null);
    useEffect(() => {
      const reference = positioner.referenceElement;
      if (!reference || !positioner.result) {
        return;
      }
      const rect = reference.getBoundingClientRect();
      const next = { width: rect.width, height: rect.height };
      setAnchorSize((previous) =>
        sameAnchorSize(previous, next) ? previous : next,
      );
    }, [positioner.referenceElement, positioner.result]);

    const labelContext = useMemo<PopoverContentContextValue>(
      () => ({ setTitleId, setDescriptionId }),
      [],
    );
    const layerContext = useMemo<OverlayLayerContextValue>(
      () => ({ handle: layer.handle, isTopmost: layer.isTopmost }),
      [layer.handle, layer.isTopmost],
    );

    if (!presence.present) {
      return null;
    }

    const placement = positioner.result?.placement ?? positioner.placement;
    const parsed = parsePlacement(placement);
    const style = {
      ...rest.style,
      ...(positioner.result
        ? {
            position: positioner.result.strategy,
            left: `${positioner.result.x}px`,
            top: `${positioner.result.y}px`,
          }
        : {
            position: "fixed",
            left: 0,
            top: 0,
            visibility: "hidden",
          }),
      ...(anchorSize
        ? {
            "--popover-anchor-width": `${anchorSize.width}px`,
            "--popover-anchor-height": `${anchorSize.height}px`,
          }
        : {}),
    } as CSSProperties;

    return (
      <OverlayLayerContext.Provider value={layerContext}>
        <PopoverContentContext.Provider value={labelContext}>
          {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: headless popup; role is consumer-owned */}
          <div
            {...rest}
            ref={refs}
            id={popover.contentId}
            dir={rest.dir ?? (popover.direction === "rtl" ? "rtl" : undefined)}
            data-state={popover.isOpen ? "open" : "closed"}
            data-open={popover.isOpen ? "" : undefined}
            data-closed={popover.isOpen ? undefined : ""}
            data-side={parsed.side}
            data-align={parsed.align}
            aria-labelledby={rest["aria-labelledby"] ?? titleId ?? undefined}
            aria-describedby={
              rest["aria-describedby"] ?? descriptionId ?? undefined
            }
            style={style}
          >
            {positioner.arrow.shorthand ? (
              <DefaultArrow
                size={positioner.arrow.size}
                padding={positioner.arrow.padding}
                className={positioner.arrow.className}
                style={positioner.arrow.style}
                part="PopoverArrow"
              />
            ) : null}
            {children}
          </div>
        </PopoverContentContext.Provider>
      </OverlayLayerContext.Provider>
    );
  },
);

/**
 * Convenience composition: Portal -> Positioner -> Popup. Positioning props are
 * consumed by the Positioner; native props go to the Popup.
 */
export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  function PopoverContent(
    {
      anchor,
      side,
      align,
      sideOffset,
      alignOffset,
      collisionBoundary,
      collisionPadding,
      collisionAvoidance,
      positionMethod,
      arrow,
      arrowSize,
      arrowPadding,
      arrowClassName,
      arrowStyle,
      animation,
      portal = true,
      children,
      ...popupProps
    },
    forwardedRef,
  ) {
    const popover = usePopoverContext("PopoverContent");
    const presence = useOverlayPresence(popover.isOpen, animation);
    if (!presence.present) {
      return null;
    }

    const content = (
      <PopoverPositioner
        anchor={anchor}
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionBoundary={collisionBoundary}
        collisionPadding={collisionPadding}
        collisionAvoidance={collisionAvoidance}
        positionMethod={positionMethod}
        arrow={arrow}
        arrowSize={arrowSize}
        arrowPadding={arrowPadding}
        arrowClassName={arrowClassName}
        arrowStyle={arrowStyle}
      >
        <PopoverPopup {...popupProps} animation={animation} ref={forwardedRef}>
          {children}
        </PopoverPopup>
      </PopoverPositioner>
    );

    return (
      <OverlayPresenceContext.Provider value={presence}>
        {portal === false ? (
          content
        ) : (
          <PopoverPortal
            container={
              typeof portal === "object" && portal !== null
                ? portal
                : undefined
            }
          >
            {content}
          </PopoverPortal>
        )}
      </OverlayPresenceContext.Provider>
    );
  },
);
