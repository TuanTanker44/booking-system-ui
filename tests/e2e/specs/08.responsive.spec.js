import { expect } from 'chai';
import { createDriver, pageContains, By } from '../helpers/driver.js';
import { login } from '../helpers/auth.js';
import { dismissLocationDialog } from '../helpers/dialog.js';

describe('A. Responsive mobile', function () {
  let driver;
  before(async function () {
    driver = await createDriver();
    await login(driver);
    await dismissLocationDialog(driver);
    await driver.manage().window().setRect({ width: 375, height: 812 });
    await driver.sleep(1000);
    await dismissLocationDialog(driver);
  });
  after(async function () { await driver.quit(); });

  it('hiện bottom nav', async function () {
    const els = await driver.findElements(By.css('.mobile-bottom-nav'));
    expect(els.length).to.be.greaterThan(0);
    expect(await els[0].isDisplayed()).to.be.true;
  });
  it('bottom nav có 5 mục', async function () {
    expect((await driver.findElements(By.css('.mobile-bottom-nav button'))).length).to.equal(5);
  });
  it('click "Đơn hàng" trên bottom nav', async function () {
    const btn = await driver.findElements(
      By.xpath('//nav[contains(@class,"mobile-bottom-nav")]//button[contains(normalize-space(.), "Đơn hàng")]')
    );
    expect(btn.length).to.be.greaterThan(0);
    try { await btn[0].click(); } catch { await driver.executeScript('arguments[0].click()', btn[0]); }
    await driver.sleep(800);
    expect(await pageContains(driver, 'Đơn hàng của tôi')).to.be.true;
  });
});
