import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const netlify = readFileSync(path.join(root, "netlify.toml"), "utf8");

type NetlifyRule = {
  path: string;
  values: Record<string, string>;
};

function blocks(section: "redirects" | "headers"): string[] {
  const pattern = new RegExp(
    `\\[\\[${section}\\]\\]([\\s\\S]*?)(?=\\n\\[\\[|$)`,
    "g"
  );
  return Array.from(netlify.matchAll(pattern), match => match[1]);
}

function value(block: string, key: string): string | undefined {
  const match = block.match(new RegExp(`^\\s*${key}\\s*=\\s*"([^"]*)"`, "m"));
  return match?.[1];
}

function headerRules(): NetlifyRule[] {
  return blocks("headers").map(block => ({
    path: value(block, "for") ?? "",
    values: Object.fromEntries(
      Array.from(
        block.matchAll(/^\s*([A-Za-z][A-Za-z-]*)\s*=\s*"([^"]*)"/gm),
        match => [match[1], match[2]]
      ).filter(([key]) => key !== "for")
    ),
  }));
}

function matches(pattern: string, route: string): boolean {
  if (pattern === route) return true;
  if (pattern.endsWith("/*")) {
    return route.startsWith(pattern.slice(0, -1));
  }
  return false;
}

describe("Netlify application routing", () => {
  it("serves every authentication and protected application route from app.html", () => {
    const rules = blocks("redirects").map(block => ({
      from: value(block, "from"),
      to: value(block, "to"),
      status: Number(block.match(/^\s*status\s*=\s*(\d+)/m)?.[1]),
    }));

    for (const route of [
      "/sign-in",
      "/coach/sign-in",
      "/account/setup",
      "/account/confirm",
      "/account/reset",
      "/onboarding",
      "/dashboard",
      "/portal",
      "/admin",
    ]) {
      expect(rules, `${route} must be a 200 SPA rewrite`).toContainEqual({
        from: route,
        to: "/app.html",
        status: 200,
      });
    }

    for (const route of [
      "/sign-in/*",
      "/coach/sign-in/*",
      "/account/setup/*",
      "/account/confirm/*",
      "/account/reset/*",
      "/onboarding/*",
      "/dashboard/*",
      "/portal/*",
      "/admin/*",
    ]) {
      expect(
        rules,
        `${route} must preserve client-side deep links`
      ).toContainEqual({
        from: route,
        to: "/app.html",
        status: 200,
      });
    }
  });

  it("keeps sensitive HTML private, unindexed, and on a self-hosted module CSP", () => {
    const rules = headerRules();

    for (const route of [
      "/sign-in",
      "/coach/sign-in",
      "/account/setup",
      "/account/confirm",
      "/account/reset",
      "/onboarding",
      "/dashboard",
      "/portal",
      "/admin",
    ]) {
      const routeValues = Object.assign(
        {},
        ...rules
          .filter(rule => rule.path !== "/*" && matches(rule.path, route))
          .map(rule => rule.values)
      ) as Record<string, string>;

      expect(
        routeValues,
        `${route} needs a route-specific header rule`
      ).not.toEqual({});
      expect(routeValues["Cache-Control"]).toContain("no-store");
      expect(routeValues["X-Robots-Tag"]).toContain("noindex");
      expect(routeValues["X-Robots-Tag"]).toContain("nofollow");
      expect(routeValues["Referrer-Policy"]).toBe("no-referrer");

      const csp = routeValues["Content-Security-Policy"] ?? "";
      expect(csp).toMatch(/(?:^|;\s*)script-src 'self'(?:;|$)/);
      expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
      expect(csp).not.toMatch(/script-src[^;]*https:/);
    }
  });
});

describe("public authentication entry points", () => {
  it("links clients and coaches to their distinct sign-in routes", () => {
    const landing = readFileSync(path.join(root, "public/index.html"), "utf8");
    const landingDocument = new DOMParser().parseFromString(
      landing,
      "text/html"
    );
    const desktopActions = landingDocument.querySelector(".nav-actions");

    expect(desktopActions).not.toBeNull();
    expect(
      desktopActions?.querySelector('a[href="/sign-in"]')?.textContent
    ).toMatch(/Client Sign In/i);
    expect(
      desktopActions?.querySelector('a[href="/coach/sign-in"]')?.textContent
    ).toMatch(/Coach OS/i);
    expect(desktopActions?.querySelector(".nav-cta")?.textContent).toMatch(
      /Apply/i
    );
    expect(
      landingDocument.querySelector('.nav-mobile-actions a[href="/sign-in"]')
    ).not.toBeNull();
    expect(
      landingDocument.querySelector(
        '.nav-mobile-actions a[href="/coach/sign-in"]'
      )
    ).not.toBeNull();
    expect(
      landingDocument.querySelector('.client-login-link[href="/sign-in"]')
    ).not.toBeNull();
    expect(
      landingDocument.querySelector('footer a[href="/coach/sign-in"]')
    ).not.toBeNull();
  });
});
