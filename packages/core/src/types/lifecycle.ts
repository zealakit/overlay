/** A function that releases a resource. Must be safe to call more than once. */
export type Cleanup = () => void;
