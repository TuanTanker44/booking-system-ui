import { pageContains, By } from '../helpers/driver.js';
import { findAny } from '../helpers/text.js';

export default class BookingPage {
  constructor(driver) { this.driver = driver; }

  async selectFirstStore() {
    const els = await this.driver.findElements(By.css('.booking-store'));
    if (els.length === 0) return false;
    await els[0].click();
    await this.driver.sleep(500);
    return true;
  }

  async selectFirstService() {
    const els = await this.driver.findElements(By.css('.booking-store'));
    if (els.length < 2) return false;
    await els[1].click();
    await this.driver.sleep(500);
    return true;
  }

  async fillWeight(kg) {
    const input = await findAny(this.driver, [
      By.css('input[type="number"][placeholder*="3.5"]'),
      By.css('input[type="number"]'),
    ], 4000);
    if (!input) return false;
    await input.clear();
    await input.sendKeys(String(kg));
    return true;
  }

  async fillItems(items) {
    const inputs = await this.driver.findElements(By.css('.item-row > input'));
    if (inputs.length === 0) return false;
    for (let i = 0; i < Math.min(inputs.length, items.length); i++) {
      await inputs[i].clear();
      await inputs[i].sendKeys(items[i]);
    }
    return true;
  }

  async clickContinue() {
    const btn = await findAny(this.driver, [
      By.xpath('//button[contains(@class,"primary-button")][contains(normalize-space(.), "Tiếp tục")]'),
    ], 4000);
    if (!btn) return false;
    await btn.click();
    await this.driver.sleep(800);
    return true;
  }

  async selectInStoreMode() {
    const btn = await findAny(this.driver, [
      By.xpath('//button[@role="radio"][contains(normalize-space(.), "Tôi tự mang đến cửa hàng")]'),
    ], 4000);
    if (!btn) return false;
    await btn.click();
    await this.driver.sleep(500);
    return true;
  }

  async pickFirstSlot() {
    const slot = await findAny(this.driver, [By.css('.slot-chip:not(:disabled)')], 6000);
    if (!slot) return false;
    await slot.click();
    await this.driver.sleep(300);
    return true;
  }

  async clickConfirm() {
    const btn = await findAny(this.driver, [
      By.xpath('//button[contains(@class,"primary-button")][contains(normalize-space(.), "Xác nhận đặt lịch")]'),
    ], 6000);
    if (!btn) return false;
    await btn.click();
    await this.driver.sleep(1500);
    return true;
  }

  async isSuccessModalVisible() {
    return pageContains(this.driver, 'Chọn phương thức thanh toán', 8000);
  }
}
