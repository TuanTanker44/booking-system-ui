import { By } from './driver.js';
import { findAny } from './text.js';

export async function dismissLocationDialog(driver) {
  const btn = await findAny(driver, [
    By.xpath('//div[contains(@class,"location-dialog-actions")]//button[contains(normalize-space(.), "Để sau")]'),
    By.css('.location-dialog-actions .outline-button'),
  ], 1200);
  if (btn) {
    try { await btn.click(); } catch {}
    await driver.sleep(300);
  }
  const backdrops = await driver.findElements(By.css('.location-dialog-backdrop'));
  for (const b of backdrops) {
    try { await driver.executeScript('arguments[0].remove()', b); } catch {}
  }
  await driver.sleep(200);
}
