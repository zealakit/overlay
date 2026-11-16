import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./examples/popover-examples.css";
import "./examples/tooltip-examples.css";
import "./examples/dialog-examples.css";
import "./examples/context-menu-examples.css";

export const metadata: Metadata = {
  title: "@zealakit/overlay-react · Next.js",
  description: "App Router SSR and hydration smoke test for overlay primitives",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
