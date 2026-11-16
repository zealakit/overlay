"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useState,
  useContext,
  type ComponentPropsWithoutRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { Slot, composeRefs } from "../slot.js";
import {
  ContextMenuGroupContext,
  ContextMenuRadioGroupContext,
  useContextMenuContext,
  useContextMenuRadioGroup,
  type ContextMenuGroupContextValue,
  type ContextMenuRadioGroupContextValue,
} from "./context.js";
import type { ContextMenuDataAttributes } from "./types.js";

export type ContextMenuSelectEvent = {
  originalEvent: MouseEvent | KeyboardEvent;
  preventDefault(): void;
  readonly defaultPrevented: boolean;
};

function createSelectEvent(
  originalEvent: MouseEvent | KeyboardEvent,
): ContextMenuSelectEvent {
  let prevented = false;
  return {
    originalEvent,
    preventDefault() {
      prevented = true;
    },
    get defaultPrevented() {
      return prevented;
    },
  };
}

type ItemActivationOptions = {
  closeOnSelect?: boolean;
};

function useItemActivation(options: ItemActivationOptions) {
  const menu = useContextMenuContext("ContextMenuItem");
  const activate = (
    event: MouseEvent | KeyboardEvent,
    onSelect?: (event: ContextMenuSelectEvent) => void,
  ): void => {
    const selectEvent = createSelectEvent(event);
    onSelect?.(selectEvent);
    if (options.closeOnSelect !== false && !selectEvent.defaultPrevented) {
      menu.close("select");
    }
  };
  return activate;
}

export type ContextMenuItemProps = ComponentPropsWithoutRef<"div"> &
  ContextMenuDataAttributes & {
    asChild?: boolean;
    disabled?: boolean;
    onSelect?: (event: ContextMenuSelectEvent) => void;
    /** Set false (or call preventDefault on the select event) to keep the menu open. */
    closeOnSelect?: boolean;
  };

/** Standard command item. Selection closes the menu by default. */
export const ContextMenuItem = forwardRef<HTMLElement, ContextMenuItemProps>(
  function ContextMenuItem(
    {
      asChild = false,
      disabled = false,
      onSelect,
      closeOnSelect,
      onClick,
      onKeyDown,
      children,
      ...rest
    },
    forwardedRef,
  ) {
    const activate = useItemActivation({ closeOnSelect });
    const refs = useMemo(() => composeRefs(forwardedRef), [forwardedRef]);

    const handleClick = (event: ReactMouseEvent<HTMLElement>): void => {
      onClick?.(event as ReactMouseEvent<HTMLDivElement>);
      if (event.defaultPrevented || disabled) {
        return;
      }
      activate(event.nativeEvent, onSelect);
    };

    const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>): void => {
      onKeyDown?.(event as ReactKeyboardEvent<HTMLDivElement>);
      if (event.defaultPrevented || disabled) {
        return;
      }
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      activate(event.nativeEvent, onSelect);
    };

    const shared = {
      ...rest,
      role: "menuitem" as const,
      tabIndex: -1,
      "aria-disabled": disabled ? true : undefined,
      "data-disabled": disabled ? "" : undefined,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
    };

    if (asChild) {
      return (
        <Slot {...shared} ref={refs}>
          {children}
        </Slot>
      );
    }

    return (
      <div {...shared} ref={refs}>
        {children}
      </div>
    );
  },
);

export type ContextMenuCheckboxItemProps = Omit<
  ContextMenuItemProps,
  "role" | "onSelect" | "closeOnSelect"
> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Defaults to false for checkbox items. */
  closeOnSelect?: boolean;
};

export const ContextMenuCheckboxItem = forwardRef<
  HTMLElement,
  ContextMenuCheckboxItemProps
>(function ContextMenuCheckboxItem(
  {
    asChild = false,
    checked: controlledChecked,
    defaultChecked = false,
    onCheckedChange,
    closeOnSelect = false,
    disabled = false,
    onClick,
    onKeyDown,
    children,
    ...rest
  },
  forwardedRef,
) {
  const [uncontrolledChecked, setUncontrolledChecked] =
    useState(defaultChecked);
  const isChecked = controlledChecked ?? uncontrolledChecked;
  const menu = useContextMenuContext("ContextMenuCheckboxItem");
  const refs = useMemo(() => composeRefs(forwardedRef), [forwardedRef]);

  const activate = (): void => {
    if (disabled) {
      return;
    }
    const next = !isChecked;
    if (controlledChecked === undefined) {
      setUncontrolledChecked(next);
    }
    onCheckedChange?.(next);
    if (closeOnSelect) {
      menu.close("select");
    }
  };

  const handleClick = (event: ReactMouseEvent<HTMLElement>): void => {
    onClick?.(event as ReactMouseEvent<HTMLDivElement>);
    if (event.defaultPrevented) {
      return;
    }
    activate();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>): void => {
    onKeyDown?.(event as ReactKeyboardEvent<HTMLDivElement>);
    if (event.defaultPrevented) {
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    activate();
  };

  const shared = {
    ...rest,
    role: "menuitemcheckbox" as const,
    tabIndex: -1,
    "aria-checked": isChecked,
    "aria-disabled": disabled ? true : undefined,
    "data-state": isChecked ? "checked" : "unchecked",
    "data-disabled": disabled ? "" : undefined,
    onClick: handleClick,
    onKeyDown: handleKeyDown,
  };

  if (asChild) {
    return (
      <Slot {...shared} ref={refs}>
        {children}
      </Slot>
    );
  }
  return (
    <div {...shared} ref={refs}>
      {children}
    </div>
  );
});

export type ContextMenuRadioGroupProps = ComponentPropsWithoutRef<"div"> &
  ContextMenuDataAttributes & {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
  };

export const ContextMenuRadioGroup = forwardRef<
  HTMLDivElement,
  ContextMenuRadioGroupProps
>(function ContextMenuRadioGroup(
  {
    value: controlledValue,
    defaultValue,
    onValueChange,
    children,
    role = "group",
    ...rest
  },
  forwardedRef,
) {
  const [uncontrolledValue, setUncontrolledValue] = useState<
    string | undefined
  >(defaultValue);
  const value = controlledValue ?? uncontrolledValue;

  const [labelId, setLabelId] = useState<string | null>(null);
  const context = useMemo<ContextMenuRadioGroupContextValue>(
    () => ({
      value,
      setValue(next) {
        if (controlledValue === undefined) {
          setUncontrolledValue(next);
        }
        onValueChange?.(next);
      },
    }),
    [controlledValue, onValueChange, value],
  );
  const groupContext = useMemo<ContextMenuGroupContextValue>(
    () => ({ setLabelId }),
    [],
  );

  return (
    <ContextMenuGroupContext.Provider value={groupContext}>
      <ContextMenuRadioGroupContext.Provider value={context}>
        {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: a radio group is labelled by its non-focusable label child */}
        <div
          {...rest}
          ref={forwardedRef}
          role={role}
          aria-labelledby={rest["aria-labelledby"] ?? labelId ?? undefined}
        >
          {children}
        </div>
      </ContextMenuRadioGroupContext.Provider>
    </ContextMenuGroupContext.Provider>
  );
});

export type ContextMenuRadioItemProps = Omit<
  ContextMenuItemProps,
  "role" | "onSelect" | "closeOnSelect"
> & {
  value: string;
  /** Defaults to false for radio items. */
  closeOnSelect?: boolean;
};

export const ContextMenuRadioItem = forwardRef<
  HTMLElement,
  ContextMenuRadioItemProps
>(function ContextMenuRadioItem(
  {
    asChild = false,
    value,
    closeOnSelect = false,
    disabled = false,
    onClick,
    onKeyDown,
    children,
    ...rest
  },
  forwardedRef,
) {
  const group = useContextMenuRadioGroup("ContextMenuRadioItem");
  const menu = useContextMenuContext("ContextMenuRadioItem");
  const checked = group.value === value;
  const refs = useMemo(() => composeRefs(forwardedRef), [forwardedRef]);

  const activate = (): void => {
    if (disabled) {
      return;
    }
    group.setValue(value);
    if (closeOnSelect) {
      menu.close("select");
    }
  };

  const handleClick = (event: ReactMouseEvent<HTMLElement>): void => {
    onClick?.(event as ReactMouseEvent<HTMLDivElement>);
    if (event.defaultPrevented) {
      return;
    }
    activate();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>): void => {
    onKeyDown?.(event as ReactKeyboardEvent<HTMLDivElement>);
    if (event.defaultPrevented) {
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    activate();
  };

  const shared = {
    ...rest,
    role: "menuitemradio" as const,
    tabIndex: -1,
    "aria-checked": checked,
    "aria-disabled": disabled ? true : undefined,
    "data-state": checked ? "checked" : "unchecked",
    "data-disabled": disabled ? "" : undefined,
    onClick: handleClick,
    onKeyDown: handleKeyDown,
  };

  if (asChild) {
    return (
      <Slot {...shared} ref={refs}>
        {children}
      </Slot>
    );
  }
  return (
    <div {...shared} ref={refs}>
      {children}
    </div>
  );
});

export type ContextMenuGroupProps = ComponentPropsWithoutRef<"div"> &
  ContextMenuDataAttributes & {
    children?: ReactNode;
  };

export const ContextMenuGroup = forwardRef<
  HTMLDivElement,
  ContextMenuGroupProps
>(function ContextMenuGroup({ children, ...rest }, forwardedRef) {
  const [labelId, setLabelId] = useState<string | null>(null);
  const context = useMemo<ContextMenuGroupContextValue>(
    () => ({ setLabelId }),
    [],
  );

  return (
    <ContextMenuGroupContext.Provider value={context}>
      {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: a group is labelled by its non-focusable label child */}
      <div
        {...rest}
        ref={forwardedRef}
        role={rest.role ?? "group"}
        aria-labelledby={rest["aria-labelledby"] ?? labelId ?? undefined}
      >
        {children}
      </div>
    </ContextMenuGroupContext.Provider>
  );
});

export type ContextMenuLabelProps = ComponentPropsWithoutRef<"div"> &
  ContextMenuDataAttributes;

/** Non-focusable group label. It is associated with the nearest Group. */
export const ContextMenuLabel = forwardRef<
  HTMLDivElement,
  ContextMenuLabelProps
>(function ContextMenuLabel({ id, ...rest }, forwardedRef) {
  const generatedId = useId();
  const labelId = id ?? generatedId;
  const group = useContext(ContextMenuGroupContext);
  const setLabelId = group?.setLabelId;
  useEffect(() => {
    setLabelId?.(labelId);
    return () => {
      setLabelId?.(null);
    };
  }, [labelId, setLabelId]);

  return (
    <div {...rest} ref={forwardedRef} id={labelId} data-context-menu-label="" />
  );
});

export type ContextMenuSeparatorProps = ComponentPropsWithoutRef<"hr"> &
  ContextMenuDataAttributes;

/** Non-focusable semantic menu separator. */
export const ContextMenuSeparator = forwardRef<
  HTMLHRElement,
  ContextMenuSeparatorProps
>(function ContextMenuSeparator(props, forwardedRef) {
  return <hr {...props} ref={forwardedRef} data-context-menu-separator="" />;
});

export type ContextMenuShortcutProps = ComponentPropsWithoutRef<"span"> &
  ContextMenuDataAttributes;

/** Presentational keyboard hint. It does not register a shortcut. */
export const ContextMenuShortcut = forwardRef<
  HTMLSpanElement,
  ContextMenuShortcutProps
>(function ContextMenuShortcut(props, forwardedRef) {
  return (
    <span
      {...props}
      ref={forwardedRef}
      aria-hidden="true"
      data-context-menu-shortcut=""
    />
  );
});
