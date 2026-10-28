import { pageContains, By } from '../helpers/driver.js';
import { findAny } from '../helpers/text.js';

export default class OrdersPage {
  constructor(driver) { this.driver = driver; }
  async isLoaded() { return pageContains(this.driver, 'Đơn hàng của tôi', 5000); }
  async clickFilter(tabName) {
    const btn = await findAny(this.driver, [
      By.xpath(`//div[contains(@class,"filter-tabs")]//button[contains(normalize-space(.), "${tabName}")]`),
    ], 4000);
    if (!btn) return false;
    await btn.click();
    await this.driver.sleep(400);
    return true;
  }
  async search(text) {
    const input = await findAny(this.driver, [By.css('.orders-search input')], 4000);
    if (!input) return false;
    await input.clear();
    await input.sendKeys(text);
    await this.driver.sleep(400);
    return true;
  }
  async openFirstDetail() {
    const btn = await findAny(this.driver, [By.css('.table-action')], 4000);
    if (!btn) return false;
    await btn.click();
    await this.driver.sleep(800);
    return true;
  }
  async hasTable() {
    return (await this.driver.findElements(By.css('table'))).length > 0;
  }
}
