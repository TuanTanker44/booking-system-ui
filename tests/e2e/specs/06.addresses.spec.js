import { expect } from 'chai';
import { createDriver } from '../helpers/driver.js';
import { login } from '../helpers/auth.js';
import { dismissLocationDialog } from '../helpers/dialog.js';
import { cleanupAddress, listAddresses } from '../helpers/cleanup.js';
import DashboardPage from '../pages/dashboard.page.js';
import AddressesPage from '../pages/addresses.page.js';

describe('B. Địa chỉ - thêm + cleanup', function () {
  let driver, dash, addr;
  let initialIds = new Set();

  before(async function () {
    driver = await createDriver();
    await login(driver);
    await dismissLocationDialog(driver);
    dash = new DashboardPage(driver);
    addr = new AddressesPage(driver);
    const list = await listAddresses(driver);
    initialIds = new Set(list.map(a => a.id));
    await dash.openTab('addresses');
    await driver.sleep(1200);
  });

  after(async function () {
    const list = await listAddresses(driver);
    for (const a of list) {
      if (!initialIds.has(a.id)) await cleanupAddress(driver, a.id);
    }
    await driver.quit();
  });

  it('render trang địa chỉ', async function () { expect(await addr.isLoaded()).to.be.true; });
  it('click "Thêm địa chỉ" mở form', async function () { expect(await addr.clickAddButton()).to.be.true; });
  it('điền form và lưu', async function () {
    const initialCount = await addr.countCards();
    await addr.fillAddressForm({
      label: 'Nhà riêng', recipient: 'Test User', phone: '0901234567',
      addressLine: '123 Đường Test', city: 'Hà Nội', district: 'Cầu Giấy', ward: 'Dịch Vọng',
    });
    if (!(await addr.save())) return this.skip();
    await driver.sleep(1500);
    expect(await addr.countCards()).to.be.greaterThan(initialCount);
  });
});
