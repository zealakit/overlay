"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { RefCallback } from "react";
import {
  type Positioner,
  type PositionerOptions,
  type PositionerResult,
  type ReferenceElement,
  createPositioner,
  isSamePositionerResult,
} from "@zealakit/overlay-core";

export type UsePositionerOptions = PositionerOptions & {
  /**
   * Explicit reference, including a virtual point anchor. When omitted, the
   * callback `referenceRef` is used.
   */
  reference?: ReferenceElement | null;
};

export type UsePositionerReturn = {
  result: PositionerResult | null;
  update: () => Promise<PositionerResult | null>;
  /** Callback ref for the anchor element. */
  referenceRef: RefCallback<Element>;
  /** Callback ref for the floating element. */
  floatingRef: RefCallback<HTMLElement>;
  referenceElement: Element | null;
  floatingElement: HTMLElement | null;
};

/**
 * React positioning session.
 *
 * The hook owns a Core positioner created in an effect (never during render).
 * Because React refs do not re-render when `.current` changes, it returns
 * callback refs that track element mount/unmount in state; the positioner is
 * updated only when the elements actually change.
 */
export function usePositioner(
  options: UsePositionerOptions = {},
): UsePositionerReturn {
  const {
    reference: explicitReference,
    placement,
    offset,
    alignOffset,
    flip,
    shift,
    padding,
    boundary,
    strategy,
    autoUpdate,
    arrow,
  } = options;

  const initialOptionsRef = useRef(options);
  const positionerRef = useRef<Positioner | null>(null);
  const referenceElementRef = useRef<Element | null>(null);
  const floatingElementRef = useRef<HTMLElement | null>(null);
  const latestResultRef = useRef<PositionerResult | null>(null);
  const [result, setResult] = useState<PositionerResult | null>(null);
  const [referenceElement, setReferenceElement] = useState<Element | null>(
    null,
  );
  const [floatingElement, setFloatingElement] = useState<HTMLElement | null>(
    null,
  );
  const skipInitialOptionsEffect = useRef(true);

  const referenceRef = useCallback<RefCallback<Element>>((element) => {
    referenceElementRef.current = element;
    setReferenceElement(element);
    if (!element) {
      latestResultRef.current = null;
      setResult(null);
    }
  }, []);
  const floatingRef = useCallback<RefCallback<HTMLElement>>((element) => {
    floatingElementRef.current = element;
    setFloatingElement(element);
    if (!element) {
      latestResultRef.current = null;
      setResult(null);
    }
  }, []);

  useEffect(() => {
    const positioner = createPositioner(initialOptionsRef.current);
    positionerRef.current = positioner;

    const unsubscribe = positioner.subscribe((next) => {
      // Ignore late results after the floating element went away.
      if (!floatingElementRef.current) {
        return;
      }
      if (isSamePositionerResult(latestResultRef.current, next)) {
        return;
      }
      latestResultRef.current = next;
      flushSync(() => {
        setResult(next);
      });
    });

    return () => {
      unsubscribe();
      positioner.dispose();
      positionerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const positioner = positionerRef.current;
    if (!positioner) {
      return;
    }

    const resolvedReference =
      explicitReference !== undefined ? explicitReference : referenceElement;
    if (!resolvedReference && latestResultRef.current !== null) {
      latestResultRef.current = null;
      setResult(null);
    }
    positioner.setReference(resolvedReference);
  }, [explicitReference, referenceElement]);

  useEffect(() => {
    const positioner = positionerRef.current;
    if (!positioner) {
      return;
    }

    if (!floatingElement && latestResultRef.current !== null) {
      latestResultRef.current = null;
      setResult(null);
    }
    positioner.setFloating(floatingElement);
  }, [floatingElement]);

  useEffect(() => {
    const positioner = positionerRef.current;
    if (!positioner) {
      return;
    }

    if (skipInitialOptionsEffect.current) {
      skipInitialOptionsEffect.current = false;
      return;
    }

    positioner.setOptions({
      placement,
      offset,
      alignOffset,
      flip,
      shift,
      padding,
      boundary,
      strategy,
      autoUpdate,
      arrow,
    });
  }, [
    placement,
    offset,
    alignOffset,
    flip,
    shift,
    padding,
    boundary,
    strategy,
    autoUpdate,
    arrow,
  ]);

  const update = useCallback(
    () => positionerRef.current?.update() ?? Promise.resolve(null),
    [],
  );

  return {
    result,
    update,
    referenceRef,
    floatingRef,
    referenceElement,
    floatingElement,
  };
}
