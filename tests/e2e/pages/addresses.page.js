import { pageContains, By } from '../helpers/driver.js';
import { findAny } from '../helpers/text.js';

export default class AddressesPage {
  constructor(driver) { this.driver = driver; }
  async isLoaded() { return pageContains(this.driver, 'Địa chỉ của tôi', 5000); }

  async clickAddButton() {
    const btn = await findAny(this.driver, [
      By.xpath('//button[contains(@class,"primary-button")][contains(normalize-space(.), "Thêm địa chỉ")]'),
      By.css('.add-address-card'),
    ], 5000);
    if (!btn) return false;
    await btn.click();
    await this.driver.sleep(600);
    return true;
  }

  async fillAddressForm({ label, recipient, phone, addressLine, city, district, ward }) {
    const fillInput = async (labelText, value) => {
      const el = await findAny(this.driver, [
        By.xpath(`//label[contains(normalize-space(.), "${labelText}")]//input`),
      ], 3000);
      if (el) { await el.clear(); await el.sendKeys(value); return true; }
      return false;
    };
    if (recipient) await fillInput('Người nhận', recipient);
    if (phone) await fillInput('Số điện thoại', phone);
    if (addressLine) await fillInput('Số nhà, tên đường', addressLine);

    const selectByLabel = async (labelText, value) => {
      const sel = await findAny(this.driver, [
        By.xpath(`//label[contains(normalize-space(.), "${labelText}")]//select`),
      ], 3000);
      if (sel && value) {
        await this.driver.executeScript(
          `const s=arguments[0];[...s.options].forEach(o=>{if(o.text===arguments[1])s.value=o.value});s.dispatchEvent(new Event('change',{bubbles:true}));`,
          sel, value
        );
        await this.driver.sleep(300);
      }
    };
    if (label) await selectByLabel('Tên địa chỉ', label);
    if (city) await selectByLabel('Tỉnh/Thành phố', city);
    if (district) await selectByLabel('Quận/Huyện', district);
    if (ward) await selectByLabel('Phường/Xã', ward);
  }

  async save() {
    const btn = await findAny(this.driver, [
      By.xpath('//button[contains(@class,"primary-button")][contains(normalize-space(.), "Lưu địa chỉ")]'),
    ], 4000);
    if (!btn) return false;
    await btn.click();
    await this.driver.sleep(1500);
    return true;
  }

  async countCards() {
    return (await this.driver.findElements(By.css('.address-card'))).length;
  }
}
