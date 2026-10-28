import { expect } from 'chai';
import { createDriver, BASE_URL } from '../helpers/driver.js';
import LoginPage from '../pages/login.page.js';
import RegisterPage from '../pages/register.page.js';
import ForgotPage from '../pages/forgot.page.js';
import ResetPage from '../pages/reset.page.js';
import HelpPage from '../pages/help.page.js';
import NotFoundPage from '../pages/notfound.page.js';

describe('A. Public pages (không cần auth)', function () {
  let driver;
  before(async function () { driver = await createDriver(); });
  after(async function () { await driver.quit(); });

  describe('Login', function () {
    it('render đúng', async function () {
      const p = new LoginPage(driver); await p.open();
      expect(await p.isLoaded()).to.be.true;
    });
  });

  describe('Register validate (bypass HTML5)', function () {
    let p;
    beforeEach(async function () {
      p = new RegisterPage(driver);
      await p.open();
      await driver.executeScript('document.querySelector("form") && (document.querySelector("form").noValidate = true)');
    });

    it('thiếu ngày sinh → lỗi', async function () {
      await p.fill({ name: 'Test User', dob: '', email: `t${Date.now()}@a.com`, password: 'Abcd1234', confirm: 'Abcd1234' });
      await p.submit();
      await driver.sleep(500);
      const err = await p.getError();
      expect(err).to.match(/ngày sinh/i);
    });

    it('password yếu → lỗi', async function () {
      await p.fill({ name: 'Test User', dob: '2000-01-01', email: `t${Date.now()}@a.com`, password: 'abc', confirm: 'abc' });
      await p.submit();
      await driver.sleep(500);
      const err = await p.getError();
      expect(err).to.match(/mật khẩu/i);
    });

    it('confirm mismatch → lỗi', async function () {
      await p.fill({ name: 'Test User', dob: '2000-01-01', email: `t${Date.now()}@a.com`, password: 'Abcd1234', confirm: 'Abcd9999' });
      await p.submit();
      await driver.sleep(500);
      const err = await p.getError();
      expect(err).to.match(/xác nhận/i);
    });

    it('password rules cập nhật khi gõ', async function () {
      await p.fill({ password: 'Abcd1234' });
      const passed = await p.passwordRulesPassed();
      expect(passed).to.equal(4);
    });
  });

  describe('Forgot password', function () {
    let p;
    beforeEach(async function () { p = new ForgotPage(driver); await p.open(); });
    it('render đúng', async function () { expect(await p.isLoaded()).to.be.true; });
    it('submit email hợp lệ → success message', async function () {
      await p.fill(`notexist_${Date.now()}@a.com`);
      await p.submit();
      await driver.sleep(1000);
      expect(await p.isSuccess()).to.be.true;
    });
  });

  describe('Reset password', function () {
    it('thiếu token → hiện lỗi', async function () {
      const p = new ResetPage(driver); await p.open(null);
      await driver.sleep(800);
      expect(await p.isLoaded()).to.be.true;
      const err = await p.getError();
      expect(err).to.match(/token/i);
    });
    it('password yếu với token giả → lỗi validate', async function () {
      const p = new ResetPage(driver); await p.open('fake-token-xyz');
      await driver.sleep(500);
      await driver.executeScript('document.querySelector("form.reset-form") && (document.querySelector("form.reset-form").noValidate = true)');
      await p.fill('abc', 'abc');
      await p.submit();
      await driver.sleep(800);
      const err = await p.getError();
      expect(err).to.match(/mật khẩu/i);
    });
  });

  describe('Help', function () {
    it('render đúng', async function () {
      const p = new HelpPage(driver); await p.open();
      await driver.sleep(800);
      expect(await p.isLoaded()).to.be.true;
    });
  });

  describe('404', function () {
    it('route lạ → trang 404', async function () {
      const p = new NotFoundPage(driver); await p.open();
      expect(await p.isLoaded()).to.be.true;
    });
  });

  describe('Redirect /', function () {
    it('/ → /login', async function () {
      await driver.get(`${BASE_URL}/`);
      await driver.sleep(800);
      expect(await driver.getCurrentUrl()).to.include('/login');
    });
  });
});
