// Unit tests for cartController — mocks the repository layer to test controller logic only.

jest.mock('../../src/repositories/cartRepository', () => ({
  getCartByUserId: jest.fn(),
  getVariantStock: jest.fn(),
  getCartItem: jest.fn(),
  addItemToCart: jest.fn(),
  updateItemQuantity: jest.fn(),
  removeItemFromCart: jest.fn(),
  syncLocalCart: jest.fn(),
}));

const cartRepository = require('../../src/repositories/cartRepository');
const cartController = require('../../src/controllers/cartController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const USER_ID = 1;

describe('controllers/cartController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('returns cart items for the authenticated user', async () => {
      cartRepository.getCartByUserId.mockResolvedValue({ rows: [{ variant_id: 1, so_luong: 2 }] });
      const req = { user: { user_id: USER_ID } };
      const res = mockRes();

      await cartController.getCart(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Lấy danh sách giỏ hàng thành công',
        data: { cart: [{ variant_id: 1, so_luong: 2 }] },
      });
    });

    it('returns 500 on repository error', async () => {
      cartRepository.getCartByUserId.mockRejectedValue(new Error('DB down'));
      const req = { user: { user_id: USER_ID } };
      const res = mockRes();

      await cartController.getCart(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('addToCart', () => {
    it('adds an item when stock is sufficient', async () => {
      cartRepository.getVariantStock.mockResolvedValue({ rows: [{ stock_quantity: 10 }] });
      cartRepository.getCartItem.mockResolvedValue({ rows: [] });
      cartRepository.addItemToCart.mockResolvedValue({ rows: [{ variant_id: 1, so_luong: 2 }] });

      const req = { user: { user_id: USER_ID }, body: { variant_id: 1, quantity: 2 } };
      const res = mockRes();

      await cartController.addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Thêm sản phẩm vào giỏ hàng thành công' })
      );
    });

    it('rejects an invalid variant_id', async () => {
      const req = { user: { user_id: USER_ID }, body: { variant_id: -1, quantity: 1 } };
      const res = mockRes();

      await cartController.addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'variant_id không hợp lệ' })
      );
    });

    it('rejects a non-positive quantity', async () => {
      const req = { user: { user_id: USER_ID }, body: { variant_id: 1, quantity: 0 } };
      const res = mockRes();

      await cartController.addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Số lượng thêm phải là số nguyên dương' })
      );
    });

    it('rejects when variant does not exist', async () => {
      cartRepository.getVariantStock.mockResolvedValue({ rows: [] });
      const req = { user: { user_id: USER_ID }, body: { variant_id: 999, quantity: 1 } };
      const res = mockRes();

      await cartController.addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('rejects when existing cart quantity + new quantity exceeds stock', async () => {
      cartRepository.getVariantStock.mockResolvedValue({ rows: [{ stock_quantity: 5 }] });
      cartRepository.getCartItem.mockResolvedValue({ rows: [{ so_luong: 4 }] });

      const req = { user: { user_id: USER_ID }, body: { variant_id: 1, quantity: 3 } };
      const res = mockRes();

      await cartController.addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });

  describe('updateCartItem', () => {
    it('updates quantity when within stock and item exists', async () => {
      cartRepository.getVariantStock.mockResolvedValue({ rows: [{ stock_quantity: 10 }] });
      cartRepository.getCartItem.mockResolvedValue({ rows: [{ so_luong: 2 }] });
      cartRepository.updateItemQuantity.mockResolvedValue({ rows: [{ variant_id: 1, so_luong: 5 }] });

      const req = { user: { user_id: USER_ID }, params: { variant_id: '1' }, body: { quantity: 5 } };
      const res = mockRes();

      await cartController.updateCartItem(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Cập nhật số lượng thành công' })
      );
    });

    it('returns 404 when item is not in cart', async () => {
      cartRepository.getVariantStock.mockResolvedValue({ rows: [{ stock_quantity: 10 }] });
      cartRepository.getCartItem.mockResolvedValue({ rows: [] });

      const req = { user: { user_id: USER_ID }, params: { variant_id: '1' }, body: { quantity: 5 } };
      const res = mockRes();

      await cartController.updateCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Sản phẩm không tồn tại trong giỏ hàng' })
      );
    });

    it('rejects quantity exceeding stock', async () => {
      cartRepository.getVariantStock.mockResolvedValue({ rows: [{ stock_quantity: 3 }] });
      cartRepository.getCartItem.mockResolvedValue({ rows: [{ so_luong: 1 }] });

      const req = { user: { user_id: USER_ID }, params: { variant_id: '1' }, body: { quantity: 5 } };
      const res = mockRes();

      await cartController.updateCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteCartItem', () => {
    it('deletes an item that exists in the cart', async () => {
      cartRepository.getCartItem.mockResolvedValue({ rows: [{ so_luong: 1 }] });
      cartRepository.removeItemFromCart.mockResolvedValue();

      const req = { user: { user_id: USER_ID }, params: { variant_id: '1' } };
      const res = mockRes();

      await cartController.deleteCartItem(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Xóa sản phẩm khỏi giỏ hàng thành công' })
      );
    });

    it('returns 404 when item is not in cart', async () => {
      cartRepository.getCartItem.mockResolvedValue({ rows: [] });

      const req = { user: { user_id: USER_ID }, params: { variant_id: '999' } };
      const res = mockRes();

      await cartController.deleteCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('rejects an invalid variant_id', async () => {
      const req = { user: { user_id: USER_ID }, params: { variant_id: '0' } };
      const res = mockRes();

      await cartController.deleteCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('syncCart', () => {
    it('syncs valid local cart items', async () => {
      cartRepository.syncLocalCart.mockResolvedValue();
      cartRepository.getCartByUserId.mockResolvedValue({ rows: [{ variant_id: 1, so_luong: 2 }] });

      const req = {
        user: { user_id: USER_ID },
        body: { local_cart: [{ variant_id: 1, quantity: 2 }, { variant_id: 2, quantity: 1 }] },
      };
      const res = mockRes();

      await cartController.syncCart(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Đồng bộ giỏ hàng thành công' })
      );
    });

    it('rejects empty local_cart', async () => {
      const req = { user: { user_id: USER_ID }, body: { local_cart: [] } };
      const res = mockRes();

      await cartController.syncCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects when local_cart is not an array', async () => {
      const req = { user: { user_id: USER_ID }, body: { local_cart: 'invalid' } };
      const res = mockRes();

      await cartController.syncCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('filters out invalid items from local_cart', async () => {
      cartRepository.syncLocalCart.mockResolvedValue();
      cartRepository.getCartByUserId.mockResolvedValue({ rows: [] });

      const req = {
        user: { user_id: USER_ID },
        body: { local_cart: [{ variant_id: 'abc', quantity: 1 }, { variant_id: 1, quantity: 0 }] },
      };
      const res = mockRes();

      await cartController.syncCart(req, res);

      // syncLocalCart should not be called because all items are invalid
      expect(cartRepository.syncLocalCart).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
