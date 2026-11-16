# 0.1.0 Release Checklist

Audit date: **2026-11-15**. This checklist covers the publishable packages only; no package was
published during the audit.

## Status

| Check | Status | Evidence |
| --- | --- | --- |
| All packages build | Passed | `pnpm build` / `pnpm check` |
| All tests pass | Passed | Core 50, Vanilla 41, React 128, Vue 22, Svelte 23 |
| TypeScript declarations valid | Passed | Package typechecks and isolated consumer `tsc` |
| Package exports resolve | Passed | Root imports and blocked private subpaths in isolated consumers |
| Dependency boundaries correct | Passed | Core has no framework imports; adapters depend only on Core |
| Consumer installation from tarballs | Passed | npm consumers for Core, Vanilla, React 18/19, Vue, Svelte |
| SSR imports safe | Passed | Node 20 bare imports; React/Vue/Svelte SSR; Next/Astro builds |
| Browser interaction regressions | Passed | Chrome: Popover, Tooltip, Dialog, ContextMenu, nested, RTL, outside/Escape |
| Popup window-scroll regression | Passed | 80px down/up; gap stayed `8px` at the next animation frame |
| Examples build | Passed | Vanilla, React, Vue, Svelte, Next.js, Astro |
| Documentation reviewed | Passed | README, package READMEs, and `docs/` reviewed |
| npm tarball contents correct | Passed | Only `package.json`, `README.md`, `LICENSE`, `dist/**` |
| Package metadata complete | Passed | Name/version/license/repository/homepage/bugs/engines/exports |
| License and README included | Passed | Verified in all five tarballs |
| No unintended private files | Passed | No source, tests, maps, workspace aliases, or credentials |
| Release notes prepared | Passed | `CHANGELOG.md` 0.1.0 |

## Not applicable

| Check | Reason |
| --- | --- |
| CommonJS output | Packages intentionally ship ESM only |
| Changesets | Existing project strategy is manual coordinated versioning |
| CI release workflow | No publishing workflow is part of this phase |
| npm publish / credentials | Publishing is explicitly out of scope |

## Manual release actions

- Review `CHANGELOG.md` and the final `pnpm pack:packages` artifacts.
- Publish Core first, then adapters with `publishConfig.access: public`.
- Create a `v0.1.0` git tag only after publishing or immediately before the authorized release.
- Verify the public npm manifests after publish, especially adapter Core ranges.

## Known limitations

These are documented product limitations, not release blockers:

- No ContextMenuArrow, AlertDialog, DropdownMenu, Menubar, or Select.
- No built-in styling, animation system, or mobile long-press context menu.
- Vanilla/Vue/Svelte expose the shared high-level controllers rather than full React compound
  component parity.
