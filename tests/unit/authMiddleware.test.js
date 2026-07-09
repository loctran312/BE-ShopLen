const jwt = require('jsonwebtoken');
const { requireAuth, requireAdmin, requireShipper, extractAndVerifyToken } = require('../../src/middlewares/authMiddleware');

const SECRET = process.env.JWT_SECRET;

const signToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: '1h' });

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('middlewares/authMiddleware', () => {
  beforeEach(() => mockNext.mockReset());

  describe('extractAndVerifyToken', () => {
    it('extracts and verifies a valid Bearer token', () => {
      const token = signToken({ user_id: 1, role: 'customer' });
      const decoded = extractAndVerifyToken(`Bearer ${token}`);
      expect(decoded.user_id).toBe(1);
      expect(decoded.role).toBe('customer');
    });

    it('throws when header is missing', () => {
      expect(() => extractAndVerifyToken(undefined)).toThrow('Invalid token format');
    });

    it('throws when header has no Bearer prefix', () => {
      expect(() => extractAndVerifyToken('Token abc')).toThrow('Invalid token format');
    });

    it('throws for a tampered token', () => {
      expect(() => extractAndVerifyToken('Bearer invalid.token.here')).toThrow('Token không hợp lệ hoặc hết hạn');
    });
  });

  describe('requireAuth', () => {
    it('calls next() with a valid token and sets req.user', () => {
      const token = signToken({ user_id: 5, role: 'customer' });
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();

      requireAuth(req, res, mockNext);

      expect(req.user.user_id).toBe(5);
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 401 when no token is provided', () => {
      const req = { headers: {} };
      const res = mockRes();

      requireAuth(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token không hợp lệ hoặc hết hạn' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 401 for an invalid token', () => {
      const req = { headers: { authorization: 'Bearer garbage' } };
      const res = mockRes();

      requireAuth(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('calls next() for admin role', () => {
      const token = signToken({ user_id: 1, role: 'admin' });
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();

      requireAdmin(req, res, mockNext);

      expect(req.user.role).toBe('admin');
      expect(mockNext).toHaveBeenCalled();
    });

    it('returns 403 for non-admin role', () => {
      const token = signToken({ user_id: 2, role: 'customer' });
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();

      requireAdmin(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Bạn không có quyền thực hiện thao tác này' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 401 when no token is provided', () => {
      const req = { headers: {} };
      const res = mockRes();

      requireAdmin(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireShipper', () => {
    it('calls next() for shipper role', () => {
      const token = signToken({ user_id: 3, role: 'shipper' });
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();

      requireShipper(req, res, mockNext);

      expect(req.user.role).toBe('shipper');
      expect(mockNext).toHaveBeenCalled();
    });

    it('returns 403 for non-shipper role', () => {
      const token = signToken({ user_id: 4, role: 'admin' });
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();

      requireShipper(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Quyền truy cập bị từ chối. API này chỉ dành cho Shipper.' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
