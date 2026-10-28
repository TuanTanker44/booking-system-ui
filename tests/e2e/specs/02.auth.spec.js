import { expect } from 'chai';
import { createDriver, BASE_URL } from '../helpers/driver.js';
import { login, logout, TEST_EMAIL } from '../helpers/auth.js';
import LoginPage from '../pages/login.page.js';

describe('A. Auth flow & phân quyền', function () {
  let driver;
  before(async function () { driver = await createDriver(); });
  after(async function () { await driver.quit(); });

  // Đảm bảo mỗi test bắt đầu từ trạng thái chưa login
  beforeEach(async function () {
    await logout(driver);
  });

  it('login đúng → /customer/dashboard', async function () {
    await login(driver);
    expect(await driver.getCurrentUrl()).to.include('/customer/dashboard');
  });

  it('login sai mật khẩu → lỗi', async function () {
    const p = new LoginPage(driver);
    await p.open();
    await p.fill(TEST_EMAIL, 'wrong-password-xyz');
    await p.submit();
    await driver.sleep(1500);
    const err = await p.getError();
    expect(err).to.be.a('string').and.not.empty;
    expect(await driver.getCurrentUrl()).to.include('/login');
  });

  it('CUSTOMER vào /admin/users → /forbidden', async function () {
    await login(driver);
    await driver.get(`${BASE_URL}/admin/users`);
    await driver.sleep(1500);
    expect(await driver.getCurrentUrl()).to.include('/forbidden');
  });

  it('đã login vào /login → redirect dashboard', async function () {
    await login(driver);
    await driver.get(`${BASE_URL}/login`);
    await driver.sleep(1200);
    expect(await driver.getCurrentUrl()).to.include('/customer/dashboard');
  });
});
