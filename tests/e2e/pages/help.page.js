import { BASE_URL, pageContains } from '../helpers/driver.js';
export default class HelpPage {
  constructor(driver) { this.driver = driver; }
  async open() { await this.driver.get(`${BASE_URL}/help`); }
  async isLoaded() {
    return pageContains(this.driver, 'giúp gì cho bạn', 8000) ||
           pageContains(this.driver, 'TRUNG TÂM HỖ TRỢ', 8000);
  }
}
