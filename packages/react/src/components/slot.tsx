"use client";

import {
  cloneElement,
  forwardRef,
  isValidElement,
  useMemo,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

type UnknownProps = Record<string, unknown>;

export function composeRefs<T>(
  ...refs: Array<Ref<T> | undefined>
): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) {
      if (!ref) {
        continue;
      }
      if (typeof ref === "function") {
        ref(node);
      } else {
        ref.current = node;
      }
    }
  };
}

export type SlotProps = {
  children: ReactNode;
  [key: string]: unknown;
};

/**
 * Merge Popover behavior onto a single consumer element instead of wrapping it.
 * Consumer handlers run first; the Popover handler is skipped when the consumer
 * calls `preventDefault()`.
 */
export const Slot = forwardRef<HTMLElement, SlotProps>(function Slot(
  { children, ...rest },
  forwardedRef,
) {
  const childRef = isValidElement(children)
    ? (children as { ref?: Ref<HTMLElement> }).ref
    : undefined;
  const mergedRef = useMemo(
    () => composeRefs(childRef, forwardedRef),
    [childRef, forwardedRef],
  );

  if (!isValidElement(children)) {
    throw new Error(
      "[overlay-react] asChild requires exactly one React element child.",
    );
  }

  const child = children as ReactElement<UnknownProps>;
  const childProps = child.props;
  const merged: UnknownProps = { ...childProps, ...rest };

  const childClassName =
    typeof childProps.className === "string" ? childProps.className : "";
  const slotClassName =
    typeof rest.className === "string" ? rest.className : "";
  const className = [childClassName, slotClassName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (className) {
    merged.className = className;
  }

  for (const [key, value] of Object.entries(rest)) {
    if (
      key.startsWith("on") &&
      typeof value === "function" &&
      typeof childProps[key] === "function"
    ) {
      const childHandler = childProps[key] as (...args: unknown[]) => unknown;
      const slotHandler = value as (...args: unknown[]) => unknown;
      merged[key] = (...args: unknown[]) => {
        childHandler(...args);
        const event = args[0] as { defaultPrevented?: boolean } | undefined;
        if (!event?.defaultPrevented) {
          slotHandler(...args);
        }
      };
    }
  }

  merged.ref = mergedRef;

  return cloneElement(child, merged);
});
