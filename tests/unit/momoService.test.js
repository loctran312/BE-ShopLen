const crypto = require('crypto');
const momoService = require('../../src/services/momoService');

const SECRET = process.env.MOMO_SECRET_KEY;

describe('services/momoService', () => {
  describe('verifyIpnSignature', () => {
    const buildIpnData = () => ({
      amount: '50000',
      extraData: '',
      message: 'Successful.',
      orderId: 'DH-20260709-0001-1234567890',
      orderInfo: 'Thanh toan don hang',
      orderType: 'momoWallet',
      partnerCode: 'MOMO',
      payType: 'creditCard',
      requestId: 'DH-20260709-0001-1234567890',
      responseTime: '1700000000000',
      resultCode: '0',
      transId: '1234567890',
    });

    const computeSignature = (data) => {
      const raw = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${data.amount}&extraData=${data.extraData}&message=${data.message}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&orderType=${data.orderType}&partnerCode=${data.partnerCode}&payType=${data.payType}&requestId=${data.requestId}&responseTime=${data.responseTime}&resultCode=${data.resultCode}&transId=${data.transId}`;
      return crypto.createHmac('sha256', SECRET).update(raw).digest('hex');
    };

    it('returns true when signature matches', () => {
      const data = buildIpnData();
      data.signature = computeSignature(data);

      expect(momoService.verifyIpnSignature(data)).toBe(true);
    });

    it('returns false when signature does not match', () => {
      const data = buildIpnData();
      data.signature = 'wrong_signature';

      expect(momoService.verifyIpnSignature(data)).toBe(false);
    });

    it('returns false when a field is tampered after signing', () => {
      const data = buildIpnData();
      data.signature = computeSignature(data);
      data.amount = '999999';

      expect(momoService.verifyIpnSignature(data)).toBe(false);
    });
  });
});
