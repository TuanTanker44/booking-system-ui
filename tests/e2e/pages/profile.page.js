import { pageContains, By } from '../helpers/driver.js';
import { findAny } from '../helpers/text.js';

export default class ProfilePage {
  constructor(driver) { this.driver = driver; }
  async isLoaded() { return pageContains(this.driver, 'Thông tin cá nhân', 5000); }

  async openPasswordTab() {
    const btn = await findAny(this.driver, [
      By.xpath('//div[contains(@class,"profile-menu-list")]//button[contains(normalize-space(.), "Đổi mật khẩu")]'),
    ], 4000);
    if (!btn) return false;
    await btn.click();
    await this.driver.sleep(600);
    return true;
  }

  async fillPasswordForm(current, next, confirm) {
    const inputs = await this.driver.findElements(By.css('.password-input input'));
    if (inputs.length < 3) return false;
    await inputs[0].clear(); await inputs[0].sendKeys(current);
    await inputs[1].clear(); await inputs[1].sendKeys(next);
    await inputs[2].clear(); await inputs[2].sendKeys(confirm);
    return true;
  }

  async submitPassword() {
    const btn = await findAny(this.driver, [
      By.xpath('//button[@type="submit"][contains(normalize-space(.), "Cập nhật mật khẩu")]'),
    ], 4000);
    if (!btn) return false;
    await btn.click();
    await this.driver.sleep(1200);
    return true;
  }

  async getPasswordError() {
    try {
      const els = await this.driver.findElements(By.css('.password-error[role="alert"]'));
      for (const el of els) { const t = await el.getText(); if (t.trim()) return t; }
      return null;
    } catch { return null; }
  }

  async clickEdit() {
    const btn = await findAny(this.driver, [
      By.xpath('//button[contains(@class,"outline-button")][contains(normalize-space(.), "Chỉnh sửa")]'),
    ], 4000);
    if (!btn) return false;
    await btn.click();
    await this.driver.sleep(400);
    return true;
  }

  async getNameInputValue() {
    const el = await findAny(this.driver, [
      By.xpath('//label[contains(normalize-space(.), "Họ và tên")]//input'),
    ], 3000);
    if (!el) return null;
    return await el.getAttribute('value');
  }

  async setName(value) {
    const el = await findAny(this.driver, [
      By.xpath('//label[contains(normalize-space(.), "Họ và tên")]//input'),
    ], 3000);
    if (!el) return false;
    await el.clear();
    await el.sendKeys(value);
    return true;
  }

  async clickSave() {
    const btn = await findAny(this.driver, [
      By.xpath('//button[contains(@class,"outline-button")][contains(normalize-space(.), "Lưu thay đổi")]'),
    ], 4000);
    if (!btn) return false;
    await btn.click();
    await this.driver.sleep(1500);
    return true;
  }

  async logout() {
    const btn = await findAny(this.driver, [By.css('.logout-button')], 4000);
    if (!btn) return false;
    await btn.click();
    await this.driver.sleep(1000);
    return true;
  }
}
