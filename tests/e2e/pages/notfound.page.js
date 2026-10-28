import { BASE_URL } from '../helpers/driver.js';
import { anyPageContains } from '../helpers/text.js';
export default class NotFoundPage {
  constructor(driver) { this.driver = driver; }
  async open(path = '/this-route-does-not-exist-xyz') { await this.driver.get(`${BASE_URL}${path}`); }
  async isLoaded() { return anyPageContains(this.driver, ['404', 'Page not found']); }
}
