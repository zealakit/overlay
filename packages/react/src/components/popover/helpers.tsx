"use client";

import {
  forwardRef,
  useEffect,
  useMemo,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type MouseEventHandler,
} from "react";
import { usePopoverContentContext, usePopoverContext } from "./context.js";
import { Slot, composeRefs } from "../slot.js";

export type PopoverHeaderProps = HTMLAttributes<HTMLDivElement>;

/** Optional layout wrapper only; it carries no accessibility semantics. */
export const PopoverHeader = forwardRef<HTMLDivElement, PopoverHeaderProps>(
  function PopoverHeader(props, ref) {
    return <div {...props} ref={ref} />;
  },
);

export type PopoverTitleProps = HTMLAttributes<HTMLHeadingElement>;

/**
 * Optional semantic title. It sets the Popover popup's `aria-labelledby`
 * relationship when used.
 */
export const PopoverTitle = forwardRef<HTMLHeadingElement, PopoverTitleProps>(
  function PopoverTitle({ id, ...rest }, ref) {
    const popover = usePopoverContext("PopoverTitle");
    const { setTitleId } = usePopoverContentContext("PopoverTitle");
    const titleId = id ?? popover.titleId;

    useEffect(() => {
      setTitleId(titleId);
      return () => {
        setTitleId(null);
      };
    }, [setTitleId, titleId]);

    return <h2 {...rest} id={titleId} ref={ref} />;
  },
);

export type PopoverDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

/**
 * Optional semantic description. It sets the popup's `aria-describedby`
 * relationship when used.
 */
export const PopoverDescription = forwardRef<
  HTMLParagraphElement,
  PopoverDescriptionProps
>(function PopoverDescription({ id, ...rest }, ref) {
  const popover = usePopoverContext("PopoverDescription");
  const { setDescriptionId } = usePopoverContentContext("PopoverDescription");
  const descriptionId = id ?? popover.descriptionId;

  useEffect(() => {
    setDescriptionId(descriptionId);
    return () => {
      setDescriptionId(null);
    };
  }, [descriptionId, setDescriptionId]);

  return <p {...rest} id={descriptionId} ref={ref} />;
});

export type PopoverCloseProps = ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean;
};

/** Optional close control. Consumers are not required to render one. */
export const PopoverClose = forwardRef<HTMLElement, PopoverCloseProps>(
  function PopoverClose(
    { asChild = false, onClick, type, children, ...rest },
    forwardedRef,
  ) {
    const popover = usePopoverContext("PopoverClose");
    const refs = useMemo(() => composeRefs(forwardedRef), [forwardedRef]);
    const handleClick: MouseEventHandler<HTMLElement> = (event) => {
      onClick?.(event as ReactMouseEvent<HTMLButtonElement>);
      if (event.defaultPrevented) {
        return;
      }
      popover.close("close-button");
    };
    const shared = { ...rest, onClick: handleClick };

    if (asChild) {
      return (
        <Slot {...shared} ref={refs}>
          {children}
        </Slot>
      );
    }

    return (
      <button {...shared} ref={refs} type={type ?? "button"}>
        {children}
      </button>
    );
  },
);
