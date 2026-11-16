export type ContextMenuSide = "top" | "right" | "bottom" | "left";
export type ContextMenuAlign = "start" | "center" | "end";

export type ContextMenuCollisionAvoidance = {
  flip?: boolean;
  shift?: boolean;
};

export type ContextMenuDataAttributes = {
  [key: `data-${string}`]: string | number | boolean | undefined;
};
