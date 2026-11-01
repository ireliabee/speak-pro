import { expect, test } from "@playwright/test";

test.describe("SpeakPro journey", () => {
  test("onboarding → chapter 1 → pick discipline → read loop → celebration", async ({ page }) => {
    await page.goto("/");

    // Onboarding
    const onboarding = page.getByTestId("onboarding");
    await expect(onboarding).toBeVisible();
    await page.getByLabel("Your first name").fill("Elijah");
    await page.getByTestId("onboarding-begin").click();
    await expect(onboarding).toBeHidden();

    // Chapter 1 — meet your map
    const title = page.getByTestId("quest-title");
    await expect(title).toHaveText("Meet your map");
    await expect(page.locator('[data-node-id="azair"]')).toHaveAttribute("data-beacon", "true");
    await page.getByTestId("quest-action").click();
    await expect(page.getByTestId("celebration-title")).toHaveText("Meet your map");
    await page.getByTestId("celebration-continue").click();
    await expect(title).toHaveText("Choose your discipline");

    // Dismiss the tutorial if it appears so it never covers the map.
    const tutorial = page.getByTestId("tutorial");
    if (await tutorial.isVisible().catch(() => false)) {
      await tutorial.getByRole("button", { name: "Skip" }).click();
    }

    // Chapter 2 — pick a discipline from a "+" node
    await page.getByTestId("quest-action").click();
    await page.locator('[data-node-id="averi"]').click({ force: true });
    await page.getByTestId("set-discipline").click();
    await expect(page.getByTestId("hud-disc")).toHaveText("Business");
    await expect(page.getByTestId("celebration-title")).toHaveText("Choose your discipline");
    await page.getByTestId("celebration-continue").click();
    await expect(title).toHaveText("First words");
    await expect(page.locator('[data-node-id="ovi"]')).toHaveAttribute("data-beacon", "true");

    // Chapter 3 — read loop: log five words
    await page.getByTestId("quest-action").click();
    const dialog = page.getByTestId("read-loop");
    await expect(dialog).toBeVisible();
    await page.getByLabel("What did you read?").fill("a Lancet editorial");
    const words = ["prognosis", "idiopathic", "sequela", "comorbid", "iatrogenic"];
    for (let i = 0; i < words.length; i++) {
      await page.getByLabel(`word ${i + 1}`).fill(words[i]!);
      await page.getByLabel(`sentence ${i + 1}`).fill(`Sentence with ${words[i]}.`);
    }
    await page.getByRole("button", { name: "Log words" }).click();

    // Celebration for "First words"
    await expect(page.getByTestId("celebration-title")).toHaveText("First words");
    await expect(page.getByTestId("stat-words")).toHaveText("8"); // 3 seeds + 5 logged
    await expect(page.getByTestId("stat-streak")).toHaveText("1");
    await expect(page.getByTestId("hud-path")).toHaveAttribute("data-state", "lit");
    await page.getByTestId("celebration-continue").click();
    await expect(title).toHaveText("Your first review");

    // Progress survives a reload (persisted to localStorage).
    await page.reload();
    await expect(page.getByTestId("quest-title")).toHaveText("Your first review");
    await expect(page.getByTestId("onboarding")).toBeHidden();
  });

  test("read loop rejects fewer than three words", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "speakpro.v1",
        JSON.stringify({
          state: {
            onboarded: true,
            tutorial: true,
            chapters: { meet: 1, disc: 1 },
            disc: "berlin",
          },
          version: 1,
        }),
      );
    });
    await page.reload();
    await expect(page.getByTestId("quest-title")).toHaveText("First words");
    await page.getByTestId("today-read").click();
    await page.getByLabel("word 1").fill("latency");
    await page.getByRole("button", { name: "Log words" }).click();
    await expect(page.getByRole("status")).toContainText("at least 3 words");
    await expect(page.getByTestId("read-loop")).toBeVisible();
  });
});
