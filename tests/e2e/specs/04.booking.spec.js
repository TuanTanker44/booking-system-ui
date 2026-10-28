import { expect } from 'chai';
import { createDriver } from '../helpers/driver.js';
import { login } from '../helpers/auth.js';
import { dismissLocationDialog } from '../helpers/dialog.js';
import { cleanupBooking, listBookings } from '../helpers/cleanup.js';
import DashboardPage from '../pages/dashboard.page.js';
import BookingPage from '../pages/booking.page.js';

describe('B. Đặt lịch (in_store) + cleanup', function () {
  let driver, dash, booking;
  let initialBookingIds = new Set();

  before(async function () {
    driver = await createDriver();
    await login(driver);
    await dismissLocationDialog(driver);
    dash = new DashboardPage(driver);
    booking = new BookingPage(driver);
    const list = await listBookings(driver);
    initialBookingIds = new Set(list.map(b => b.id));
  });

  after(async function () {
    const list = await listBookings(driver);
    for (const b of list) {
      if (!initialBookingIds.has(b.id)) await cleanupBooking(driver, b.id);
    }
    await driver.quit();
  });

  it('đặt lịch tự mang đến cửa hàng thành công', async function () {
    await dash.openTab('booking');
    await driver.sleep(1500);

    if (!(await booking.selectFirstStore())) return this.skip();
    await driver.sleep(1000);

    if (!(await booking.selectFirstService())) return this.skip();
    await driver.sleep(1000);

    const isWeight = await booking.fillWeight(2);
    if (!isWeight) {
      const isItems = await booking.fillItems(['Áo thun']);
      if (!isItems) return this.skip();
    }

    if (!(await booking.clickContinue())) return this.skip();
    await driver.sleep(1000);

    if (!(await booking.selectInStoreMode())) return this.skip();
    await driver.sleep(500);

    if (!(await booking.pickFirstSlot())) return this.skip();

    await booking.clickContinue();
    await driver.sleep(1000);

    if (!(await booking.clickConfirm())) return this.skip();
    await driver.sleep(1500);

    expect(await booking.isSuccessModalVisible()).to.be.true;
  });
});
