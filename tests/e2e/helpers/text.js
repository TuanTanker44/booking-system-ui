import { pageContains } from './driver.js';

export async function anyPageContains(driver, texts, timeout = 3000) {
  for (const t of texts) {
    if (await pageContains(driver, t, timeout)) return true;
  }
  return false;
}

export async function findAny(driver, locators, timeout = 6000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    for (const loc of locators) {
      try {
        const els = await driver.findElements(loc);
        if (els.length > 0) {
          const visible = await els[0].isDisplayed().catch(() => false);
          if (visible) return els[0];
        }
      } catch {}
    }
    await driver.sleep(200);
  }
  return null;
}

export async function clickAny(driver, locators, timeout = 6000) {
  const el = await findAny(driver, locators, timeout);
  if (!el) return null;
  await el.click();
  return el;
}
