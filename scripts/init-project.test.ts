import { describe, expect, test } from "bun:test";
import {
  appPackageName,
  slugToDisplayName,
  updateAppPackageJson,
  updateExpoAppJson,
  validateProjectSlug,
  workerName,
} from "./init-project";

describe("validateProjectSlug", () => {
  test("accepts kebab-case slugs", () => {
    expect(() => validateProjectSlug("my-cool-app")).not.toThrow();
  });

  test("rejects uppercase", () => {
    expect(() => validateProjectSlug("My-App")).toThrow(/Invalid slug/);
  });

  test("rejects spaces", () => {
    expect(() => validateProjectSlug("my app")).toThrow(/Invalid slug/);
  });
});

describe("workerName", () => {
  test("builds Cloudflare worker names", () => {
    expect(workerName("my-cool-app", "lp")).toBe("my-cool-app-lp");
  });
});

describe("appPackageName", () => {
  test("uses the worker name for lp", () => {
    expect(appPackageName("my-cool-app", "lp")).toBe("my-cool-app-lp");
  });

  test("uses project slug for sp", () => {
    expect(appPackageName("my-cool-app", "sp")).toBe("my-cool-app");
  });
});

describe("slugToDisplayName", () => {
  test("converts kebab-case to title case", () => {
    expect(slugToDisplayName("my-cool-app")).toBe("My Cool App");
  });
});

describe("updateAppPackageJson", () => {
  test("renames default lp package name", () => {
    const packageJson = { name: "lp" };
    expect(
      updateAppPackageJson(
        packageJson,
        "lp",
        "four-app-monorepo-boilerplate",
        "my-cool-app",
      ),
    ).toBe(true);
    expect(packageJson.name).toBe("my-cool-app-lp");
  });

  test("renames default sp package name", () => {
    const packageJson = { name: "sp" };
    expect(
      updateAppPackageJson(
        packageJson,
        "sp",
        "four-app-monorepo-boilerplate",
        "my-cool-app",
      ),
    ).toBe(true);
    expect(packageJson.name).toBe("my-cool-app");
  });

  test("renames package that already matches old slug", () => {
    const packageJson = { name: "my-old-app-lp" };
    expect(
      updateAppPackageJson(packageJson, "lp", "my-old-app", "my-cool-app"),
    ).toBe(true);
    expect(packageJson.name).toBe("my-cool-app-lp");
  });

  test("skips custom package names", () => {
    const packageJson = { name: "custom-mobile" };
    expect(
      updateAppPackageJson(packageJson, "sp", "my-old-app", "my-cool-app"),
    ).toBe(false);
    expect(packageJson.name).toBe("custom-mobile");
  });
});

describe("updateExpoAppJson", () => {
  test("updates default expo fields", () => {
    const appJson = {
      expo: {
        name: "sp",
        slug: "sp",
        scheme: "sp",
      },
    };

    expect(
      updateExpoAppJson(
        appJson,
        "four-app-monorepo-boilerplate",
        "my-cool-app",
      ),
    ).toBe(true);
    expect(appJson.expo.slug).toBe("my-cool-app");
    expect(appJson.expo.name).toBe("My Cool App");
    expect(appJson.expo.scheme).toBe("my-cool-app");
  });

  test("updates fields that already match old slug", () => {
    const appJson = {
      expo: {
        name: "My Old App",
        slug: "my-old-app",
        scheme: "my-old-app",
      },
    };

    expect(updateExpoAppJson(appJson, "my-old-app", "my-cool-app")).toBe(true);
    expect(appJson.expo.slug).toBe("my-cool-app");
    expect(appJson.expo.name).toBe("My Cool App");
    expect(appJson.expo.scheme).toBe("my-cool-app");
  });
});
