import { expect } from 'chai';
import { createDriver } from '../helpers/driver.js';
import { login } from '../helpers/auth.js';
import { dismissLocationDialog } from '../helpers/dialog.js';
import DashboardPage from '../pages/dashboard.page.js';
import ProfilePage from '../pages/profile.page.js';

describe('A+C. Profile - validate password, update info, logout', function () {
  let driver, dash, profile;
  let originalName = null;

  before(async function () {
    driver = await createDriver();
    await login(driver);
    await dismissLocationDialog(driver);
    dash = new DashboardPage(driver);
    profile = new ProfilePage(driver);
    await dash.openTab('profile');
    await driver.sleep(1500);
  });

  after(async function () {
    if (originalName !== null) {
      try {
        await dash.openTab('profile');
        await driver.sleep(1200);
        await profile.clickEdit();
        await profile.setName(originalName);
        await profile.clickSave();
      } catch {}
    }
    await driver.quit();
  });

  it('render profile', async function () { expect(await profile.isLoaded()).to.be.true; });

  async function submitPasswordCase(current, next, confirm) {
    await profile.openPasswordTab();
    await driver.sleep(400);
    await driver.executeScript('document.querySelectorAll("form")[0] && (document.querySelectorAll("form")[0].noValidate = true)');
    await profile.fillPasswordForm(current, next, confirm);
    await profile.submitPassword();
    await driver.sleep(800);
    return await profile.getPasswordError();
  }

  it('validate: mật khẩu mới yếu → lỗi', async function () {
    const err = await submitPasswordCase('current', 'abc', 'abc');
    expect(err).to.match(/mật khẩu/i);
  });
  it('validate: confirm mismatch → lỗi', async function () {
    const err = await submitPasswordCase('current', 'Abcd1234', 'Abcd9999');
    expect(err).to.match(/khớp/i);
  });
  it('validate: mật khẩu mới trùng mật khẩu cũ → lỗi', async function () {
    const err = await submitPasswordCase('Abcd1234', 'Abcd1234', 'Abcd1234');
    expect(err).to.match(/khác/i);
  });

  it('C: đổi tên profile rồi restore', async function () {
    await dash.openTab('profile');
    await driver.sleep(1000);
    originalName = await profile.getNameInputValue();
    if (!originalName) return this.skip();
    await profile.clickEdit();
    const newName = `${originalName} E2E`;
    await profile.setName(newName);
    await profile.clickSave();
    await driver.sleep(1500);
    expect(await profile.getNameInputValue()).to.equal(newName);
  });

  it('logout → về /login', async function () {
    await dash.openTab('profile');
    await driver.sleep(1200);
    expect(await profile.logout()).to.be.true;
    await driver.sleep(1000);
    expect(await driver.getCurrentUrl()).to.include('/login');
  });
});
