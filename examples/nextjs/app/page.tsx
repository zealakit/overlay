import { ExamplesApp } from "./examples/examples-app";

// Server Component shell: the interactive examples live in a Client Component,
// and portals only mount after hydration.
export default function Page() {
  return <ExamplesApp />;
}
