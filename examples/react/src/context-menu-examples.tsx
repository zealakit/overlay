import { useState, type ReactNode } from "react";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@zealakit/overlay-react";

function ExampleCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="example-card">
      <h2>{title}</h2>
      <p className="example-description">{description}</p>
      <div className="example-body">{children}</div>
    </section>
  );
}

function BasicContextMenu() {
  const [lastAction, setLastAction] = useState("Nothing selected");
  return (
    <ExampleCard
      title="A. Basic"
      description="Right-click anywhere in the card. Selection closes the menu."
    >
      <ContextMenu>
        <ContextMenuTrigger className="context-menu-target">
          Right-click this card
        </ContextMenuTrigger>
        <ContextMenuContent className="context-menu-surface">
          <ContextMenuItem onSelect={() => setLastAction("Copy")}>
            Copy
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => setLastAction("Cut")}>
            Cut
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={() => setLastAction("Paste")}>
            Paste
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <p className="example-small">Last action: {lastAction}</p>
    </ExampleCard>
  );
}

function IconShortcutContextMenu() {
  return (
    <ExampleCard
      title="B. Icons and shortcut hints"
      description="Shortcut hints are presentational; the component does not register them."
    >
      <ContextMenu>
        <ContextMenuTrigger className="context-menu-target">
          Right-click for commands
        </ContextMenuTrigger>
        <ContextMenuContent className="context-menu-surface">
          <ContextMenuItem>
            <span aria-hidden="true">⧉</span> Copy
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            <span aria-hidden="true">✂</span> Cut
            <ContextMenuShortcut>⌘X</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            <span aria-hidden="true">⎘</span> Paste
            <ContextMenuShortcut>⌘V</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </ExampleCard>
  );
}

function GroupContextMenu() {
  return (
    <ExampleCard
      title="C. Groups, labels, separators"
      description="Labels and separators are not navigable menu items."
    >
      <ContextMenu>
        <ContextMenuTrigger className="context-menu-target">
          Right-click for grouped actions
        </ContextMenuTrigger>
        <ContextMenuContent className="context-menu-surface">
          <ContextMenuGroup>
            <ContextMenuLabel>Clipboard</ContextMenuLabel>
            <ContextMenuItem>Copy</ContextMenuItem>
            <ContextMenuItem>Paste</ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuLabel>Document</ContextMenuLabel>
            <ContextMenuItem>Rename</ContextMenuItem>
            <ContextMenuItem>Duplicate</ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    </ExampleCard>
  );
}

function CheckboxContextMenu() {
  const [grid, setGrid] = useState(true);
  const [guides, setGuides] = useState(false);
  return (
    <ExampleCard
      title="D. Checkbox items"
      description="Checkbox activation updates state and keeps the menu open."
    >
      <ContextMenu>
        <ContextMenuTrigger className="context-menu-target">
          Right-click view options
        </ContextMenuTrigger>
        <ContextMenuContent className="context-menu-surface">
          <ContextMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
            <span aria-hidden="true">{grid ? "✓" : " "}</span> Show grid
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem checked={guides} onCheckedChange={setGuides}>
            <span aria-hidden="true">{guides ? "✓" : " "}</span> Show guides
          </ContextMenuCheckboxItem>
        </ContextMenuContent>
      </ContextMenu>
      <p className="example-small">
        Grid: {String(grid)} · Guides: {String(guides)}
      </p>
    </ExampleCard>
  );
}

function RadioContextMenu() {
  const [density, setDensity] = useState("comfortable");
  return (
    <ExampleCard
      title="E. Radio group"
      description="One value per group; radio selection keeps the menu open."
    >
      <ContextMenu>
        <ContextMenuTrigger className="context-menu-target">
          Right-click density
        </ContextMenuTrigger>
        <ContextMenuContent className="context-menu-surface">
          <ContextMenuRadioGroup value={density} onValueChange={setDensity}>
            <ContextMenuLabel>Density</ContextMenuLabel>
            <ContextMenuRadioItem value="compact">
              <span aria-hidden="true">
                {density === "compact" ? "●" : "○"}
              </span>{" "}
              Compact
            </ContextMenuRadioItem>
            <ContextMenuRadioItem value="comfortable">
              <span aria-hidden="true">
                {density === "comfortable" ? "●" : "○"}
              </span>{" "}
              Comfortable
            </ContextMenuRadioItem>
            <ContextMenuRadioItem value="spacious">
              <span aria-hidden="true">
                {density === "spacious" ? "●" : "○"}
              </span>{" "}
              Spacious
            </ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuContent>
      </ContextMenu>
      <p className="example-small">Density: {density}</p>
    </ExampleCard>
  );
}

function SubmenuContextMenu() {
  return (
    <ExampleCard
      title="F. Nested submenu"
      description="Hover the submenu trigger, or use ArrowRight in LTR. Escape closes the submenu first."
    >
      <ContextMenu>
        <ContextMenuTrigger className="context-menu-target">
          Right-click for nested actions
        </ContextMenuTrigger>
        <ContextMenuContent className="context-menu-surface">
          <ContextMenuItem>Open</ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              Share <span aria-hidden="true">›</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="context-menu-surface">
              <ContextMenuItem>Email</ContextMenuItem>
              <ContextMenuItem>Message</ContextMenuItem>
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  More <span aria-hidden="true">›</span>
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="context-menu-surface">
                  <ContextMenuItem>Copy link</ContextMenuItem>
                  <ContextMenuItem>Export</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
    </ExampleCard>
  );
}

function DisabledDestructiveContextMenu() {
  return (
    <ExampleCard
      title="G. Disabled and destructive"
      description="Disabled items are skipped by keyboard navigation. Destructive is consumer styling only."
    >
      <ContextMenu>
        <ContextMenuTrigger className="context-menu-target">
          Right-click for actions
        </ContextMenuTrigger>
        <ContextMenuContent className="context-menu-surface">
          <ContextMenuItem>Archive</ContextMenuItem>
          <ContextMenuItem disabled>Move to restricted</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem className="context-menu-item--danger">
            Delete permanently
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </ExampleCard>
  );
}

function KeyboardContextMenu() {
  return (
    <ExampleCard
      title="H. Keyboard invocation"
      description="Focus the region, then press the Context Menu key or Shift+F10. The menu anchors to the region."
    >
      <ContextMenu>
        <ContextMenuTrigger className="context-menu-target">
          Focus me, then Shift+F10
        </ContextMenuTrigger>
        <ContextMenuContent className="context-menu-surface">
          <ContextMenuItem>Keyboard action</ContextMenuItem>
          <ContextMenuItem>Another command</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </ExampleCard>
  );
}

function CardContextMenu() {
  return (
    <ExampleCard
      title="I. Card row"
      description="Contextual commands on a consumer card layout; the trigger is not required to be a button."
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {/* biome-ignore lint/a11y/noNoninteractiveTabindex: the focusable card is the keyboard context-menu surface */}
          <article className="context-menu-card" tabIndex={0}>
            <strong>Quarterly report.pdf</strong>
            <span>2.4 MB · Edited yesterday</span>
          </article>
        </ContextMenuTrigger>
        <ContextMenuContent className="context-menu-surface">
          <ContextMenuItem>Open</ContextMenuItem>
          <ContextMenuItem>Download</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>Rename</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </ExampleCard>
  );
}

function RtlContextMenu() {
  return (
    <ExampleCard
      title="J. RTL"
      description="Direction flows to the menu; the submenu opens to the left and logical arrow keys reverse."
    >
      <div dir="rtl">
        <ContextMenu dir="rtl">
          <ContextMenuTrigger className="context-menu-target">
            انقر بزر الفأرة الأيمن هنا
          </ContextMenuTrigger>
          <ContextMenuContent className="context-menu-surface">
            <ContextMenuItem>نسخ</ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                مشاركة <span aria-hidden="true">‹</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="context-menu-surface">
                <ContextMenuItem>بريد إلكتروني</ContextMenuItem>
                <ContextMenuItem>رسالة</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      </div>
    </ExampleCard>
  );
}

function EdgeContextMenu() {
  return (
    <ExampleCard
      title="K. Viewport edge"
      description="Open near a viewport edge; collision handling flips or shifts the menu back into view."
    >
      <ContextMenu>
        <ContextMenuTrigger className="context-menu-target context-menu-edge-target">
          Right-click near the edge
        </ContextMenuTrigger>
        <ContextMenuContent className="context-menu-surface">
          <ContextMenuItem>Command one</ContextMenuItem>
          <ContextMenuItem>Command two</ContextMenuItem>
          <ContextMenuItem>Command three</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </ExampleCard>
  );
}

function DialogContextMenu() {
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <ExampleCard
      title="L. Inside Dialog"
      description="The ContextMenu participates in layer priority inside a Dialog and can open a child Dialog."
    >
      <Dialog>
        <DialogTrigger className="example-trigger">
          Open parent Dialog
        </DialogTrigger>
        <DialogContent className="dialog-popup">
          <DialogTitle>ContextMenu in Dialog</DialogTitle>
          <p>Right-click inside the Dialog content.</p>
          <ContextMenu>
            <ContextMenuTrigger className="context-menu-target context-menu-in-dialog">
              Right-click inside Dialog
            </ContextMenuTrigger>
            <ContextMenuContent className="context-menu-surface">
              <ContextMenuItem onSelect={() => setDialogOpen(true)}>
                Open child Dialog
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </DialogContent>
      </Dialog>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="dialog-popup">
          <DialogTitle>Child Dialog</DialogTitle>
          <p>Opened from a ContextMenu item.</p>
        </DialogContent>
      </Dialog>
    </ExampleCard>
  );
}

export function ContextMenuExamplesContent() {
  return (
    <div className="example-grid">
      <BasicContextMenu />
      <IconShortcutContextMenu />
      <GroupContextMenu />
      <CheckboxContextMenu />
      <RadioContextMenu />
      <SubmenuContextMenu />
      <DisabledDestructiveContextMenu />
      <KeyboardContextMenu />
      <CardContextMenu />
      <RtlContextMenu />
      <EdgeContextMenu />
      <DialogContextMenu />
    </div>
  );
}
