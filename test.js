import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const profileDir = path.resolve("./chrome-bot-profile");

// create the profile directory if it does not exist
if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir);
}

(async () => {
  const phantomExtensionPath = path.resolve(
    process.env.HOME,
    "Downloads/phantom"   // <-- ensure this is the folder that contains manifest.json
  );

  const braveExecutablePath =
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";

  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath: braveExecutablePath,   // Use Brave instead of Chrome
    headless: false,
    viewport: null,
    args: [
      `--disable-extensions-except=${phantomExtensionPath}`,
      `--load-extension=${phantomExtensionPath}`,
      "--no-first-run",
      "--no-default-browser-check"
    ]
  });

  // --- Attach to existing or restored Titan tab ---
  let page;
  let firstSwapConfirmed = false;
  let startupNormalizationDone = false;

  const findTitanPage = () =>
    context.pages().find(p => p.url().includes("titan.exchange"));

  const ensureTitanPage = async () => {
    if (!page || page.isClosed()) {
      console.warn("⚠️ Titan page was closed — reopening...");
      page = await context.newPage();
      await page.goto("https://titan.exchange", {
        waitUntil: "domcontentloaded",
        timeout: 60000
      });
      await page.bringToFront();
    }
  };

  const normalizeOnceIfNeeded = async () => {
    if (startupNormalizationDone || firstSwapConfirmed) return;

    console.warn("⚠️ Startup normalization triggered (no swap detected yet) → Switch + Max");
    startupNormalizationDone = true;

    try {
      const switchSelector = 'button[aria-label="Switch tokens"]';

      await page.locator(switchSelector).first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      try { await page.locator(switchSelector).first().hover({ timeout: 2000 }); } catch {}
      await page.click(switchSelector, { force: true, timeout: 10000 });

      await page.waitForTimeout(2000);

      const maxBtn = page.locator("button").filter({ hasText: /^Max$/ }).first();
      await maxBtn.waitFor({ state: "visible", timeout: 10000 });
      await maxBtn.click({ force: true });

      console.log("Startup normalization completed ✅");
    } catch (err) {
      console.warn("⚠️ Startup normalization failed (continuing anyway):", err.message);
    }
  };

  // Give Brave time to restore tabs
  console.log("Waiting for Brave restore...");
  await new Promise(r => setTimeout(r, 5000));

  page = findTitanPage();

  if (!page) {
    console.log("No restored Titan tab found, opening new one...");
    page = await context.newPage();
    await page.goto("https://titan.exchange", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });
  } else {
    console.log("Restored Titan tab detected ✅");
  }

  await page.bringToFront();

  // --- Startup watchdog: if no swap happens in 10s, normalize once ---
  setTimeout(() => {
    normalizeOnceIfNeeded();
  }, 10000);

  console.log("Waiting for Swap button...");

  const swapButton = page
    .locator("button")
    .filter({ hasText: /^Swap$/ })
    .filter({ hasNotText: /history/i })
    .first();

  await swapButton.waitFor({ state: "visible", timeout: 60000 });

  console.log("Swap button found ✅");

  // --- Click MAX before swapping ---
  const maxButton = page
    .locator("button")
    .filter({ hasText: /^Max$/ })
    .first();

  // --- Switch (invert) tokens button ---
  const switchButtonPrimary = page.locator('button[aria-label="Switch tokens"]').first();
  const switchButtonFallback = page.locator("button svg").filter({ has: page.locator("path") }).first();

  console.log("Waiting for Switch Tokens button...");
  await Promise.race([
    switchButtonPrimary.waitFor({ state: "visible", timeout: 60000 }).catch(() => {}),
    switchButtonFallback.waitFor({ state: "visible", timeout: 60000 }).catch(() => {})
  ]);

  console.log("Waiting for Max button...");
  await maxButton.waitFor({ state: "visible", timeout: 60000 });

  console.log("Clicking Max button...");
  await maxButton.click();

  await page.waitForTimeout(1500);

  // Ensure Swap is really enabled before clicking
  console.log("Ensuring Swap button is enabled before click...");
  await page.waitForFunction(() => {
    const btn = [...document.querySelectorAll("button")]
      .find(b => b.textContent?.trim() === "Swap");
    return btn && !btn.disabled;
  }, { timeout: 60000 });

  // Scroll into view (sometimes Titan overlays block pointer events)
  await swapButton.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  console.log("Clicking Swap button (forced)...");
  await swapButton.click({ force: true, timeout: 60000 });

  console.log("Swap click executed ✅");
  firstSwapConfirmed = true;

  // --- Detect Phantom popup (new or existing) ---
  let phantomPopup;

  try {
    phantomPopup = await context.waitForEvent("page", { timeout: 15000 });
  } catch {
    // If no new page appeared, try to reuse an existing Phantom popup
    phantomPopup = context
      .pages()
      .find(p => p.url().toLowerCase().includes("phantom"));
  }

  if (!phantomPopup) {
    throw new Error("Phantom popup not detected");
  }

  await phantomPopup.waitForLoadState("domcontentloaded");
  await phantomPopup.bringToFront();

  console.log("Phantom popup detected ✅");
  console.log("If Phantom is locked, unlock it manually — waiting for Confirm button...");

  // Wait until the Confirm / Approve button appears AFTER manual unlock
  const confirmButton = phantomPopup
    .locator("button")
    .filter({ hasText: /confirm|approve|sign/i })
    .first();

  await confirmButton.waitFor({ state: "visible", timeout: 300000 }); // wait up to 5 minutes

  console.log("Confirm button detected — clicking...");
  await confirmButton.click();

  console.log("Swap click executed ✅");

  // Give Titan time to process the transaction
  await page.bringToFront();
  await page.waitForTimeout(5000);

  console.log("Entering continuous farming loop ♻️");

  while (true) {
    try {
      console.log("Waiting briefly before next cycle...");
      await ensureTitanPage();
      await page.waitForTimeout(4000);   // simple and stable cooldown instead of fragile DOM waits

      console.log("Clicking Switch Tokens button (with verification)...");

      const switchSelector = 'button[aria-label="Switch tokens"]';

      let switched = false;

      for (let attempt = 1; attempt <= 3 && !switched; attempt++) {
        console.log(`Switch attempt ${attempt}...`);

        await page.locator(switchSelector).first().scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);

        // Hover first to trigger dual-arrow animation / activation
        try {
          await page.locator(switchSelector).first().hover({ timeout: 2000 });
          await page.waitForTimeout(300);
        } catch {}

        // Force click (some overlays intercept pointer events)
        await page.click(switchSelector, { force: true, timeout: 10000 });

        // Give UI time to update
        await page.waitForTimeout(2500);

        // Verify that UI reacted: Max should become enabled again after flip
        try {
          await page.waitForFunction(() => {
            const maxBtn = [...document.querySelectorAll("button")]
              .find(b => b.textContent?.trim() === "Max");
            return maxBtn && !maxBtn.disabled;
          }, { timeout: 5000 });

          switched = true;
          console.log("Switch Tokens confirmed ✅");
        } catch {
          console.log("Switch not confirmed yet — retrying...");
        }
      }

      if (!switched) {
        console.warn("⚠️ Switch Tokens may not have flipped correctly, continuing anyway.");
      }

      console.log("Clicking Max button...");
      await maxButton.click();
      await page.waitForTimeout(1500);

      console.log("Ensuring Swap button is enabled before click...");
      await page.waitForFunction(() => {
        const btn = [...document.querySelectorAll("button")]
          .find(b => b.textContent?.trim() === "Swap");
        return btn && !btn.disabled;
      }, { timeout: 60000 });

      await swapButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      console.log("Clicking Swap button (forced)...");
      await swapButton.click({ force: true, timeout: 60000 });

      console.log("Waiting for Phantom approval popup...");
      // --- Detect Phantom popup (new or existing) ---
      let loopPopup;

      try {
        loopPopup = await context.waitForEvent("page", { timeout: 15000 });
      } catch {
        loopPopup = context
          .pages()
          .find(p => p.url().toLowerCase().includes("phantom"));
      }

      if (!loopPopup) {
        throw new Error("Phantom popup not detected in loop");
      }

      await loopPopup.waitForLoadState("domcontentloaded");
      await loopPopup.bringToFront();

      console.log("Phantom popup detected ✅");
      console.log("If Phantom is locked, unlock it manually — waiting for Confirm button...");

      const loopConfirm = loopPopup
        .locator("button")
        .filter({ hasText: /confirm|approve|sign/i })
        .first();

      await loopConfirm.waitFor({ state: "visible", timeout: 300000 }); // up to 5 minutes

      console.log("Confirm button detected — clicking...");
      await loopConfirm.click();

      console.log("Transaction confirmed ✅");
      firstSwapConfirmed = true;

      await page.bringToFront();

      // Random delay between swaps (30s - 90s)
      const delay = 5000 + Math.floor(Math.random() * 15000);
      console.log(`Waiting ${delay / 1000}s before next swap...`);
      await page.waitForTimeout(delay);
    } catch (err) {
      console.error("⚠️ Loop error (recovering):", err.message);
      await ensureTitanPage();
      await page.waitForTimeout(5000);
      continue;
    }
  }
})();