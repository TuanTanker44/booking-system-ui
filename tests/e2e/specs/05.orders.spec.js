import { expect } from 'chai';
import { createDriver } from '../helpers/driver.js';
import { login } from '../helpers/auth.js';
import { dismissLocationDialog } from '../helpers/dialog.js';
import DashboardPage from '../pages/dashboard.page.js';
import OrdersPage from '../pages/orders.page.js';

describe('B. Đơn hàng - filter, search, detail', function () {
  let driver, dash, orders;
  before(async function () {
    driver = await createDriver();
    await login(driver);
    await dismissLocationDialog(driver);
    dash = new DashboardPage(driver);
    orders = new OrdersPage(driver);
    await dash.openTab('orders');
    await driver.sleep(1500);
  });
  after(async function () { await driver.quit(); });

  it('render trang đơn hàng', async function () { expect(await orders.isLoaded()).to.be.true; });
  it('có table', async function () { expect(await orders.hasTable()).to.be.true; });
  it('click filter "Đang xử lý"', async function () { expect(await orders.clickFilter('Đang xử lý')).to.be.true; });
  it('search text', async function () { expect(await orders.search('ĐƠ')).to.be.true; });
  it('mở chi tiết đơn đầu tiên (nếu có)', async function () {
    if (!(await orders.openFirstDetail())) return this.skip();
    await driver.sleep(500);
  });
});
