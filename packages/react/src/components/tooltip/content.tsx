"use client";

import {
  forwardRef,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefCallback,
} from "react";
import { parsePlacement, type AnimationSetting } from "@zealakit/overlay-core";
import {
  PopoverPortal,
  PopoverPositioner,
  usePopoverPositionerContext,
  type PopoverDataAttributes,
  type PopoverPositionerProps,
} from "../popover/content.js";
import { usePopoverContext } from "../popover/context.js";
import { composeRefs } from "../slot.js";
import { DefaultArrow } from "../arrow.js";
import {
  OverlayPresenceContext,
  useOverlayElementAnimation,
  useOverlayPresence,
  useOverlayPresenceContext,
} from "../../animation/presence.js";
import { useTooltipContext } from "./context.js";

export type TooltipContentProps = Omit<
  PopoverPositionerProps,
  "anchor" | "children"
> &
  HTMLAttributes<HTMLDivElement> &
  PopoverDataAttributes & {
    children?: ReactNode;
    /** `true`/omitted portals to document.body; `false` renders inline. */
    portal?: boolean | Element | null;
    /** Fade/custom enter and exit animation. Enabled by default as fade. */
    animation?: AnimationSetting;
  };

type TooltipPopupProps = HTMLAttributes<HTMLDivElement> & PopoverDataAttributes;

const TooltipPopup = forwardRef<HTMLDivElement, TooltipPopupProps>(
  function TooltipPopup(
    { onPointerEnter, onPointerLeave, children, ...rest },
    forwardedRef,
  ) {
    const tooltip = useTooltipContext("TooltipContent");
    const popover = usePopoverContext("TooltipContent");
    const positioner = usePopoverPositionerContext("TooltipContent");
    const presence = useOverlayPresenceContext();
    const [anchorSize, setAnchorSize] = useState<{
      width: number;
      height: number;
    } | null>(null);

    const refs = useMemo(
      () =>
        composeRefs(
          forwardedRef,
          positioner.floatingRef as RefCallback<HTMLDivElement>,
          tooltip.setContentElement,
        ),
      [forwardedRef, positioner.floatingRef, tooltip.setContentElement],
    );

    useOverlayElementAnimation({
      element: positioner.result ? positioner.floatingElement : null,
      phase: presence?.phase ?? "idle",
      animation: presence?.animation ?? {
        enabled: false,
        type: "fade",
        direction: "auto",
        duration: 0,
        delay: 0,
        easing: "ease-out",
        custom: null,
      },
      placement: positioner.result?.placement ?? positioner.placement,
      onExitComplete: presence?.finishExit ?? (() => {}),
    });

    useEffect(() => {
      const reference = positioner.referenceElement;
      if (!reference || !positioner.result) {
        return;
      }
      const rect = reference.getBoundingClientRect();
      const next = { width: rect.width, height: rect.height };
      setAnchorSize((previous) =>
        previous !== null &&
        previous.width === next.width &&
        previous.height === next.height
          ? previous
          : next,
      );
    }, [positioner.referenceElement, positioner.result]);

    const handlePointerEnter = (
      event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
      onPointerEnter?.(event);
      if (!event.defaultPrevented) {
        tooltip.contentEnter();
      }
    };

    const handlePointerLeave = (
      event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
      onPointerLeave?.(event);
      if (!event.defaultPrevented) {
        tooltip.contentLeave();
      }
    };

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
            "--tooltip-anchor-width": `${anchorSize.width}px`,
            "--tooltip-anchor-height": `${anchorSize.height}px`,
          }
        : {}),
    } as CSSProperties;

    return (
      <div
        {...rest}
        ref={refs}
        id={popover.contentId}
        role="tooltip"
        dir={rest.dir ?? (tooltip.direction === "rtl" ? "rtl" : undefined)}
        data-state={tooltip.isOpen ? "open" : "closed"}
        data-open={tooltip.isOpen ? "" : undefined}
        data-closed={tooltip.isOpen ? undefined : ""}
        data-side={parsed.side}
        data-align={parsed.align}
        style={style}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        {positioner.arrow.shorthand ? (
          <DefaultArrow
            size={positioner.arrow.size}
            padding={positioner.arrow.padding}
            className={positioner.arrow.className}
            style={positioner.arrow.style}
            part="TooltipArrow"
          />
        ) : null}
        {children}
      </div>
    );
  },
);

/**
 * Convenient Tooltip content: Portal -> Positioner -> Popup. The popup has
 * role="tooltip", is not keyboard-focusable, and is informational.
 */
export const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>(
  function TooltipContent(
    {
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
    const tooltip = useTooltipContext("TooltipContent");
    const presence = useOverlayPresence(tooltip.isOpen, animation);
    if (!presence.present) {
      return null;
    }

    const content = (
      <PopoverPositioner
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
        <TooltipPopup {...popupProps} ref={forwardedRef}>
          {children}
        </TooltipPopup>
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
