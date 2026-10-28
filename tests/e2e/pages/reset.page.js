import { BASE_URL, waitForVisible, pageContains, By } from '../helpers/driver.js';

export default class ResetPage {
  constructor(driver) { this.driver = driver; }
  async open(token) {
    const url = token ? `${BASE_URL}/reset-password?token=${token}` : `${BASE_URL}/reset-password`;
    await this.driver.get(url);
  }
  async isLoaded() { return pageContains(this.driver, 'Tạo mật khẩu mới'); }
  async fill(password, confirm) {
    const p = await waitForVisible(this.driver, By.css('input#reset-password'));
    await p.clear(); await p.sendKeys(password);
    const c = await waitForVisible(this.driver, By.css('input#reset-confirm-password'));
    await c.clear(); await c.sendKeys(confirm);
  }
  async submit() {
    const b = await waitForVisible(this.driver, By.css('button.reset-submit[type="submit"]'));
    await b.click();
  }
  async hasTokenError() {
    return pageContains(this.driver, 'thiếu token') || pageContains(this.driver, 'không hợp lệ');
  }
  async getError() {
    try {
      const els = await this.driver.findElements(By.css('.reset-error[role="alert"]'));
      for (const el of els) {
        const txt = await el.getText();
        if (txt.trim()) return txt;
      }
      return null;
    } catch { return null; }
  }
}
