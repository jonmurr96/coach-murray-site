import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

const publicRoutes = [
  { path: "/", heading: /Build the body you deserve/i },
  { path: "/quiz", heading: /Which Coach Murray plan is right for you/i },
  { path: "/privacy", heading: /Privacy notice/i },
] as const;

async function attachAxeResults(page: Page, testInfo: TestInfo): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  if (results.violations.length > 0) {
    await testInfo.attach("accessibility-violations", {
      body: JSON.stringify(results.violations, null, 2),
      contentType: "application/json",
    });
  }

  expect(
    results.violations.map(violation => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.map(node => node.target),
    }))
  ).toEqual([]);
}

test.describe("public routes", () => {
  for (const route of publicRoutes) {
    test(`${route.path} renders with accessible page structure`, async ({
      page,
    }, testInfo) => {
      const runtimeErrors: string[] = [];
      page.on("pageerror", error => runtimeErrors.push(error.message));

      const response = await page.goto(route.path, {
        waitUntil: "domcontentloaded",
      });

      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", /^en\b/i);
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: route.heading })
      ).toBeVisible();
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("img:not([alt])")).toHaveCount(0);

      const visibleFields = page.locator(
        'input:visible:not([tabindex="-1"]), select:visible, textarea:visible'
      );
      for (let index = 0; index < (await visibleFields.count()); index += 1) {
        await expect(visibleFields.nth(index)).toHaveAccessibleName(/\S/);
      }

      await attachAxeResults(page, testInfo);
      expect(runtimeErrors).toEqual([]);
    });
  }
});

test.describe("production access boundaries without secrets", () => {
  test("landing navigation exposes distinct client and coach sign-in entry points", async ({
    page,
  }) => {
    await page.goto("/");
    const navigation = page.locator("#nav .nav-actions");
    await expect(
      navigation.getByRole("link", { name: "Client Sign In" })
    ).toHaveAttribute("href", "/sign-in");
    await expect(
      navigation.getByRole("link", { name: "Coach OS" })
    ).toHaveAttribute("href", "/coach/sign-in");
    await expect(
      navigation.getByRole("button", { name: /Apply Now/i })
    ).toBeVisible();
  });

  test("onboarding cannot be opened with the development preview query", async ({
    page,
  }) => {
    await page.goto("/onboarding?preview=1");

    await expect(
      page.getByRole("heading", { level: 1, name: "Complete checkout first" })
    ).toBeVisible();
    await expect(page.getByText(/Preview mode/i)).toHaveCount(0);
    await expect(page.locator("form")).toHaveCount(0);
  });

  for (const route of [
    "/sign-in",
    "/coach/sign-in",
    "/account/setup",
    "/account/confirm",
    "/account/reset",
    "/dashboard?preview=1",
    "/portal?preview=1",
    "/admin?preview=1",
  ]) {
    test(`${route} remains closed when Supabase is unconfigured`, async ({
      page,
    }, testInfo) => {
      await page.goto(route);

      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "Portal setup is not complete",
        })
      ).toBeVisible();
      await expect(page.getByRole("navigation")).toHaveCount(0);
      await expect(page.locator("form")).toHaveCount(0);
      await attachAxeResults(page, testInfo);
    });
  }
});

test.describe("mobile containment", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  for (const route of [
    "/",
    "/quiz",
    "/privacy",
    "/sign-in",
    "/coach/sign-in",
    "/account/setup",
    "/account/confirm",
    "/account/reset",
    "/onboarding",
    "/dashboard",
    "/admin",
  ]) {
    test(`${route} has no horizontal document overflow`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("h1").first()).toBeVisible();

      const dimensions = await page.evaluate(() => ({
        body: document.body.scrollWidth,
        document: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }));

      expect(dimensions.viewport).toBe(390);
      expect(
        Math.max(dimensions.body, dimensions.document)
      ).toBeLessThanOrEqual(dimensions.viewport + 1);
    });
  }
});
