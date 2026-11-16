# Releasing Zealakit Overlay

All five packages are released together at the same version. The initial release is
**0.1.0**. Publishing is a manual, authorized step; no repository script publishes packages.

## Packages

1. `@zealakit/overlay-core`
2. `@zealakit/overlay-vanilla`
3. `@zealakit/overlay-react`
4. `@zealakit/overlay-vue`
5. `@zealakit/overlay-svelte`

Adapters depend only on Core. Core has a single runtime dependency,
`@floating-ui/dom`, and no framework peer. Published adapters declare their framework as a
peer dependency.

## Versioning

- Coordinated `0.1.0` for all packages.
- Adapters keep `workspace:^` for Core in the repository. `pnpm pack`/`pnpm publish` rewrites it
  to `^0.1.0` in the published manifest.
- Bump all packages together unless there is a concrete reason for independent versions.
- Changesets and automated publishing are intentionally not used at this stage.
- Tag the release as `v0.1.0` only after the preflight checklist passes. Release notes are in
  [`CHANGELOG.md`](../CHANGELOG.md).

## Peer support

| Adapter | Peer range | Validated consumer versions |
| --- | --- | --- |
| React | `^18.0.0 \|\| ^19.0.0` | React 18.3.1 and 19.x |
| Vue | `^3.5.0` | Vue 3.5.x |
| Svelte | `^5.0.0` | Svelte 5.x |

## Preflight

```bash
pnpm install --frozen-lockfile
pnpm clean
pnpm check
pnpm --filter @zealakit/overlay-vanilla-example run build
pnpm --filter @zealakit/overlay-react-example run build
pnpm --filter @zealakit/overlay-vue-example run build
pnpm --filter @zealakit/overlay-svelte-example run build
pnpm --filter @zealakit/overlay-nextjs-example run build
pnpm --filter @zealakit/overlay-astro-example run build
pnpm pack:packages
```

`pnpm pack:packages` writes tarballs to `artifacts/`. It does not publish.

Inspect every tarball before release:

- only `package.json`, `README.md`, `LICENSE`, and `dist/**` are present;
- `workspace:` does not appear in the packed manifest;
- the internal Core dependency is `^0.1.0`;
- `main`, `module`, `types`, and `exports` point into `dist`;
- no source, tests, source maps, local absolute paths, credentials, or workspace config are
  present;
- README and LICENSE are present;
- metadata includes repository, homepage, bugs, license, Node engine, and framework peers.

## Consumer installation validation

Validate the packed artifacts in temporary projects outside the repository. The packages are
not on the public registry before the first release, so local tarballs are required:

- install each package from its tarball;
- for adapters, also provide the Core tarball (for example with a package-manager override);
- install the adapter's framework peer from the registry;
- import the documented public APIs;
- run at least one DOM/runtime path where applicable;
- run a TypeScript consumer build;
- verify Node/SSR imports do not require a browser.

Do not use `workspace:*` aliases or direct `packages/*` imports to validate publishability.

## Release checklist

See [`docs/release-checklist.md`](release-checklist.md) for the current 0.1.0 audit.

- [ ] All packages build.
- [ ] All package tests pass.
- [ ] Typecheck and declarations pass in isolated consumers.
- [ ] Package exports and types resolve.
- [ ] Dependency boundaries are correct (adapters → Core only).
- [ ] Consumer installation from tarballs passes for all packages.
- [ ] SSR imports and framework SSR builds pass.
- [ ] Browser interaction regressions pass.
- [ ] Popup window-scroll regression is verified in a real browser.
- [ ] All examples build.
- [ ] README, package READMEs, and `docs/` are reviewed.
- [ ] Tarball contents and metadata are correct.
- [ ] License and README are included in every tarball.
- [ ] No private files are published.
- [ ] Release notes and git tag are prepared.

## Manual publish

Publish Core first, then adapters. Use npm access `public` (also set in each manifest's
`publishConfig`). The repository does not run `npm publish` or `pnpm publish` from its scripts.

## Scope

Popover, Tooltip, Dialog, and ContextMenu are part of the 0.1.0 release for React; Vanilla, Vue,
and Svelte expose the shared high-level controllers/composables. Documentation lives in the README,
package READMEs, and `docs/`. The project does not use Storybook, Changesets, automated publishing,
or a package versioning service.
