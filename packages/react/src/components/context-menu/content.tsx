"use client";

import { forwardRef, useCallback, useMemo, type HTMLAttributes } from "react";
import type {
  AnimationSetting,
  DismissReason,
  PositionerBoundary,
  ReferenceElement,
  Strategy,
} from "@zealakit/overlay-core";
import {
  OverlayPresenceContext,
  useOverlayPresence,
} from "../../animation/presence.js";
import { MenuSurface } from "./menu-surface.js";
import { useContextMenuContext } from "./context.js";
import type {
  ContextMenuAlign,
  ContextMenuCollisionAvoidance,
  ContextMenuSide,
} from "./types.js";

export type ContextMenuContentProps = HTMLAttributes<HTMLDivElement> & {
  [key: `data-${string}`]: string | number | boolean | undefined;
  side?: ContextMenuSide;
  align?: ContextMenuAlign;
  sideOffset?: number;
  alignOffset?: number;
  collisionBoundary?: PositionerBoundary;
  collisionPadding?: number;
  collisionAvoidance?: ContextMenuCollisionAvoidance;
  positionMethod?: Strategy;
  /** `true`/omitted uses an enclosing Dialog popup if present. */
  portal?: boolean | Element | null;
  /** Fade/custom enter and exit animation. Disabled by default; pass true or a config. */
  animation?: AnimationSetting;
};

function toMenuReason(reason: DismissReason) {
  switch (reason) {
    case "escape-key":
      return "escape" as const;
    case "outside-press":
      return "outside-press" as const;
    case "reference-press":
      return "trigger" as const;
    default:
      return "programmatic" as const;
  }
}

/**
 * Convenient root menu content: virtual pointer or trigger-element anchor,
 * portal, layer registration, focus, and keyboard navigation.
 */
export const ContextMenuContent = forwardRef<
  HTMLDivElement,
  ContextMenuContentProps
>(function ContextMenuContent(
  {
    side = "bottom",
    align = "start",
    sideOffset = 0,
    alignOffset = 0,
    collisionBoundary,
    collisionPadding = 0,
    collisionAvoidance,
    positionMethod,
    portal = true,
    animation,
    ...rest
  },
  forwardedRef,
) {
  const menu = useContextMenuContext("ContextMenuContent");
  const point = menu.point;
  const triggerElement = menu.triggerElement;

  const reference = useMemo<ReferenceElement | null>(() => {
    if (point) {
      return {
        getBoundingClientRect: () => ({
          x: point.x,
          y: point.y,
          width: 0,
          height: 0,
        }),
      };
    }
    return triggerElement;
  }, [point, triggerElement]);

  const placement = (
    align === "center" ? side : `${side}-${align}`
  ) as `${ContextMenuSide}-${ContextMenuAlign}`;

  const handleDismiss = useCallback(
    (reason: DismissReason) => {
      menu.close(toMenuReason(reason));
    },
    [menu],
  );
  const handleContextMenuOutside = useCallback(() => {
    menu.close("outside-press");
  }, [menu]);

  const presence = useOverlayPresence(menu.isOpen, animation);
  if (!presence.present) {
    return null;
  }

  return (
    <OverlayPresenceContext.Provider value={presence}>
      <MenuSurface
        {...rest}
        ref={forwardedRef}
        reference={reference}
        boundaryReference={triggerElement}
        focusRestoreTarget={triggerElement}
        menuId={menu.contentId}
        placement={placement}
        offset={sideOffset}
        alignOffset={alignOffset}
        padding={collisionPadding}
        boundary={collisionBoundary}
        strategy={positionMethod}
        flip={collisionAvoidance?.flip ?? true}
        shift={collisionAvoidance?.shift ?? true}
        portal={portal}
        parentLayer={menu.parentLayer}
        dir={menu.direction}
        open={menu.isOpen}
        onDismiss={handleDismiss}
        onContextMenuOutside={handleContextMenuOutside}
        onContextMenu={(event) => event.preventDefault()}
      />
    </OverlayPresenceContext.Provider>
  );
});
