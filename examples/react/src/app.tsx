import { useEffect } from "react";
import { ContextMenuExamplesContent } from "./context-menu-examples";
import { DialogExamplesContent } from "./dialog-examples";
import { PlacementPlayground } from "./placement-playground";
import { PopoverExamplesContent } from "./popover-examples";
import { TooltipExamplesContent } from "./tooltip-examples";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="examples-section">
      <h2 className="examples-section-title">{title}</h2>
      {children}
    </section>
  );
}

export function App() {
  useEffect(() => {
    const scrollToHash = (): void => {
      const id = window.location.hash.replace(/^#/, "");
      if (!id) {
        return;
      }
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ block: "start" });
      });
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => {
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, []);

  return (
    <main className="page examples-page combined-examples">
      <header className="masthead">
        <p className="eyebrow">@zealakit/overlay-react</p>
        <h1>Overlay examples</h1>
        <p className="lede">
          All React component examples on one page. Use the section links to
          jump between the placement playground and each overlay family.
        </p>
        <nav className="examples-nav" aria-label="Example sections">
          <a href="#playground">Playground</a>
          <a href="#popover">Popover</a>
          <a href="#tooltip">Tooltip</a>
          <a href="#dialog">Dialog</a>
          <a href="#context-menu">ContextMenu</a>
        </nav>
      </header>

      <Section id="playground" title="Placement playground">
        <PlacementPlayground />
      </Section>

      <Section id="popover" title="Popover examples">
        <PopoverExamplesContent />
      </Section>

      <Section id="tooltip" title="Tooltip examples">
        <TooltipExamplesContent />
      </Section>

      <Section id="dialog" title="Dialog examples">
        <DialogExamplesContent />
      </Section>

      <Section id="context-menu" title="ContextMenu examples">
        <ContextMenuExamplesContent />
      </Section>
    </main>
  );
}
