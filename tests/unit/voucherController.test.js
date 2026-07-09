// Unit tests for voucherController — mocks the repository to test discount logic.

jest.mock('../../src/repositories/voucherRepository', () => ({
  getAvailableVouchers: jest.fn(),
  getVoucherByCode: jest.fn(),
  getUserVoucherUsage: jest.fn(),
  getAllVouchersAdmin: jest.fn(),
  getVoucherById: jest.fn(),
  createVoucher: jest.fn(),
  updateVoucher: jest.fn(),
  deleteVoucher: jest.fn(),
  saveVoucherToAccount: jest.fn(),
  getMySavedVouchers: jest.fn(),
  filterVouchersAdmin: jest.fn(),
}));

const voucherRepository = require('../../src/repositories/voucherRepository');
const voucherController = require('../../src/controllers/voucherController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const USER_ID = 1;

const makeVoucher = (overrides = {}) => ({
  voucher_id: 1,
  code: 'WELCOME10',
  discount_type: 'percent',
  value: 10,
  minimum_value: null,
  max_discount: null,
  quantity: null,
  used_count: 0,
  start_date: null,
  end_date: null,
  ...overrides,
});

describe('controllers/voucherController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('applyVoucher', () => {
    const baseReq = (overrides = {}) => ({
      user: { user_id: USER_ID },
      body: {
        code: 'WELCOME10',
        order_value: 200000,
        shipping_method_id: 'GH_NHANH',
        ...overrides,
      },
    });

    it('calculates percent discount correctly', async () => {
      voucherRepository.getVoucherByCode.mockResolvedValue({
        rows: [makeVoucher({ discount_type: 'percent', value: 10 })],
      });
      voucherRepository.getUserVoucherUsage.mockResolvedValue({ rows: [] });

      const req = baseReq();
      const res = mockRes();

      await voucherController.applyVoucher(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ discount_amount: 20000, original_amount: 200000, final_amount: 180000 }),
        })
      );
    });

    it('caps percent discount at max_discount', async () => {
      voucherRepository.getVoucherByCode.mockResolvedValue({
        rows: [makeVoucher({ discount_type: 'percent', value: 50, max_discount: 50000 })],
      });
      voucherRepository.getUserVoucherUsage.mockResolvedValue({ rows: [] });

      const req = baseReq({ order_value: 200000 });
      const res = mockRes();

      await voucherController.applyVoucher(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ discount_amount: 50000, final_amount: 150000 }),
        })
      );
    });

    it('calculates fixed discount correctly', async () => {
      voucherRepository.getVoucherByCode.mockResolvedValue({
        rows: [makeVoucher({ discount_type: 'fixed', value: 50000 })],
      });
      voucherRepository.getUserVoucherUsage.mockResolvedValue({ rows: [] });

      const req = baseReq({ order_value: 200000 });
      const res = mockRes();

      await voucherController.applyVoucher(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ discount_amount: 50000, final_amount: 150000 }),
        })
      );
    });

    it('caps fixed discount at order value', async () => {
      voucherRepository.getVoucherByCode.mockResolvedValue({
        rows: [makeVoucher({ discount_type: 'fixed', value: 500000 })],
      });
      voucherRepository.getUserVoucherUsage.mockResolvedValue({ rows: [] });

      const req = baseReq({ order_value: 100000 });
      const res = mockRes();

      await voucherController.applyVoucher(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ discount_amount: 100000, final_amount: 0 }),
        })
      );
    });

    it('calculates free_ship discount as shipping fee', async () => {
      voucherRepository.getVoucherByCode.mockResolvedValue({
        rows: [makeVoucher({ discount_type: 'free_ship', value: 0, max_discount: null })],
      });
      voucherRepository.getUserVoucherUsage.mockResolvedValue({ rows: [] });

      const req = baseReq({ shipping_method_id: 'GH_NHANH' });
      const res = mockRes();

      await voucherController.applyVoucher(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ discount_amount: 32000 }),
        })
      );
    });

    it('caps free_ship at max_discount', async () => {
      voucherRepository.getVoucherByCode.mockResolvedValue({
        rows: [makeVoucher({ discount_type: 'free_ship', value: 0, max_discount: 20000 })],
      });
      voucherRepository.getUserVoucherUsage.mockResolvedValue({ rows: [] });

      const req = baseReq({ shipping_method_id: 'GH_NHANH' });
      const res = mockRes();

      await voucherController.applyVoucher(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ discount_amount: 20000 }),
        })
      );
    });

    it('rejects free_ship when no shipping method is selected', async () => {
      voucherRepository.getVoucherByCode.mockResolvedValue({
        rows: [makeVoucher({ discount_type: 'free_ship' })],
      });
      voucherRepository.getUserVoucherUsage.mockResolvedValue({ rows: [] });

      const req = baseReq({ shipping_method_id: null });
      const res = mockRes();

      await voucherController.applyVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Vui lòng chọn phương thức vận chuyển trước khi áp dụng mã Freeship' })
      );
    });

    it('returns 400 when code is missing', async () => {
      const req = baseReq({ code: null });
      const res = mockRes();

      await voucherController.applyVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Vui lòng nhập mã giảm giá' })
      );
    });

    it('returns 404 when voucher does not exist', async () => {
      voucherRepository.getVoucherByCode.mockResolvedValue({ rows: [] });
      const req = baseReq();
      const res = mockRes();

      await voucherController.applyVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Mã giảm giá không tồn tại' })
      );
    });

    it('rejects when voucher has been used up', async () => {
      voucherRepository.getVoucherByCode.mockResolvedValue({
        rows: [makeVoucher({ quantity: 100, used_count: 100 })],
      });
      const req = baseReq();
      const res = mockRes();

      await voucherController.applyVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Mã giảm giá đã hết lượt sử dụng' })
      );
    });

    it('rejects when user has already used this voucher', async () => {
      voucherRepository.getVoucherByCode.mockResolvedValue({ rows: [makeVoucher()] });
      voucherRepository.getUserVoucherUsage.mockResolvedValue({ rows: [{ so_lan_su_dung: 1 }] });

      const req = baseReq();
      const res = mockRes();

      await voucherController.applyVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Bạn đã sử dụng mã giảm giá này rồi' })
      );
    });

    it('rejects when order value is below minimum_value', async () => {
      voucherRepository.getVoucherByCode.mockResolvedValue({
        rows: [makeVoucher({ minimum_value: 500000 })],
      });
      voucherRepository.getUserVoucherUsage.mockResolvedValue({ rows: [] });

      const req = baseReq({ order_value: 100000 });
      const res = mockRes();

      await voucherController.applyVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Đơn hàng phải từ') })
      );
    });

    it('rejects an expired voucher', async () => {
      voucherRepository.getVoucherByCode.mockResolvedValue({
        rows: [makeVoucher({ end_date: '2020-01-01T00:00:00Z' })],
      });
      voucherRepository.getUserVoucherUsage.mockResolvedValue({ rows: [] });

      const req = baseReq();
      const res = mockRes();

      await voucherController.applyVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Mã giảm giá đã hết hạn' })
      );
    });
  });

  describe('saveVoucher', () => {
    it('saves a valid voucher to user wallet', async () => {
      voucherRepository.getVoucherById.mockResolvedValue({ rows: [makeVoucher()] });
      voucherRepository.saveVoucherToAccount.mockResolvedValue(true);

      const req = { user: { user_id: USER_ID }, body: { voucher_id: 1 } };
      const res = mockRes();

      await voucherController.saveVoucher(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Lưu voucher thành công' })
      );
    });

    it('returns 400 when voucher is already saved', async () => {
      voucherRepository.getVoucherById.mockResolvedValue({ rows: [makeVoucher()] });
      voucherRepository.saveVoucherToAccount.mockResolvedValue(false);

      const req = { user: { user_id: USER_ID }, body: { voucher_id: 1 } };
      const res = mockRes();

      await voucherController.saveVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Bạn đã lưu voucher này vào ví rồi' })
      );
    });

    it('returns 404 when voucher does not exist', async () => {
      voucherRepository.getVoucherById.mockResolvedValue({ rows: [] });

      const req = { user: { user_id: USER_ID }, body: { voucher_id: 999 } };
      const res = mockRes();

      await voucherController.saveVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createVoucher', () => {
    it('creates a voucher with valid payload', async () => {
      voucherRepository.createVoucher.mockResolvedValue({ voucher_id: 5, code: 'NEW50' });

      const req = {
        body: { code: 'NEW50', discount_type: 'fixed', value: 50000 },
      };
      const res = mockRes();

      await voucherController.createVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Tạo voucher thành công' })
      );
    });

    it('returns 400 when required fields are missing', async () => {
      const req = { body: { code: 'NEW50' } };
      const res = mockRes();

      await voucherController.createVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Thiếu thông tin bắt buộc (code, discount_type, value)' })
      );
    });

    it('returns 400 on duplicate code (23505)', async () => {
      voucherRepository.createVoucher.mockRejectedValue({ code: '23505' });

      const req = { body: { code: 'WELCOME10', discount_type: 'fixed', value: 50000 } };
      const res = mockRes();

      await voucherController.createVoucher(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Mã code này đã tồn tại' })
      );
    });
  });
});
