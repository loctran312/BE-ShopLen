// Unit tests for orderController — mocks repository and momoService.

jest.mock('../../src/repositories/orderRepository', () => ({
  createOrder: jest.fn(),
  createBuyNowOrder: jest.fn(),
  getUserOrders: jest.fn(),
  getOrderDetail: jest.fn(),
  cancelUserOrder: jest.fn(),
  getAllOrdersAdmin: jest.fn(),
  updateOrderStatus: jest.fn(),
  filterOrdersAdmin: jest.fn(),
}));

jest.mock('../../src/repositories/cartRepository', () => ({
  getVariantStock: jest.fn(),
  getCartItem: jest.fn(),
  addItemToCart: jest.fn(),
}));

jest.mock('../../src/services/momoService', () => ({
  createPaymentUrl: jest.fn(),
  refundPayment: jest.fn(),
}));

const orderRepository = require('../../src/repositories/orderRepository');
const cartRepository = require('../../src/repositories/cartRepository');
const momoService = require('../../src/services/momoService');
const orderController = require('../../src/controllers/orderController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const USER_ID = 1;

describe('controllers/orderController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createOrder', () => {
    const validBody = {
      phuong_xa_id: 1,
      dia_chi_giao_hang: 'Quận 8, TP.HCM',
      ten_nguoi_nhan: 'Người Nhận',
      sdt_nguoi_nhan: '0987654321',
      shipping_method_id: 'GH_NHANH',
      phuong_thuc_thanh_toan: 'COD',
    };

    it('creates a COD order successfully', async () => {
      orderRepository.createOrder.mockResolvedValue({
        order_id: 'DH-20260709-0001',
        total_amount: 150000,
        payment_method: 'COD',
      });

      const req = { user: { user_id: USER_ID }, body: validBody };
      const res = mockRes();

      await orderController.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Đặt hàng thành công',
          data: expect.objectContaining({ order_id: 'DH-20260709-0001', payUrl: null }),
        })
      );
    });

    it('creates a MoMo order and returns payUrl', async () => {
      orderRepository.createOrder.mockResolvedValue({
        order_id: 'DH-20260709-0002',
        total_amount: 200000,
        payment_method: 'MOMO',
      });
      momoService.createPaymentUrl.mockResolvedValue({ payUrl: 'https://momo.pay/abc' });

      const req = { user: { user_id: USER_ID }, body: { ...validBody, phuong_thuc_thanh_toan: 'MOMO' } };
      const res = mockRes();

      await orderController.createOrder(req, res);

      expect(momoService.createPaymentUrl).toHaveBeenCalledWith(
        'DH-20260709-0002',
        200000,
        expect.stringContaining('Thanh toan don hang')
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Vui lòng thanh toán để hoàn tất đơn hàng',
          data: expect.objectContaining({ payUrl: 'https://momo.pay/abc' }),
        })
      );
    });

    it('returns 400 when required fields are missing', async () => {
      const req = { user: { user_id: USER_ID }, body: { phuong_xa_id: 1 } };
      const res = mockRes();

      await orderController.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Vui lòng cung cấp đầy đủ thông tin giao hàng và phương thức vận chuyển' })
      );
    });

    it('returns statusCode from repository error when present', async () => {
      const err = new Error('Hết hàng');
      err.statusCode = 400;
      orderRepository.createOrder.mockRejectedValue(err);

      const req = { user: { user_id: USER_ID }, body: validBody };
      const res = mockRes();

      await orderController.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Hết hàng' })
      );
    });
  });

  describe('createBuyNowOrder', () => {
    it('creates a buy-now order with MoMo', async () => {
      orderRepository.createBuyNowOrder.mockResolvedValue({
        order_id: 'DH-20260709-0003',
        total_amount: 500000,
        payment_method: 'MOMO',
      });
      momoService.createPaymentUrl.mockResolvedValue({ payUrl: 'https://momo.pay/xyz' });

      const req = {
        user: { user_id: USER_ID },
        body: {
          buy_now_item: { variant_id: 16, quantity: 1 },
          ten_nguoi_nhan: 'Test',
          sdt_nguoi_nhan: '0987654321',
          dia_chi_giao_hang: 'Email',
          phuong_thuc_thanh_toan: 'MOMO',
        },
      };
      const res = mockRes();

      await orderController.createBuyNowOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ payUrl: 'https://momo.pay/xyz' }) })
      );
    });

    it('returns 400 when buy_now_item is missing', async () => {
      const req = {
        user: { user_id: USER_ID },
        body: { ten_nguoi_nhan: 'Test', sdt_nguoi_nhan: '0987654321', dia_chi_giao_hang: 'Email' },
      };
      const res = mockRes();

      await orderController.createBuyNowOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getShippingFees', () => {
    it('returns the shipping fee list', async () => {
      const req = {};
      const res = mockRes();

      await orderController.getShippingFees(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({ method_id: 'GH_NHANH', fee: 32000 }),
            expect.objectContaining({ method_id: 'GH_TIETKIEM', fee: 18000 }),
          ]),
        })
      );
    });
  });

  describe('cancelMyOrder', () => {
    it('cancels a pending COD order without refund', async () => {
      orderRepository.getOrderDetail.mockResolvedValue({
        order_id: 'DH-20260709-0001',
        status: 'pending',
        total_amount: 150000,
        payment: { payment_method: 'COD', payment_status: 'unpaid' },
      });
      orderRepository.cancelUserOrder.mockResolvedValue();

      const req = { user: { user_id: USER_ID }, params: { id: 'DH-20260709-0001' } };
      const res = mockRes();

      await orderController.cancelMyOrder(req, res);

      expect(momoService.refundPayment).not.toHaveBeenCalled();
      expect(orderRepository.cancelUserOrder).toHaveBeenCalledWith('DH-20260709-0001', false, USER_ID);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Hủy đơn hàng thành công.' })
      );
    });

    it('cancels a paid MoMo order and triggers refund', async () => {
      orderRepository.getOrderDetail.mockResolvedValue({
        order_id: 'DH-20260709-0002',
        status: 'pending',
        total_amount: 200000,
        payment: { payment_method: 'MOMO', payment_status: 'paid', reference_code: '1234567890' },
      });
      momoService.refundPayment.mockResolvedValue({ resultCode: 0 });
      orderRepository.cancelUserOrder.mockResolvedValue();

      const req = { user: { user_id: USER_ID }, params: { id: 'DH-20260709-0002' } };
      const res = mockRes();

      await orderController.cancelMyOrder(req, res);

      expect(momoService.refundPayment).toHaveBeenCalledWith('DH-20260709-0002', 200000, '1234567890');
      expect(orderRepository.cancelUserOrder).toHaveBeenCalledWith('DH-20260709-0002', true, USER_ID);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Tiền sẽ được hoàn') })
      );
    });

    it('returns 404 when order does not exist', async () => {
      orderRepository.getOrderDetail.mockResolvedValue(null);

      const req = { user: { user_id: USER_ID }, params: { id: 'DH-INVALID' } };
      const res = mockRes();

      await orderController.cancelMyOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 when order is not pending', async () => {
      orderRepository.getOrderDetail.mockResolvedValue({
        order_id: 'DH-20260709-0003',
        status: 'processing',
        payment: null,
      });

      const req = { user: { user_id: USER_ID }, params: { id: 'DH-20260709-0003' } };
      const res = mockRes();

      await orderController.cancelMyOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Bạn chỉ có thể hủy những đơn hàng đang chờ duyệt (pending).' })
      );
    });

    it('returns 400 when MoMo refund is rejected', async () => {
      orderRepository.getOrderDetail.mockResolvedValue({
        order_id: 'DH-20260709-0004',
        status: 'pending',
        total_amount: 200000,
        payment: { payment_method: 'MOMO', payment_status: 'paid', reference_code: '1234567890' },
      });
      momoService.refundPayment.mockResolvedValue({ resultCode: 1, message: 'Refund rejected' });

      const req = { user: { user_id: USER_ID }, params: { id: 'DH-20260709-0004' } };
      const res = mockRes();

      await orderController.cancelMyOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('MoMo từ chối hoàn tiền') })
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('updates order status to processing', async () => {
      orderRepository.updateOrderStatus.mockResolvedValue();
      const req = { params: { id: 'DH-001' }, body: { status: 'processing' } };
      const res = mockRes();

      await orderController.updateOrderStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: expect.stringContaining('Đã duyệt') })
      );
    });

    it('returns 400 when status is missing', async () => {
      const req = { params: { id: 'DH-001' }, body: {} };
      const res = mockRes();

      await orderController.updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('repurchaseOrder', () => {
    it('adds items to cart from a previous order', async () => {
      orderRepository.getOrderDetail.mockResolvedValue({
        order_id: 'DH-001',
        items: [{ variant_id: 1, quantity: 2 }],
      });
      cartRepository.getVariantStock.mockResolvedValue({ rows: [{ stock_quantity: 10 }] });
      cartRepository.getCartItem.mockResolvedValue({ rows: [] });
      cartRepository.addItemToCart.mockResolvedValue();

      const req = { user: { user_id: USER_ID }, params: { id: 'DH-001' } };
      const res = mockRes();

      await orderController.repurchaseOrder(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: expect.stringContaining('Đã thêm 1 sản phẩm') })
      );
    });

    it('returns 404 when order does not exist', async () => {
      orderRepository.getOrderDetail.mockResolvedValue(null);

      const req = { user: { user_id: USER_ID }, params: { id: 'DH-INVALID' } };
      const res = mockRes();

      await orderController.repurchaseOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 when order has no items', async () => {
      orderRepository.getOrderDetail.mockResolvedValue({ order_id: 'DH-002', items: [] });

      const req = { user: { user_id: USER_ID }, params: { id: 'DH-002' } };
      const res = mockRes();

      await orderController.repurchaseOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('skips items that are out of stock', async () => {
      orderRepository.getOrderDetail.mockResolvedValue({
        order_id: 'DH-003',
        items: [{ variant_id: 1, quantity: 2 }],
      });
      cartRepository.getVariantStock.mockResolvedValue({ rows: [] });

      const req = { user: { user_id: USER_ID }, params: { id: 'DH-003' } };
      const res = mockRes();

      await orderController.repurchaseOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Tất cả sản phẩm') })
      );
    });
  });
});
