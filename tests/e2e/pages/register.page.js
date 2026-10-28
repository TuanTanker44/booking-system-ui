import { BASE_URL, waitForVisible, pageContains, By } from '../helpers/driver.js';

export default class RegisterPage {
  constructor(driver) { this.driver = driver; }
  async open() { await this.driver.get(`${BASE_URL}/register`); }
  async isLoaded() { return pageContains(this.driver, 'Tạo tài khoản'); }
  async fill({ name, dob, email, password, confirm }) {
    if (name !== undefined) { const e = await waitForVisible(this.driver, By.css('input#name')); await e.clear(); await e.sendKeys(name); }
    if (dob !== undefined) { const e = await waitForVisible(this.driver, By.css('input#date-of-birth')); await e.clear(); await e.sendKeys(dob); }
    if (email !== undefined) { const e = await waitForVisible(this.driver, By.css('input#register-email')); await e.clear(); await e.sendKeys(email); }
    if (password !== undefined) { const e = await waitForVisible(this.driver, By.css('input#register-password')); await e.clear(); await e.sendKeys(password); }
    if (confirm !== undefined) { const e = await waitForVisible(this.driver, By.css('input#confirm-password')); await e.clear(); await e.sendKeys(confirm); }
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
  async passwordRulesPassed() {
    const els = await this.driver.findElements(By.css('.password-rule-passed'));
    return els.length;
  }
}
