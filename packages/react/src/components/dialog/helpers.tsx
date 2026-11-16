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
import { useDialogContentContext, useDialogContext } from "./context.js";
import { Slot, composeRefs } from "../slot.js";
import type { DialogDataAttributes } from "./content.js";

export type DialogHeaderProps = HTMLAttributes<HTMLDivElement> &
  DialogDataAttributes;

/** Optional layout wrapper only; it carries no accessibility semantics. */
export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(
  function DialogHeader(props, ref) {
    return <div {...props} ref={ref} />;
  },
);

export type DialogTitleProps = HTMLAttributes<HTMLHeadingElement> &
  DialogDataAttributes;

/**
 * Provides the Dialog's accessible name. It sets the popup's
 * `aria-labelledby` relationship.
 */
export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
  function DialogTitle({ id, ...rest }, ref) {
    const dialog = useDialogContext("DialogTitle");
    const { setTitleId } = useDialogContentContext("DialogTitle");
    const titleId = id ?? dialog.titleId;

    useEffect(() => {
      setTitleId(titleId);
      return () => {
        setTitleId(null);
      };
    }, [setTitleId, titleId]);

    return <h2 {...rest} id={titleId} ref={ref} />;
  },
);

export type DialogDescriptionProps = HTMLAttributes<HTMLParagraphElement> &
  DialogDataAttributes;

/** Optional accessible description for the Dialog. */
export const DialogDescription = forwardRef<
  HTMLParagraphElement,
  DialogDescriptionProps
>(function DialogDescription({ id, ...rest }, ref) {
  const dialog = useDialogContext("DialogDescription");
  const { setDescriptionId } = useDialogContentContext("DialogDescription");
  const descriptionId = id ?? dialog.descriptionId;

  useEffect(() => {
    setDescriptionId(descriptionId);
    return () => {
      setDescriptionId(null);
    };
  }, [descriptionId, setDescriptionId]);

  return <p {...rest} id={descriptionId} ref={ref} />;
});

export type DialogFooterProps = HTMLAttributes<HTMLDivElement> &
  DialogDataAttributes;

/** Optional layout wrapper for actions. No close-on-click behavior is applied. */
export const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(
  function DialogFooter(props, ref) {
    return <div {...props} ref={ref} />;
  },
);

export type DialogCloseProps = ComponentPropsWithoutRef<"button"> &
  DialogDataAttributes & {
    asChild?: boolean;
  };

/** Optional explicit close control. Dialog never injects one automatically. */
export const DialogClose = forwardRef<HTMLElement, DialogCloseProps>(
  function DialogClose(
    { asChild = false, onClick, type, children, ...rest },
    forwardedRef,
  ) {
    const dialog = useDialogContext("DialogClose");
    const refs = useMemo(() => composeRefs(forwardedRef), [forwardedRef]);
    const handleClick: MouseEventHandler<HTMLElement> = (event) => {
      onClick?.(event as ReactMouseEvent<HTMLButtonElement>);
      if (event.defaultPrevented) {
        return;
      }
      dialog.close("close-button");
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
