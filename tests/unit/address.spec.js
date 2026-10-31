import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Exercise the actual service while keeping HTTP calls local to this test.
function createService() {
  const calls = [];
  const axios = {
    post: async (...args) => calls.push(args),
    patch: async (...args) => calls.push(args),
  };
  const source = readFileSync(new URL('../../src/services/address.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
  });
  const context = { exports: {}, require: () => ({ __esModule: true, default: axios }) };
  runInNewContext(outputText, context);
  return { service: context.exports.AddressService, calls };
}

const input = {
  label: 'Nhà riêng', recipientName: 'Người nhận', phone: '0901234567',
  addressLine: '123 Xuân Thủy', ward: 'Dịch Vọng Hậu', district: 'Cầu Giấy',
  city: 'Hà Nội', isDefault: false, latitude: 21.02851, longitude: 105.80482,
};

describe('Address coordinate fallback', function () {
  for (const method of ['create', 'update']) {
    const save = (service, body) => method === 'create' ? service.create(body) : service.update(42, body);

    it(`${method}: sends selected coordinates as lat and long`, async function () {
      const { service, calls } = createService();
      await save(service, input);
      assert.equal(calls[0][0], method === 'create' ? '/addresses' : '/addresses/42');
      assert.equal(calls[0][1].lat, input.latitude);
      assert.equal(calls[0][1].long, input.longitude);
      assert.equal(calls[0][1].address_line, input.addressLine);
    });

    it(`${method}: rejects missing, incomplete, and invalid coordinates before HTTP`, async function () {
      const { service, calls } = createService();
      for (const coordinates of [
        { latitude: null, longitude: null },
        { latitude: undefined }, { longitude: undefined },
        { latitude: NaN }, { longitude: Infinity },
        { latitude: 90.1 }, { latitude: -90.1 },
        { longitude: 180.1 }, { longitude: -180.1 },
      ]) {
        await assert.rejects(save(service, { ...input, ...coordinates }));
      }
      assert.equal(calls.length, 0);
    });

    it(`${method}: accepts zero coordinates and valid range boundaries`, async function () {
      const { service, calls } = createService();
      for (const [latitude, longitude] of [[0, 0], [-90, -180], [90, 180]]) {
        await save(service, { ...input, latitude, longitude });
        assert.equal(calls.at(-1)[1].lat, latitude);
        assert.equal(calls.at(-1)[1].long, longitude);
      }
    });
  }
});
