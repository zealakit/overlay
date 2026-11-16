import { OverlayDemo } from "./overlay-demo";

export default function Page() {
  return (
    <main className="page">
      <h1>@zealakit/overlay-react · Next.js</h1>
      <p className="lede">
        This page is a Server Component. The interactive overlay lives in a
        dedicated Client Component, and the portal only mounts after hydration.
      </p>
      <OverlayDemo />
    </main>
  );
}
