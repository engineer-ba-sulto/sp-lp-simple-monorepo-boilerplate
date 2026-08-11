import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const SLUG_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const WORKER_APPS = ["lp"] as const;
const APPS = ["lp", "sp"] as const;
const DEFAULT_SP_VALUE = "sp";

export type WorkerApp = (typeof WORKER_APPS)[number];
export type AppName = (typeof APPS)[number];

type PackageJson = {
  name: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

type ExpoAppJson = {
  expo: {
    name: string;
    slug: string;
    scheme: string;
    [key: string]: unknown;
  };
};

export function validateProjectSlug(slug: string): void {
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(
      `Invalid slug "${slug}". Use lowercase kebab-case (e.g. my-cool-app).`,
    );
  }
}

export function workerName(slug: string, app: WorkerApp): string {
  return `${slug}-${app}`;
}

export function appPackageName(slug: string, app: AppName): string {
  if (app === "sp") {
    return slug;
  }

  return workerName(slug, app);
}

export function slugToDisplayName(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isRenamableAppPackageName(
  name: string,
  app: AppName,
  oldSlug: string,
): boolean {
  return name === app || name === appPackageName(oldSlug, app);
}

export function updateAppPackageJson(
  packageJson: PackageJson,
  app: AppName,
  oldSlug: string,
  newSlug: string,
): boolean {
  if (!isRenamableAppPackageName(packageJson.name, app, oldSlug)) {
    return false;
  }

  packageJson.name = appPackageName(newSlug, app);
  return true;
}

export function updateExpoAppJson(
  appJson: ExpoAppJson,
  oldSlug: string,
  newSlug: string,
): boolean {
  const { expo } = appJson;
  let changed = false;

  if (isDefaultValue(expo.slug, oldSlug)) {
    expo.slug = newSlug;
    changed = true;
  }

  if (
    [oldSlug, slugToDisplayName(oldSlug), DEFAULT_SP_VALUE].includes(expo.name)
  ) {
    expo.name = slugToDisplayName(newSlug);
    changed = true;
  }

  if (isDefaultValue(expo.scheme, oldSlug)) {
    expo.scheme = newSlug;
    changed = true;
  }

  return changed;
}

function isDefaultValue(value: string, oldSlug: string): boolean {
  return value === oldSlug || value === DEFAULT_SP_VALUE;
}

function replaceWranglerName(
  content: string,
  oldSlug: string,
  newSlug: string,
  app: WorkerApp,
): string {
  const newName = workerName(newSlug, app);
  const oldNames = [workerName(oldSlug, app), app];
  const pattern = new RegExp(
    `"name":\\s*"(${oldNames.map(escapeRegExp).join("|")})"`,
  );
  const next = content.replace(pattern, `"name": "${newName}"`);

  if (next === content) {
    throw new Error(
      `Could not update worker name in wrangler config (expected "${oldNames.join('" or "')}").`,
    );
  }

  return next;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceReadmeTitle(
  content: string,
  oldSlug: string,
  newSlug: string,
): string {
  const pattern = new RegExp(`^# ${escapeRegExp(oldSlug)}`, "m");
  const next = content.replace(pattern, `# ${newSlug}`);

  if (next === content) {
    throw new Error(`Could not update README title (expected "# ${oldSlug}").`);
  }

  return next;
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf-8")) as T;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function main(): Promise<void> {
  const newSlug = process.argv[2];

  if (!newSlug) {
    console.error("Usage: bun run init:project <slug>");
    console.error("Example: bun run init:project my-cool-app");
    process.exit(1);
  }

  validateProjectSlug(newSlug);

  const root = join(import.meta.dir, "..");
  const packageJsonPath = join(root, "package.json");
  const packageJson = await readJson<PackageJson>(packageJsonPath);
  const oldSlug = packageJson.name;

  if (oldSlug === newSlug) {
    console.log(`Project slug is already "${newSlug}". No changes made.`);
    return;
  }

  packageJson.name = newSlug;
  packageJson.scripts ??= {};

  const renamedApps: Array<{ app: AppName; from: string; to: string }> = [];

  for (const app of APPS) {
    const appPackageJsonPath = join(root, "apps", app, "package.json");
    const appPackageJson = await readJson<PackageJson>(appPackageJsonPath);
    const previousName = appPackageJson.name;

    if (
      !updateAppPackageJson(appPackageJson, app, oldSlug, newSlug) ||
      previousName === appPackageJson.name
    ) {
      continue;
    }

    renamedApps.push({ app, from: previousName, to: appPackageJson.name });

    await writeJson(appPackageJsonPath, appPackageJson);
  }

  await writeJson(packageJsonPath, packageJson);

  const appJsonPath = join(root, "apps", "sp", "app.json");
  const appJson = await readJson<ExpoAppJson>(appJsonPath);
  const appJsonChanged = updateExpoAppJson(appJson, oldSlug, newSlug);

  if (appJsonChanged) {
    await writeJson(appJsonPath, appJson);
  }

  for (const app of WORKER_APPS) {
    const wranglerPath = join(root, "apps", app, "wrangler.jsonc");
    const content = await readFile(wranglerPath, "utf-8");
    await writeFile(
      wranglerPath,
      replaceWranglerName(content, oldSlug, newSlug, app),
    );
  }

  const readmePath = join(root, "README.md");
  const readme = await readFile(readmePath, "utf-8");
  await writeFile(readmePath, replaceReadmeTitle(readme, oldSlug, newSlug));

  console.log(`Renamed project slug: ${oldSlug} -> ${newSlug}`);
  console.log(`  Workers: ${workerName(newSlug, "lp")}`);

  for (const { app, from, to } of renamedApps) {
    console.log(`  ${app} package: ${from} -> ${to}`);
  }

  if (appJsonChanged) {
    console.log(
      `  Expo app: slug=${appJson.expo.slug}, name=${appJson.expo.name}, scheme=${appJson.expo.scheme}`,
    );
  }

  console.log("Next: bun install");
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  });
}
