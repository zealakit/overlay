/**
 * Manual npm publish for Zealakit Overlay packages.
 *
 *   pnpm npm:publish:check
 *   pnpm npm:publish:core | npm:publish:vanilla | npm:publish:react | npm:publish:vue | npm:publish:svelte
 *   pnpm npm:publish:all
 *
 * Every package is validated, built, typechecked, tested, packed, and inspected before any
 * upload. Publishing then uploads the already-built tarballs in core → vanilla → react → vue →
 * svelte order, so `workspace:^` ranges are rewritten by `pnpm pack`, never by hand.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const ARTIFACT_DIR = path.join(PROJECT_ROOT, "artifacts", "npm-publish");
const CORE_NAME = "@zealakit/overlay-core";

type PackageId = "core" | "vanilla" | "react" | "vue" | "svelte";
type Command = "check" | PackageId | "all";
type DependencyField =
  | "dependencies"
  | "devDependencies"
  | "peerDependencies"
  | "optionalDependencies";

type PackageJson = {
  name?: string;
  version?: string;
  private?: boolean;
  files?: string[];
  main?: string;
  module?: string;
  types?: string;
  exports?: unknown;
  license?: string;
  engines?: {
    node?: string;
  };
  repository?: {
    type?: string;
    url?: string;
    directory?: string;
  };
  homepage?: string;
  bugs?: {
    url?: string;
  };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  publishConfig?: {
    access?: string;
  };
  scripts?: Record<string, string>;
};

type PackageMeta = {
  id: PackageId;
  label: string;
  dirName: string;
  expectedName: string;
};

type PackageConfig = PackageMeta & {
  packageDir: string;
  packageJsonPath: string;
  manifest: PackageJson;
};

const PACKAGES: readonly PackageMeta[] = [
  {
    id: "core",
    label: "Core",
    dirName: "core",
    expectedName: CORE_NAME,
  },
  {
    id: "vanilla",
    label: "Vanilla",
    dirName: "vanilla",
    expectedName: "@zealakit/overlay-vanilla",
  },
  {
    id: "react",
    label: "React",
    dirName: "react",
    expectedName: "@zealakit/overlay-react",
  },
  {
    id: "vue",
    label: "Vue",
    dirName: "vue",
    expectedName: "@zealakit/overlay-vue",
  },
  {
    id: "svelte",
    label: "Svelte",
    dirName: "svelte",
    expectedName: "@zealakit/overlay-svelte",
  },
];

const VERSION_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const FRAMEWORK_PEERS: Partial<Record<PackageId, readonly string[]>> = {
  react: ["react", "react-dom"],
  vue: ["vue"],
  svelte: ["svelte"],
};
const DEPENDENCY_FIELDS: readonly DependencyField[] = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];
const REQUIRED_SCRIPTS = ["build", "typecheck", "test"] as const;
const REQUIRED_TARBALL_ENTRIES = [
  "package/package.json",
  "package/README.md",
  "package/LICENSE",
  "package/dist/index.js",
  "package/dist/index.d.ts",
] as const;
const FORBIDDEN_TARBALL_PATTERNS: readonly RegExp[] = [
  /\/src\//,
  /\/tests\//,
  /\.map$/,
  /(^|\/)node_modules\//,
  /(^|\/)\.npmrc$/,
  /(^|\/)\.env(?:\.|$)/,
  /(^|\/)pnpm-lock\.yaml$/,
  /(^|\/)\.tsbuildinfo$/,
];

function printHelp(): void {
  console.log(`Usage:
  pnpm npm:publish:check
  pnpm npm:publish:core
  pnpm npm:publish:vanilla
  pnpm npm:publish:react
  pnpm npm:publish:vue
  pnpm npm:publish:svelte
  pnpm npm:publish:all

Or:
  node --strip-types scripts/npm-publish.ts <check|core|vanilla|react|vue|svelte|all>

check    Run pre-publish validation for all five packages (no publish, no login needed)
core     Validate, build, test, and publish @zealakit/overlay-core
vanilla  Validate, build, test, and publish @zealakit/overlay-vanilla
react    Validate, build, test, and publish @zealakit/overlay-react
vue      Validate, build, test, and publish @zealakit/overlay-vue
svelte   Validate, build, test, and publish @zealakit/overlay-svelte
all      Preflight all five, then publish core → vanilla → react → vue → svelte

Single-adapter publishes require the matching Core version to already exist on npm.
Publishing needs "npm login" (or an npm token in .npmrc) and explicit intent.
`);
}

function fail(message: string): never {
  throw new Error(message);
}

function parseCommand(argv: string[]): Command {
  const command = argv[0];
  if (
    command === "check" ||
    command === "core" ||
    command === "vanilla" ||
    command === "react" ||
    command === "vue" ||
    command === "svelte" ||
    command === "all"
  ) {
    return command;
  }
  printHelp();
  fail(
    command
      ? `Unknown command "${command}".`
      : "Missing command. Pass check, core, vanilla, react, vue, svelte, or all.",
  );
}

function readJson(filePath: string): PackageJson {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as PackageJson;
  } catch (error) {
    fail(
      `Failed to read ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function getPackageConfig(id: PackageId): PackageConfig {
  const meta = PACKAGES.find((item) => item.id === id);
  if (!meta) {
    fail(`Unknown package id "${id}".`);
  }

  const packageDir = path.join(PROJECT_ROOT, "packages", meta.dirName);
  const packageJsonPath = path.join(packageDir, "package.json");

  if (!fs.existsSync(packageDir)) {
    fail(`Package directory not found: ${packageDir}`);
  }
  if (!fs.existsSync(packageJsonPath)) {
    fail(`package.json not found: ${packageJsonPath}`);
  }

  return {
    ...meta,
    packageDir,
    packageJsonPath,
    manifest: readJson(packageJsonPath),
  };
}

function validateWorkspaceDependencies(pkg: PackageConfig): void {
  const { manifest, label, id } = pkg;

  for (const field of DEPENDENCY_FIELDS) {
    for (const [name, range] of Object.entries(manifest[field] ?? {})) {
      if (!range.startsWith("workspace:")) {
        continue;
      }
      if (
        id === "core" ||
        field !== "dependencies" ||
        name !== CORE_NAME ||
        range !== "workspace:^"
      ) {
        fail(
          `${label} ${field}.${name} uses "${range}". Only ${CORE_NAME}: "workspace:^" is allowed in an adapter's dependencies; pnpm rewrites it at pack time.`,
        );
      }
    }
  }

  if (id !== "core" && manifest.dependencies?.[CORE_NAME] !== "workspace:^") {
    fail(
      `${label} must depend on "${CORE_NAME}": "workspace:^" so the published range matches the release version (found "${manifest.dependencies?.[CORE_NAME] ?? "(missing)"}").`,
    );
  }
}

function validatePackage(pkg: PackageConfig): void {
  const { manifest, expectedName, label, packageDir, packageJsonPath } = pkg;

  if (manifest.private === true) {
    fail(`${label} package is marked private and cannot be published.`);
  }

  if (manifest.name !== expectedName) {
    fail(
      `${label} package name mismatch in ${packageJsonPath}: expected "${expectedName}", found "${manifest.name ?? "(missing)"}".`,
    );
  }

  if (!manifest.version || !VERSION_RE.test(manifest.version)) {
    fail(
      `${label} package has an invalid version: "${manifest.version ?? "(missing)"}".`,
    );
  }

  if (!manifest.files || manifest.files.length === 0) {
    fail(`${label} package is missing a non-empty "files" field.`);
  }

  if (!manifest.exports) {
    fail(`${label} package is missing "exports".`);
  }

  if (manifest.publishConfig?.access !== "public") {
    fail(
      `${label} package must set publishConfig.access to "public" (found "${manifest.publishConfig?.access ?? "(missing)"}").`,
    );
  }

  if (!manifest.license) {
    fail(`${label} package is missing "license".`);
  }

  if (!manifest.repository?.url) {
    fail(`${label} package is missing "repository.url".`);
  }

  if (!manifest.engines?.node) {
    fail(`${label} package is missing "engines.node".`);
  }

  if (!fs.existsSync(path.join(packageDir, "README.md"))) {
    fail(`${label} package is missing README.md (it is listed in "files").`);
  }

  if (!fs.existsSync(path.join(packageDir, "LICENSE"))) {
    fail(`${label} package is missing LICENSE (it is listed in "files").`);
  }

  const scripts = manifest.scripts ?? {};
  for (const scriptName of REQUIRED_SCRIPTS) {
    if (!scripts[scriptName]) {
      fail(`${label} package is missing script "${scriptName}".`);
    }
  }

  const expectedPeers = FRAMEWORK_PEERS[pkg.id];
  if (expectedPeers) {
    const peers = manifest.peerDependencies ?? {};
    for (const peer of expectedPeers) {
      if (!peers[peer]) {
        fail(`${label} package is missing framework peer "${peer}".`);
      }
    }
  }

  validateWorkspaceDependencies(pkg);
}

function validateRelease(pkgs: PackageConfig[]): void {
  for (const pkg of pkgs) {
    validatePackage(pkg);
  }

  const versions = new Set(pkgs.map((pkg) => pkg.manifest.version));
  if (versions.size !== 1) {
    fail(
      `All five packages must share one release version. Found: ${pkgs
        .map(
          (pkg) =>
            `${pkg.manifest.name}@${pkg.manifest.version ?? "(missing)"}`,
        )
        .join(", ")}.`,
    );
  }
}

function runCaptured(
  command: string,
  args: string[],
  cwd: string,
): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: false,
  });

  if (result.error) {
    fail(`Failed to run ${command} ${args.join(" ")}: ${result.error.message}`);
  }

  return {
    status: result.status,
    stdout: (result.stdout ?? "").trim(),
    stderr: (result.stderr ?? "").trim(),
  };
}

function runInherited(command: string, args: string[], cwd: string): void {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    fail(`Failed to run ${command} ${args.join(" ")}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    fail(`Command failed (${result.status}): ${command} ${args.join(" ")}`);
  }
}

function checkNpmAuthentication(): string {
  const result = runCaptured("npm", ["whoami"], PROJECT_ROOT);
  if (result.status !== 0 || !result.stdout) {
    const detail = result.stderr || result.stdout || "unknown error";
    fail(
      `npm is not authenticated. Run \`npm login\` first.\nDetails: ${detail}`,
    );
  }
  return result.stdout;
}

function isNpmNotFound(stderr: string, stdout: string): boolean {
  const text = `${stderr}\n${stdout}`;
  return (
    /\bE404\b/.test(text) ||
    /404 Not Found/i.test(text) ||
    /code E404/i.test(text) ||
    /version not found/i.test(text)
  );
}

function versionExists(name: string, version: string): boolean {
  const result = runCaptured(
    "npm",
    ["view", `${name}@${version}`, "version"],
    PROJECT_ROOT,
  );

  if (result.status === 0) {
    return true;
  }

  if (isNpmNotFound(result.stderr, result.stdout)) {
    return false;
  }

  const detail = result.stderr || result.stdout || `exit ${result.status}`;
  fail(
    `Could not verify whether ${name}@${version} exists on npm.\nDetails: ${detail}`,
  );
}

function assertVersionNotPublished(pkg: PackageConfig): void {
  const name = pkg.manifest.name as string;
  const version = pkg.manifest.version as string;

  if (versionExists(name, version)) {
    fail(
      `${name}@${version} already exists on npm. Bump the version in ${pkg.packageJsonPath} before publishing.`,
    );
  }
}

function assertCorePublished(pkg: PackageConfig): void {
  const version = pkg.manifest.version as string;
  if (versionExists(CORE_NAME, version)) {
    return;
  }
  fail(
    `Cannot publish ${pkg.label}@${version}: ${CORE_NAME}@${version} is not on npm yet. Publish Core first with \`pnpm npm:publish:core\`, or use \`pnpm npm:publish:all\`.`,
  );
}

function checkVersionAvailability(
  targets: PackageConfig[],
  allPackages: PackageConfig[],
): void {
  const version = targets[0].manifest.version as string;

  if (targets.length > 1) {
    for (const pkg of targets) {
      assertVersionNotPublished(pkg);
    }
    return;
  }

  const target = targets[0];
  assertVersionNotPublished(target);

  if (target.id !== "core") {
    assertCorePublished(target);
  }

  for (const pkg of allPackages) {
    if (pkg.id === target.id) {
      continue;
    }
    const name = pkg.manifest.name as string;
    if (!versionExists(name, version)) {
      console.log(
        `  warning: ${name}@${version} is not on npm. This publish leaves the set out of sync; use \`pnpm npm:publish:all\` to ship all five.`,
      );
    }
  }
}

function assertBuiltEntryPoints(pkg: PackageConfig): void {
  if (!fs.existsSync(path.join(pkg.packageDir, "dist", "index.js"))) {
    fail(`${pkg.label} build is missing required entry "dist/index.js".`);
  }
  if (!fs.existsSync(path.join(pkg.packageDir, "dist", "index.d.ts"))) {
    fail(`${pkg.label} build is missing required entry "dist/index.d.ts".`);
  }
}

function getBuildClosure(target: PackageConfig): PackageConfig[] {
  if (target.id === "core") {
    return [target];
  }
  return [getPackageConfig("core"), target];
}

function buildPackages(pkgs: PackageConfig[], fullSet: boolean): void {
  if (fullSet) {
    runInherited("pnpm", ["run", "build"], PROJECT_ROOT);
  } else {
    const target = pkgs[pkgs.length - 1];
    runInherited(
      "pnpm",
      ["--filter", `${target.expectedName}...`, "run", "build"],
      PROJECT_ROOT,
    );
  }

  for (const pkg of pkgs) {
    assertBuiltEntryPoints(pkg);
  }
}

function runPackageChecks(pkg: PackageConfig): void {
  runInherited("pnpm", ["run", "typecheck"], pkg.packageDir);
  runInherited("pnpm", ["run", "test"], pkg.packageDir);
}

function resetArtifacts(): void {
  fs.rmSync(ARTIFACT_DIR, { recursive: true, force: true });
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

function tarballFileName(pkg: PackageConfig): string {
  const name = (pkg.manifest.name as string)
    .replace(/^@/, "")
    .replace("/", "-");
  return `${name}-${pkg.manifest.version as string}.tgz`;
}

function packPackage(pkg: PackageConfig): string {
  const tarball = path.join(ARTIFACT_DIR, tarballFileName(pkg));
  runInherited(
    "pnpm",
    ["pack", "--pack-destination", ARTIFACT_DIR],
    pkg.packageDir,
  );

  if (!fs.existsSync(tarball)) {
    fail(`${pkg.label} pack did not produce ${tarball}.`);
  }
  return tarball;
}

function readPackedManifest(pkg: PackageConfig, tarball: string): PackageJson {
  const result = runCaptured(
    "tar",
    ["-xOzf", tarball, "package/package.json"],
    PROJECT_ROOT,
  );
  if (result.status !== 0 || !result.stdout) {
    fail(
      `Could not read package/package.json from ${path.basename(tarball)}.\nDetails: ${
        result.stderr || result.stdout || `exit ${result.status}`
      }`,
    );
  }
  try {
    return JSON.parse(result.stdout) as PackageJson;
  } catch (error) {
    fail(
      `Packed manifest for ${pkg.label} is not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function assertNoWorkspaceProtocol(
  pkg: PackageConfig,
  packed: PackageJson,
): void {
  for (const field of DEPENDENCY_FIELDS) {
    for (const [name, range] of Object.entries(packed[field] ?? {})) {
      if (range.startsWith("workspace:")) {
        fail(
          `${pkg.label} tarball still contains ${field}.${name} = "${range}". pnpm did not rewrite the workspace range.`,
        );
      }
    }
  }
}

function assertPackedEntryPoints(
  pkg: PackageConfig,
  packed: PackageJson,
): void {
  for (const field of ["main", "module", "types"] as const) {
    const value = packed[field];
    if (!value?.startsWith("./dist/")) {
      fail(
        `${pkg.label} packed manifest "${field}" must point into ./dist (found "${value ?? "(missing)"}").`,
      );
    }
  }

  if (!packed.exports || typeof packed.exports !== "object") {
    fail(`${pkg.label} packed manifest is missing "exports".`);
  }

  const rootExport = (packed.exports as Record<string, unknown>)["."];
  if (!rootExport || typeof rootExport !== "object") {
    fail(`${pkg.label} packed manifest is missing the "." export.`);
  }

  for (const [condition, target] of Object.entries(
    rootExport as Record<string, unknown>,
  )) {
    if (typeof target === "string" && !target.startsWith("./dist/")) {
      fail(
        `${pkg.label} packed export "${condition}" must point into ./dist (found "${target}").`,
      );
    }
  }
}

function inspectTarball(
  pkg: PackageConfig,
  tarball: string,
  coreVersion: string,
): void {
  const listing = runCaptured("tar", ["-tzf", tarball], PROJECT_ROOT);
  if (listing.status !== 0) {
    fail(
      `Could not list ${path.basename(tarball)}.\nDetails: ${
        listing.stderr || listing.stdout || `exit ${listing.status}`
      }`,
    );
  }

  const entries = listing.stdout
    .split("\n")
    .map((entry) => entry.trim().replace(/\/$/, ""))
    .filter(Boolean);

  if (entries.length === 0) {
    fail(`${pkg.label} tarball is empty.`);
  }

  for (const entry of entries) {
    if (!entry.startsWith("package/")) {
      fail(`${pkg.label} tarball entry is outside package/: ${entry}`);
    }
    for (const pattern of FORBIDDEN_TARBALL_PATTERNS) {
      if (pattern.test(entry)) {
        fail(`${pkg.label} tarball contains forbidden file: ${entry}`);
      }
    }
  }

  for (const required of REQUIRED_TARBALL_ENTRIES) {
    if (!entries.includes(required)) {
      fail(`${pkg.label} tarball is missing required entry "${required}".`);
    }
  }

  const packed = readPackedManifest(pkg, tarball);

  if (packed.name !== pkg.manifest.name) {
    fail(
      `${pkg.label} packed name mismatch: expected "${pkg.manifest.name}", found "${packed.name ?? "(missing)"}".`,
    );
  }
  if (packed.version !== pkg.manifest.version) {
    fail(
      `${pkg.label} packed version mismatch: expected "${pkg.manifest.version}", found "${packed.version ?? "(missing)"}".`,
    );
  }
  if (packed.private === true) {
    fail(`${pkg.label} packed manifest is marked private.`);
  }

  assertNoWorkspaceProtocol(pkg, packed);
  assertPackedEntryPoints(pkg, packed);

  if (pkg.id !== "core") {
    const coreRange = packed.dependencies?.[CORE_NAME];
    if (coreRange !== `^${coreVersion}`) {
      fail(
        `${pkg.label} tarball must depend on ${CORE_NAME}@^${coreVersion} (found "${coreRange ?? "(missing)"}").`,
      );
    }
  }

  const sizeKb = Math.ceil(fs.statSync(tarball).size / 1024);
  console.log(
    `  ${path.relative(PROJECT_ROOT, tarball)} (${entries.length} files, ${sizeKb} KB)`,
  );
}

function logStep(current: number, total: number, message: string): void {
  console.log(`\n[${current}/${total}] ${message}`);
}

function preflight(
  targets: PackageConfig[],
  allPackages: PackageConfig[],
): Map<PackageId, string> {
  const fullSet = targets.length === allPackages.length;
  const buildClosure = fullSet
    ? allPackages
    : getBuildClosure(targets[targets.length - 1]);

  logStep(1, 4, "Checking npm version availability");
  checkVersionAvailability(targets, allPackages);

  logStep(
    2,
    4,
    fullSet
      ? "Building all packages"
      : `Building ${targets[0].label} and its dependencies`,
  );
  buildPackages(buildClosure, fullSet);

  logStep(3, 4, "Running typecheck and tests");
  for (const pkg of targets) {
    console.log(`\n--- ${pkg.label} ---`);
    runPackageChecks(pkg);
    assertBuiltEntryPoints(pkg);
  }

  resetArtifacts();
  const coreVersion = getPackageConfig("core").manifest.version as string;
  const tarballs = new Map<PackageId, string>();

  logStep(4, 4, "Packing and inspecting publish tarballs");
  for (const pkg of targets) {
    const tarball = packPackage(pkg);
    inspectTarball(pkg, tarball, coreVersion);
    tarballs.set(pkg.id, tarball);
  }

  return tarballs;
}

function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function waitForPublishedVersion(
  name: string,
  version: string,
  timeoutMs = 90_000,
): void {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (versionExists(name, version)) {
      return;
    }
    sleepSync(3000);
  }
  fail(
    `${name}@${version} did not appear on npm within ${Math.round(timeoutMs / 1000)}s. Aborting before dependent packages are published.`,
  );
}

function publishPackage(tarball: string): void {
  runInherited("npm", ["publish", tarball, "--access", "public"], PROJECT_ROOT);
}

function printSummary(published: string[], failed: PackageConfig | null): void {
  console.error("\n=== Publish summary ===");
  console.error(
    `Published: ${published.length > 0 ? published.join(", ") : "(none)"}`,
  );
  if (failed) {
    console.error(`Failed: ${failed.manifest.name}@${failed.manifest.version}`);
    console.error(
      "Note: npm publishing is not atomic. Successful packages above remain published.",
    );
  }
}

function publishTargets(
  targets: PackageConfig[],
  tarballs: Map<PackageId, string>,
): void {
  const published: string[] = [];

  for (const pkg of targets) {
    const tarball = tarballs.get(pkg.id);
    if (!tarball) {
      fail(`Missing tarball for ${pkg.label}.`);
    }

    console.log(
      `\n=== Publishing ${pkg.label}: ${pkg.manifest.name}@${pkg.manifest.version} ===`,
    );

    try {
      publishPackage(tarball);
      published.push(`${pkg.manifest.name}@${pkg.manifest.version}`);

      if (pkg.id === "core" && targets.length > 1) {
        console.log(
          `\nWaiting for ${pkg.manifest.name}@${pkg.manifest.version} to appear on npm...`,
        );
        waitForPublishedVersion(
          pkg.manifest.name as string,
          pkg.manifest.version as string,
        );
      }
    } catch (error) {
      printSummary(published, pkg);
      throw error;
    }
  }

  console.log("\n=== Publish summary ===");
  console.log(`Published: ${published.join(", ")}`);
  console.log("All requested packages published successfully.");
}

function main(): void {
  const command = parseCommand(process.argv.slice(2));
  process.chdir(PROJECT_ROOT);

  const allPackages = PACKAGES.map((framework) =>
    getPackageConfig(framework.id),
  );
  validateRelease(allPackages);

  console.log(`repository: ${PROJECT_ROOT}`);
  const fullSet = command === "check" || command === "all";
  const targets = fullSet
    ? allPackages
    : [getPackageConfig(command as PackageId)];

  if (command !== "check") {
    const npmUser = checkNpmAuthentication();
    console.log(`npm user: ${npmUser}`);
  }

  const tarballs = preflight(targets, allPackages);

  if (command === "check") {
    console.log(
      "\nAll package checks passed. Nothing was published. Run `pnpm npm:publish:all` (or one package command) to publish.",
    );
    return;
  }

  publishTargets(targets, tarballs);
}

try {
  main();
} catch (error) {
  console.error(
    `\nError: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}
