import { BASE_URL, waitForVisible, pageContains, By } from '../helpers/driver.js';

export default class LoginPage {
  constructor(driver) { this.driver = driver; }
  async open() { await this.driver.get(`${BASE_URL}/login`); }
  async isLoaded() { return pageContains(this.driver, 'Chào mừng trở lại'); }
  async fill(email, password) {
    const e = await waitForVisible(this.driver, By.css('input#email'));
    await e.clear(); await e.sendKeys(email);
    const p = await waitForVisible(this.driver, By.css('input#password'));
    await p.clear(); await p.sendKeys(password);
  }
  async submit() {
    const b = await waitForVisible(this.driver, By.css('button.auth-submit[type="submit"]'));
    await b.click();
  }
  async getError() {
    try {
      const el = await this.driver.findElement(By.css('p.auth-error[role="alert"]'));
      return await el.getText();
    } catch { return null; }
  }
}
