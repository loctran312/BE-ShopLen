jest.mock('../../src/repositories/promotionRepository', () => ({
  getActivePromotions: jest.fn(),
  getAllPromotionsAdmin: jest.fn(),
  getPromotionById: jest.fn(),
  createPromotion: jest.fn(),
  updatePromotion: jest.fn(),
  deletePromotion: jest.fn(),
  filterPromotionsAdmin: jest.fn(),
}));

const promotionRepository = require('../../src/repositories/promotionRepository');
const promotionController = require('../../src/controllers/promotionController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('controllers/promotionController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-11T10:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('updatePromotion', () => {
    it('allows updating end_date, status, and products while the promotion is running', async () => {
      promotionRepository.getPromotionById.mockResolvedValue({
        promotion_id: 1,
        title: 'Flash Sale',
        discount_type: 'percent',
        value: 20,
        min_order_value: 0,
        start_date: '2026-07-01T00:00:00Z',
        end_date: '2026-07-20T23:59:59Z',
        status: 'active',
        applicable_products: [{ product_id: 1 }],
      });
      promotionRepository.updatePromotion.mockResolvedValue({ promotion_id: 1 });

      const req = {
        params: { id: '1' },
        body: {
          title: 'Should be ignored',
          discount_type: 'fixed',
          value: 999,
          min_order_value: 100000,
          start_date: '2026-08-01T00:00:00Z',
          end_date: '2026-07-25T23:59:59Z',
          status: 'inactive',
          applicable_products: [{ product_id: 2 }],
        },
      };
      const res = mockRes();

      await promotionController.updatePromotion(req, res);

      expect(promotionRepository.updatePromotion).toHaveBeenCalledWith(1, {
        title: 'Flash Sale',
        discount_type: 'percent',
        value: 20,
        min_order_value: 0,
        start_date: '2026-07-01T00:00:00Z',
        end_date: '2026-07-25T23:59:59Z',
        status: 'inactive',
        applicable_products: [{ product_id: 2 }],
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Chỉ cho phép đổi ngày kết thúc, trạng thái và danh sách sản phẩm'),
        })
      );
    });

    it('allows updating at the exact end_date boundary', async () => {
      promotionRepository.getPromotionById.mockResolvedValue({
        promotion_id: 2,
        title: 'Boundary Sale',
        discount_type: 'percent',
        value: 15,
        min_order_value: 0,
        start_date: '2026-07-01T00:00:00Z',
        end_date: '2026-07-11T10:00:00Z',
        status: 'active',
        applicable_products: [],
      });
      promotionRepository.updatePromotion.mockResolvedValue({ promotion_id: 2 });

      const req = {
        params: { id: '2' },
        body: {
          status: 'inactive',
        },
      };
      const res = mockRes();

      await promotionController.updatePromotion(req, res);

      expect(res.status).not.toHaveBeenCalledWith(400);
      expect(promotionRepository.updatePromotion).toHaveBeenCalledWith(2, {
        title: 'Boundary Sale',
        discount_type: 'percent',
        value: 15,
        min_order_value: 0,
        start_date: '2026-07-01T00:00:00Z',
        end_date: '2026-07-11T10:00:00Z',
        status: 'inactive',
        applicable_products: [],
      });
    });
  });
});
