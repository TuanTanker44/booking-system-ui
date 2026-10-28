import { BASE_URL, API_URL, waitForVisible, By, until } from './driver.js';

export const TEST_EMAIL = process.env.TEST_EMAIL || 'tuanfafbfc@gmail.com';
export const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Tu@n3012';

export async function login(driver, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await driver.get(`${BASE_URL}/login`);
  const emailInput = await waitForVisible(driver, By.css('input#email'));
  await emailInput.clear();
  await emailInput.sendKeys(email);
  const pwInput = await waitForVisible(driver, By.css('input#password'));
  await pwInput.clear();
  await pwInput.sendKeys(password);
  const submit = await waitForVisible(driver, By.css('button.auth-submit[type="submit"]'));
  await submit.click();
  await driver.wait(until.urlContains('/customer/dashboard'), 15000).catch(async () => {
    const html = await driver.getPageSource();
    const m = html.match(/class="auth-error"[^>]*>([^<]+)</);
    if (m) throw new Error(`Login failed: ${m[1]}`);
    throw new Error(`Login did not reach dashboard. URL: ${await driver.getCurrentUrl()}`);
  });
}

async function clearSession(driver) {
  // Gọi API logout để BE xóa cookie refreshToken, + clear storage client
  await driver.executeScript(`
    return (async () => {
      try {
        await fetch('${API_URL}/auth/logout', { method: 'POST', credentials: 'include' });
      } catch {}
      localStorage.clear();
      sessionStorage.clear();
    })();
  `);
  await driver.manage().deleteAllCookies();
}

export async function logout(driver) {
  try {
    const currentUrl = await driver.getCurrentUrl();
    if (!currentUrl.startsWith(BASE_URL)) {
      await driver.get(BASE_URL);
      await driver.sleep(300);
    }
    await clearSession(driver);
  } catch {
    await driver.get(BASE_URL);
    await driver.sleep(300);
    await driver.manage().deleteAllCookies();
  }

  await driver.get(`${BASE_URL}/login`);
  await driver.navigate().refresh();
  await driver.sleep(800);
}