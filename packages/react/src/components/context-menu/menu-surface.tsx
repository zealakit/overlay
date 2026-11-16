"use client";

import {
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefCallback,
} from "react";
import {
  getActiveElement,
  parsePlacement,
  restoreFocus,
  type DismissReason,
  type LayerStackHandle,
  type Placement,
  type PositionerBoundary,
  type ReferenceElement,
  type Strategy,
} from "@zealakit/overlay-core";
import { useLayer } from "../../hooks/use-layer.js";
import { usePositioner } from "../../hooks/use-positioner.js";
import { Portal } from "../portal.js";
import {
  OverlayLayerContext,
  OverlayPortalContainerContext,
  type OverlayLayerContextValue,
} from "../overlay-context.js";
import { composeRefs } from "../slot.js";
import {
  useOverlayElementAnimation,
  useOverlayPresenceContext,
} from "../../animation/presence.js";
import { useMenuAutoFocus, useMenuNavigation } from "./menu-navigation.js";

export type MenuSurfaceProps = HTMLAttributes<HTMLDivElement> & {
  [key: `data-${string}`]: string | number | boolean | undefined;
  children?: ReactNode;
  reference: ReferenceElement | null;
  boundaryReference: Element | null;
  focusRestoreTarget: Element | null;
  menuId: string;
  labelledBy?: string;
  placement: Placement;
  offset?: number;
  alignOffset?: number;
  padding?: number;
  boundary?: PositionerBoundary;
  strategy?: Strategy;
  flip?: boolean;
  shift?: boolean;
  portal?: boolean | Element | null;
  parentLayer?: LayerStackHandle | null;
  dir?: "ltr" | "rtl";
  submenu?: boolean;
  /** Whether the owning menu is logically open. Defaults to true. */
  open?: boolean;
  onDismiss(reason: DismissReason): void;
  onContextMenuOutside?: () => void;
  onSubmenuKeyDown?: (event: ReactKeyboardEvent<HTMLElement>) => boolean;
  onPointerEnterSurface?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerLeaveSurface?: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

export const MenuSurface = forwardRef<HTMLDivElement, MenuSurfaceProps>(
  function MenuSurface(
    {
      children,
      reference,
      boundaryReference,
      focusRestoreTarget,
      menuId,
      labelledBy,
      placement,
      offset = 0,
      alignOffset = 0,
      padding = 0,
      boundary,
      strategy,
      flip = true,
      shift = true,
      portal = true,
      parentLayer,
      dir,
      submenu = false,
      open = true,
      onDismiss,
      onContextMenuOutside,
      onSubmenuKeyDown,
      onPointerEnterSurface,
      onPointerLeaveSurface,
      onKeyDown,
      onPointerEnter,
      onPointerLeave,
      ...rest
    },
    forwardedRef,
  ) {
    const inheritedLayer = useContext(OverlayLayerContext);
    const inheritedPortal = useContext(OverlayPortalContainerContext);
    const presence = useOverlayPresenceContext();
    const [popupElement, setPopupElement] = useState<HTMLDivElement | null>(
      null,
    );
    const focusInsideRef = useRef(false);
    const focusTargetRef = useRef(focusRestoreTarget);
    focusTargetRef.current = focusRestoreTarget;

    const layer = useLayer({
      element: popupElement,
      reference: boundaryReference,
      parent: parentLayer ?? inheritedLayer?.handle ?? null,
      dismissOnEscape: true,
      dismissOnOutsidePress: true,
      disabled: !open,
      onDismiss,
    });

    const positioner = usePositioner({
      reference,
      placement,
      offset,
      alignOffset,
      padding,
      boundary,
      strategy,
      flip,
      shift,
      autoUpdate: true,
    });

    const refs = useMemo(
      () =>
        composeRefs(
          forwardedRef,
          setPopupElement,
          positioner.floatingRef as RefCallback<HTMLDivElement>,
        ),
      [forwardedRef, positioner.floatingRef],
    );

    useOverlayElementAnimation({
      element: positioner.result ? popupElement : null,
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
      placement: positioner.result?.placement ?? placement,
      onExitComplete: presence?.finishExit ?? (() => {}),
    });

    const layerContext = useMemo<OverlayLayerContextValue>(
      () => ({ handle: layer.handle, isTopmost: layer.isTopmost }),
      [layer.handle, layer.isTopmost],
    );

    useEffect(() => {
      if (!popupElement) {
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
    }, [popupElement]);

    useEffect(() => {
      if (!popupElement) {
        return;
      }
      return () => {
        const documentRef = popupElement.ownerDocument;
        const active = getActiveElement(documentRef);
        const focusWasInside =
          focusInsideRef.current ||
          (active !== null && popupElement.contains(active));
        focusInsideRef.current = false;
        if (!focusWasInside && active !== null && active !== documentRef.body) {
          return;
        }
        const target = focusTargetRef.current;
        if (!target) {
          return;
        }
        if (!restoreFocus(target)) {
          queueMicrotask(() => {
            restoreFocus(target);
          });
        }
      };
    }, [popupElement]);

    useEffect(() => {
      if (!popupElement || !onContextMenuOutside) {
        return;
      }
      const documentRef = popupElement.ownerDocument;
      const handleContextMenu = (event: MouseEvent): void => {
        const target = event.target as Node | null;
        if (!target || popupElement.contains(target)) {
          return;
        }
        if (boundaryReference?.contains(target)) {
          return;
        }
        const element = target as Element;
        if (element.closest?.('[role="menu"]')) {
          return;
        }
        onContextMenuOutside();
      };
      documentRef.addEventListener("contextmenu", handleContextMenu);
      return () => {
        documentRef.removeEventListener("contextmenu", handleContextMenu);
      };
    }, [boundaryReference, onContextMenuOutside, popupElement]);

    useMenuAutoFocus(popupElement, positioner.result !== null);
    const navigate = useMenuNavigation(popupElement, true);

    const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>): void => {
      onKeyDown?.(event as ReactKeyboardEvent<HTMLDivElement>);
      if (event.defaultPrevented) {
        return;
      }
      if (onSubmenuKeyDown?.(event)) {
        return;
      }
      navigate(event);
    };

    const handlePointerEnter = (
      event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
      onPointerEnter?.(event);
      if (!event.defaultPrevented) {
        onPointerEnterSurface?.(event);
      }
    };

    const handlePointerLeave = (
      event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
      onPointerLeave?.(event);
      if (!event.defaultPrevented) {
        onPointerLeaveSurface?.(event);
      }
    };

    const parsed = parsePlacement(positioner.result?.placement ?? placement);
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
    } as CSSProperties;

    const content = (
      <OverlayLayerContext.Provider value={layerContext}>
        <div
          {...rest}
          ref={refs}
          id={menuId}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby={rest["aria-labelledby"] ?? labelledBy}
          tabIndex={-1}
          dir={dir === "rtl" ? "rtl" : undefined}
          data-state={open ? "open" : "closed"}
          data-open={open ? "" : undefined}
          data-closed={open ? undefined : ""}
          data-context-menu={submenu ? undefined : ""}
          data-submenu={submenu ? "" : undefined}
          data-side={parsed.side}
          data-align={parsed.align}
          style={style}
          onKeyDown={handleKeyDown}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
        >
          {children}
        </div>
      </OverlayLayerContext.Provider>
    );

    if (portal === false) {
      return content;
    }

    const container =
      typeof portal === "object" && portal !== null ? portal : inheritedPortal;

    return <Portal container={container}>{content}</Portal>;
  },
);
