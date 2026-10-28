import { BASE_URL, pageContains, By } from '../helpers/driver.js';
import { findAny, anyPageContains } from '../helpers/text.js';
import { dismissLocationDialog } from '../helpers/dialog.js';

const TAB_SELECTORS = {
  home: [By.xpath('//button[contains(@class,"nav-item")][contains(normalize-space(.), "Trang chủ")]')],
  booking: [By.xpath('//button[contains(@class,"nav-item")][contains(normalize-space(.), "Đặt lịch giặt")]')],
  orders: [By.xpath('//button[contains(@class,"nav-item")][contains(normalize-space(.), "Đơn hàng của tôi")]')],
  addresses: [By.xpath('//button[contains(@class,"nav-item")][contains(normalize-space(.), "Địa chỉ")]')],
  profile: [By.xpath('//button[contains(@class,"nav-item")][contains(normalize-space(.), "Tài khoản")]')],
};

export default class DashboardPage {
  constructor(driver) { this.driver = driver; }
  async open() { await this.driver.get(`${BASE_URL}/customer/dashboard`); }
  async isLoaded() {
    return anyPageContains(this.driver, ['Giặt sạch dễ dàng', 'LaundryBooking', 'Đặt lịch giặt'], 8000);
  }
  async openTab(tabName) {
    await dismissLocationDialog(this.driver);
    const locators = TAB_SELECTORS[tabName];
    if (!locators) throw new Error(`Unknown tab: ${tabName}`);
    const el = await findAny(this.driver, locators, 8000);
    if (!el) throw new Error(`Tab không tìm thấy: ${tabName}`);
    try { await el.click(); } catch { await this.driver.executeScript('arguments[0].click()', el); }
    await this.driver.sleep(800);
  }
  async waitForText(text, timeout = 6000) {
    return pageContains(this.driver, text, timeout);
  }
}
