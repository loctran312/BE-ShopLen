# Test Suite — BE-ShopLen

## Cấu trúc

```
tests/
├── setup.js                  # Biến môi trường test + cấu hình Jest
├── helpers/
│   └── mockPool.js           # Mock pg.Pool cho unit tests (không cần DB thật)
├── unit/                     # Unit tests — test từng module độc lập
│   ├── pagination.test.js        # utils/pagination
│   ├── imgbb.test.js             # utils/imgbb
│   ├── authMiddleware.test.js    # middlewares/authMiddleware
│   ├── errorMiddleware.test.js   # middlewares/errorMiddleware
│   ├── momoService.test.js       # services/momoService (signature verification)
│   ├── otpService.test.js        # services/otpService (dev mode, validation)
│   ├── authController.test.js    # controllers/authController
│   ├── cartController.test.js    # controllers/cartController
│   ├── orderController.test.js   # controllers/orderController
│   ├── voucherController.test.js # controllers/voucherController
│   └── spinController.test.js    # controllers/spinController
└── integration/              # Integration tests — test qua HTTP đầy đủ
    └── app.test.js               # Test endpoint-to-endpoint qua supertest
```

## Chạy test

```bash
# Chạy toàn bộ test suite
npm test

# Chỉ chạy unit tests
npm run test:unit

# Chỉ chạy integration tests
npm run test:integration

# Chạy ở chế độ watch (tự chạy lại khi code thay đổi)
npm run test:watch

# Chạy với coverage report
npx jest --coverage
```

## Chiến lược test

### Unit Tests (`tests/unit/`)

- **Không cần database thật** — `pg.Pool` được mock hoàn toàn qua `helpers/mockPool.js`.
- Mỗi controller test mock repository layer tương ứng, chỉ test logic validation, response formatting, và error handling.
- Service tests (`momoService`, `otpService`) test signature verification, dev-mode logging, và channel validation.
- Middleware tests test JWT verification, RBAC (requireAuth/requireAdmin/requireShipper), và error response format.
- Utility tests test input parsing, URL detection, và text normalization.

### Integration Tests (`tests/integration/`)

- Load toàn bộ Express app qua `require('../../src/app')`.
- `pg.Pool` vẫn được mock — test tập trung vào HTTP layer: route matching, middleware chain, status codes, response shape.
- Dùng `supertest` để gửi HTTP request thật tới app.
- Test các flow: public endpoints, auth enforcement, admin RBAC, pagination params, error responses.

### Mock Strategy

```
tests/setup.js          → nạp biến môi trường test trước khi load module
tests/helpers/mockPool  → jest.doMock('pg') thay Pool thật bằng mock
                            mockPool.mockQuery   → mock cho pool.query()
                            mockPool.mockClient  → mock cho client.query() (transaction)
                            mockPool.mockConnect → mock cho pool.connect()
```

Mỗi test file gọi `mockPool.setup()` trong `beforeEach` và `mockPool.teardown()` trong `afterEach`.

## Đang có gì được test

| Module | Loại | Số test cases |
|---|---|---|
| utils/pagination | Unit | 11 |
| utils/imgbb | Unit | 8 |
| middlewares/authMiddleware | Unit | 12 |
| middlewares/errorMiddleware | Unit | 3 |
| services/momoService | Unit | 3 |
| services/otpService | Unit | 3 |
| controllers/authController | Unit | 17 |
| controllers/cartController | Unit | 16 |
| controllers/orderController | Unit | 15 |
| controllers/voucherController | Unit | 15 |
| controllers/spinController | Unit | 8 |
| Express app (routes + middleware chain) | Integration | 16 |
| **Tổng** | | **~127** |

## Giữ test cập nhật

Khi thêm endpoint hoặc logic mới:
1. Thêm unit test cho controller/service mới.
2. Thêm integration test cho route mới (auth enforcement, happy path, error case).
3. Chạy `npm test` để đảm bảo không có regression.
