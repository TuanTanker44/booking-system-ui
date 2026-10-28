import { Builder, By, until, Key } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

export const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
export const API_URL = process.env.API_URL || 'http://localhost:3000';

export async function createDriver() {
  const options = new chrome.Options();

  if (process.env.HEADLESS !== 'false') {
    options.addArguments('--headless=new');
  }

  options.addArguments('--disable-features=OptimizationHints,MediaRouter');
  options.addArguments('--log-level=3'); 

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driver.manage().setTimeouts({ implicit: 3000 });
  return driver;
}

export async function waitForVisible(driver, locator, timeout = 10000) {
  const el = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(el), timeout);
  return el;
}

export async function pageContains(driver, text, timeout = 4000) {
  try {
    await driver.wait(
      until.elementLocated(By.xpath(`//*[contains(normalize-space(.), "${text}")]`)),
      timeout
    );
    return true;
  } catch {
    return false;
  }
}

export { By, until, Key };