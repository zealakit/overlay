---
name: readme-system
description: >-
  Use when creating, editing, translating, or reviewing any README in Zealakit Overlay
  (root or package). Defines the hub-and-spoke README structure, table and code rules,
  link rules, voice, and the pre-flight checklist. README files are the only product
  documentation; there is no `docs/` folder.
---

# README system (hub + spoke)

One root README for navigation, one README per package holding the full API. Each README must
read well on GitHub and npmjs. English is the source; Vietnamese (`README_VI.md`) and Chinese
(`README_CN.md`) mirror it.

Load [overlay](../overlay/SKILL.md) first for architecture. Run `pnpm readme:check` after any
README change.

## 0. Project constants

| Item | Value |
| --- | --- |
| Org / repo | `zealakit/overlay` |
| Absolute base | `https://github.com/zealakit/overlay/blob/main` |
| Cover image | `https://github.com/zealakit/overlay/blob/main/assets/cover.svg?raw=true` |
| License line | `MIT © Zealakit` |
| Skill links | `.agents/skills/overlay/SKILL.md`, `.agents/skills/readme-system/SKILL.md` |

Canonical `> **Note**` (translated, but identical across every README of one language):

> **Note**
> Overlay is headless: it ships no CSS and renders no styled markup. Popover, Tooltip, Dialog, and ContextMenu are implemented. Select, Combobox, DatePicker, DropdownMenu, Menubar, and command palette are not.

Packages: `@zealakit/overlay-core` (framework-agnostic kernel), `-vanilla`, `-react`, `-vue`,
`-svelte`. React, Vue, and Svelte are component packages; Core and Vanilla use the
non-component layout.

## 1. File structure

- `README.md` (EN) + `README_VI.md` + `README_CN.md` at the root and in **every** package.
- No READMEs for `examples/` or `monitor/`.
- Every translation matches the EN headings, section order, tables, and code blocks. Headings
  stay in English in every language so anchors match.
- No `docs/` folder. Design rationale lives in the owning package README; release steps live
  in the [overlay skill](../overlay/SKILL.md).

## 2. Root README: mandatory order

1. `# Zealakit Overlay`
2. Language switcher: `[English](abs) | [Tiếng Việt](abs) | [中文](abs)`
3. Cover image: `![Zealakit Overlay cover](<base>/assets/cover.svg?raw=true)`
4. One tagline sentence (what it is, who it is for), bullets for the top-level units, one
   paragraph on what it only does and does not do.
5. `> **Note**` scope warning.
6. `## Packages`: table `Package | Framework/Runtime | Documentation` with absolute links to
   package READMEs, then one sentence: each package installs independently, no shared runtime.
7. `## Installation`: one `bash` block with `npm i` per package. No explanation.
8. `## Examples`: install/build commands and the `dev:*` scripts.
9. `## Dependency monitor`: one command, the URL, a link to details.
10. `## AI Agent Skills`: links to agent-facing skills and `AGENTS.md`.
11. `## License`.

No badges, screenshot gallery, changelog, roadmap, contributing, or props/API tables.

## 3. Package README: mandatory order

1. `# <exact npm package name>` (must equal `package.json` `name`)
2. Language switcher + cover (reuse the root image)
3. Lead paragraph 1: "Headless <A> and <B> for <framework>. Provides <...>. You own visual
   styling."
4. Lead paragraph 2: styling contract: where styles go and the animation consequence.
5. `> **Note**` (verbatim from section 0)
6. `## Install`: one code block plus one line of peer dependencies with version ranges.
7. Component packages (React, Vue, Svelte): one `## <Primitive>` per primitive, each with, in
   root → trigger → content order: `### Quick start`, one `### \`<Component>\` props` table per
   component, `### Controlled usage`, `### <Feature> configuration`, `### \`<special prop>\``.
8. `## Styling hooks`: table `Attribute | Where | Purpose`.
9. Framework section when needed (`## Next.js App Router`, `## Nuxt`, `## SvelteKit`).
10. `## AI Agent Skill`: one sentence and one link.
11. `## License`.

Vue and Svelte add `## Composables` / `## Controllers and actions` and `## Lifecycle` after the
primitives. Non-component packages (Core, Vanilla) replace props tables with option/flag
tables and use: `## Install`, `## Public API`, `## Markup` (Vanilla only: host attributes,
child markers, events), `## Usage` (Quick start, options, controlled usage, animation),
`## Lifecycle` (create, refresh, destroy; guard against double init), `## Styling hooks`,
`## AI Agent Skill`, `## License`.

## 4. Table rules

- Props header is always `| Prop | Type | Default | Description |` (English in every language).
- Types in backticks; unions escape the pipe as `\|`; no default is `—`; required is
  `**required**`.
- Last row describes forwarding (`...div props`, `...button props`, or "no other props are
  forwarded").
- Directly under a table: one or two sentences on consequences (attributes set, keyboard
  support, scope).
- One table per component; never merge components.
- Defaults must match the code. Verify against the source before writing.

## 5. Code block rules

- Correct fence: `tsx`, `vue`, `svelte`, `html`, `bash`, `ts`, `css`.
- Minimal examples sharing one sample (an "Edit profile" panel with the description "Update
  your profile information.").
- Imports use the real package name. No hypothetical code.
- Rewrite behavior in each framework's idiom (props vs `v-model`/refs vs `bind:`); never copy a
  block across frameworks.
- Code blocks are identical across languages.

## 6. Link and image rules

- All cross-links and images use absolute `https://github.com/zealakit/overlay/blob/main/...`
  URLs, because READMEs also render on npm.
- Images append `?raw=true`. Deep anchors use `<abs-file>#section-slug`.
- The switcher lists every language in order and points at the right file.

## 7. Voice

Second person, present tense, declarative, short sentences. No marketing, no emoji. Paragraphs
are at most three sentences, then code or a table. State the reason right after the behavior.
Technical terms (props, attributes, CSS variables, component names) are never translated.

## 8. Pre-flight checklist

- [ ] Root README has no detailed props or API tables.
- [ ] Every package README stands alone (tagline, Note, Install complete).
- [ ] Sections are ordered identically across packages of the same kind.
- [ ] Every heading, table, and code block exists in EN, VI, and CN.
- [ ] No relative links; no `TODO`.
- [ ] H1 matches `package.json` `name`.
- [ ] Defaults in tables match the code.
- [ ] `pnpm readme:check` passes.
