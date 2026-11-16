"use client";

import {
  forwardRef,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { getArrowStyles, parsePlacement } from "@zealakit/overlay-core";
import { usePopoverPositionerContext } from "./popover/content.js";
import { composeRefs } from "./slot.js";

export type PopoverArrowProps = HTMLAttributes<HTMLDivElement> & {
  /** Arrow square edge length in pixels. Defaults to 8. */
  size?: number;
  /** Space kept from the popup edges by the positioning engine. Defaults to 0. */
  padding?: number;
};

const FloatingArrow = forwardRef<
  HTMLDivElement,
  PopoverArrowProps & { internal?: boolean; part: string }
>(function FloatingArrow(
  { size, padding, internal = false, part, style, className, ...rest },
  forwardedRef,
) {
  const positioner = usePopoverPositionerContext(part);
  const config = positioner.arrow;
  if (!config) {
    throw new Error(
      `[overlay-react] ${part} requires a Popover/Tooltip positioner.`,
    );
  }
  const resolvedSize = size ?? config.size;
  const resolvedPadding = padding ?? config.padding;
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    positioner.setArrowElement(element);
    return () => positioner.setArrowElement(null);
  }, [element, positioner.setArrowElement]);

  useEffect(() => {
    positioner.setArrowPadding(resolvedPadding);
    return () => positioner.setArrowPadding(config.padding);
  }, [config.padding, positioner.setArrowPadding, resolvedPadding]);

  const placement = positioner.result?.placement ?? positioner.placement;
  const side = parsePlacement(placement).side;
  const computed = useMemo(
    () =>
      getArrowStyles({
        placement,
        arrow: positioner.result?.arrow,
        size: resolvedSize,
      }),
    [placement, positioner.result?.arrow, resolvedSize],
  );
  const arrowStyle = useMemo<CSSProperties>(
    () =>
      ({
        ...(computed?.style ?? {
          position: "absolute",
          width: resolvedSize,
          height: resolvedSize,
          pointerEvents: "none",
        }),
        visibility: computed ? "visible" : "hidden",
        ...style,
      }) as CSSProperties,
    [computed, resolvedSize, style],
  );

  if (!internal && config.shorthand) {
    // The Content `arrow` shorthand owns the single rendered arrow.
    return null;
  }

  return (
    <div
      {...rest}
      aria-hidden="true"
      data-arrow=""
      data-side={side}
      ref={composeRefs(forwardedRef, setElement)}
      className={className}
      style={arrowStyle}
    />
  );
});

/** Explicit arrow part for advanced Popover composition. */
export const PopoverArrow = forwardRef<HTMLDivElement, PopoverArrowProps>(
  function PopoverArrow(props, forwardedRef) {
    return <FloatingArrow {...props} part="PopoverArrow" ref={forwardedRef} />;
  },
);

/** Explicit arrow part for Tooltip content. */
export const TooltipArrow = forwardRef<HTMLDivElement, PopoverArrowProps>(
  function TooltipArrow(props, forwardedRef) {
    return <FloatingArrow {...props} part="TooltipArrow" ref={forwardedRef} />;
  },
);

/** Internal default arrow used by Content shorthand. */
export const DefaultArrow = forwardRef<
  HTMLDivElement,
  PopoverArrowProps & { part: string }
>(function DefaultArrow(props, forwardedRef) {
  return <FloatingArrow {...props} internal part="Arrow" ref={forwardedRef} />;
});
