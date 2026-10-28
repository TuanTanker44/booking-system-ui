import { BASE_URL, waitForVisible, pageContains, By } from '../helpers/driver.js';

export default class ForgotPage {
  constructor(driver) { this.driver = driver; }
  async open() { await this.driver.get(`${BASE_URL}/forgot-password`); }
  async isLoaded() { return pageContains(this.driver, 'Quên mật khẩu'); }
  async fill(email) {
    const e = await waitForVisible(this.driver, By.css('input#forgot-email'));
    await e.clear(); await e.sendKeys(email);
  }
  async submit() {
    const b = await waitForVisible(this.driver, By.css('form.forgot-form button[type="submit"]'));
    await b.click();
  }
  async isSuccess() { return pageContains(this.driver, 'Kiểm tra hộp thư'); }
  async getError() {
    try {
      const el = await this.driver.findElement(By.css('p.forgot-error[role="alert"]'));
      return await el.getText();
    } catch { return null; }
  }
}
