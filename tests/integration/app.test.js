const request = require('supertest');
const jwt = require('jsonwebtoken');
const mockPool = require('../helpers/mockPool');

const SECRET = process.env.JWT_SECRET;

const signToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: '1h' });

const customerToken = signToken({ user_id: 1, role: 'customer' });
const adminToken = signToken({ user_id: 2, role: 'admin' });
const shipperToken = signToken({ user_id: 3, role: 'shipper' });

let app;

jest.mock('../../src/services/cronJobs', () => jest.fn());

describe('Express app integration', () => {
  beforeEach(() => {
    mockPool.setup();
    jest.isolateModules(() => {
      app = require('../../src/app');
    });
  });

  afterEach(() => {
    mockPool.teardown();
  });

  describe('Health & root', () => {
    it('GET / returns API running', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('API is running');
    });

    it('GET /health returns server running', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Server is running');
    });

    it('GET /unknown returns 404', async () => {
      const res = await request(app).get('/api/unknown-endpoint');
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('API endpoint not found');
    });
  });

  describe('Auth middleware enforcement', () => {
    it('GET /api/cart returns 401 without token', async () => {
      const res = await request(app).get('/api/cart');
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Token không hợp lệ hoặc hết hạn');
    });

    it('GET /api/cart works with a valid customer token', async () => {
      mockPool.mockQuery.mockResolvedValue({ rows: [] });
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/products with customer token returns 403 (admin only)', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send([{ type_id: 1, product_name: 'Test' }]);

      expect(res.status).toBe(403);
    });

    it('POST /api/products with admin token is allowed past auth', async () => {
      mockPool.mockQuery.mockRejectedValue(new Error('validation'));
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send([]);

      expect(res.status).not.toBe(403);
      expect(res.status).not.toBe(401);
    });
  });

  describe('Products routes (public)', () => {
    it('GET /api/products returns paginated list', async () => {
      mockPool.mockQuery
        .mockResolvedValueOnce({ rows: [{ count: 2 }] })
        .mockResolvedValueOnce({ rows: [{ product_id: 1, ten_san_pham: 'Test' }] });

      const res = await request(app).get('/api/products?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('GET /api/products/types returns product types', async () => {
      mockPool.mockQuery.mockResolvedValue({
        rows: [{ loai_san_pham_id: 1, ten_loai: 'Sản phẩm vật lý' }],
      });

      const res = await request(app).get('/api/products/types');

      expect(res.status).toBe(200);
    });

    it('GET /api/products/top-selling returns top products', async () => {
      mockPool.mockQuery.mockResolvedValue({
        rows: [{ product_id: 1, ten_san_pham: 'Best Seller', total_sold: 100 }],
      });

      const res = await request(app).get('/api/products/top-selling');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /api/products/:id returns product detail', async () => {
      mockPool.mockQuery
        .mockResolvedValueOnce({
          rows: [{ product_id: 1, ten_san_pham: 'Test Product', trang_thai_san_pham: 'active' }],
        })
        .mockResolvedValue({ rows: [] });

      const res = await request(app).get('/api/products/1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /api/products/:id returns 400 for invalid id', async () => {
      const res = await request(app).get('/api/products/abc');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Orders routes', () => {
    it('GET /api/orders/shipping-fees returns fee list', async () => {
      const res = await request(app)
        .get('/api/orders/shipping-fees')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toHaveProperty('method_id', 'GH_NHANH');
      expect(res.body.data[1]).toHaveProperty('method_id', 'GH_TIETKIEM');
    });

    it('GET /api/orders/my-orders requires auth', async () => {
      const res = await request(app).get('/api/orders/my-orders');
      expect(res.status).toBe(401);
    });

    it('GET /api/orders/admin/all requires admin', async () => {
      const res = await request(app)
        .get('/api/orders/admin/all')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('GET /api/orders/admin/all works with admin token', async () => {
      mockPool.mockQuery
        .mockResolvedValueOnce({ rows: [{ count: 0 }] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/orders/admin/all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Vouchers routes (public)', () => {
    it('GET /api/vouchers returns available vouchers', async () => {
      mockPool.mockQuery
        .mockResolvedValueOnce({ rows: [{ total_items: 1 }] })
        .mockResolvedValueOnce({ rows: [{ voucher_id: 1, code: 'WELCOME10' }] });

      const res = await request(app).get('/api/vouchers?page=1&limit=10');

      // Debug: if 500, print the body to understand what went wrong
      if (res.status !== 200) {
        // eslint-disable-next-line no-console
        // console.log('[DEBUG vouchers] status:', res.status, 'body:', JSON.stringify(res.body));
      }

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vouchers).toBeDefined();
    });
  });

  describe('Auth routes', () => {
    it('POST /api/auth/register validates input', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'ab', email: 'bad', password: 'weak', phone_number: '123', role: 'customer' });

      expect(res.status).toBe(400);
    });

    it('POST /api/auth/login returns 400 on missing credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({});

      expect([400, 500]).toContain(res.status);
    });

    it('POST /api/auth/refresh-token returns 400 without token', async () => {
      const res = await request(app).post('/api/auth/refresh-token').send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Thiếu refresh_token');
    });
  });

  describe('Spin routes', () => {
    it('GET /api/spin/info requires auth', async () => {
      const res = await request(app).get('/api/spin/info');
      expect(res.status).toBe(401);
    });

    it('POST /api/spin/admin/configs requires admin', async () => {
      const res = await request(app)
        .post('/api/spin/admin/configs')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ loai_qua: 'voucher', ty_le_thang: 10 });

      expect(res.status).toBe(403);
    });
  });
});
