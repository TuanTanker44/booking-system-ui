import { expect } from 'chai';
import { createDriver } from '../helpers/driver.js';
import { login } from '../helpers/auth.js';
import { dismissLocationDialog } from '../helpers/dialog.js';
import DashboardPage from '../pages/dashboard.page.js';

describe('A. Dashboard - 5 tab', function () {
  let driver, dash;
  before(async function () {
    driver = await createDriver();
    await login(driver);
    await dismissLocationDialog(driver);
    dash = new DashboardPage(driver);
  });
  after(async function () { await driver.quit(); });

  it('load dashboard', async function () {
    expect(await dash.isLoaded()).to.be.true;
  });
  it('tab Trang chủ có hero', async function () {
    await dash.openTab('home');
    expect(await dash.waitForText('Giặt sạch dễ dàng')).to.be.true;
  });
  it('tab Đặt lịch có stepper', async function () {
    await dash.openTab('booking');
    expect(await dash.waitForText('BƯỚC 1')).to.be.true;
  });
  it('tab Đơn hàng có table', async function () {
    await dash.openTab('orders');
    expect(await dash.waitForText('Đơn hàng của tôi')).to.be.true;
  });
  it('tab Địa chỉ có heading', async function () {
    await dash.openTab('addresses');
    expect(await dash.waitForText('Địa chỉ của tôi')).to.be.true;
  });
  it('tab Tài khoản có heading', async function () {
    await dash.openTab('profile');
    expect(await dash.waitForText('Thông tin cá nhân')).to.be.true;
  });
});
