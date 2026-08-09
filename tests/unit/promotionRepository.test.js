const mockPool = require('../helpers/mockPool');

describe('promotionRepository - getPromotionVariantProfitPreview', () => {
    afterEach(() => {
        mockPool.teardown();
    });

    // Case 3: finalPrice = 200.000, averageCost = 150.000 -> expectedProfit = 50.000, expectedMargin = 25%
    test('Case 3: lợi nhuận dương', async () => {
        const { mockQuery } = mockPool.setup({
            query: jest
                .fn()
                .mockResolvedValueOnce({ rows: [{ discount_type: 'fixed', value: 0 }] }) // khuyến mãi không giảm gì (finalPrice = giá gốc)
                .mockResolvedValueOnce({
                    rows: [
                        { variant_id: 1, product_id: 10, sku: 'SKU1', price: 200000, average_cost: 150000, loai_san_pham_id: 1 },
                    ],
                }),
        });
        const promotionRepository = require('../../src/repositories/promotionRepository');

        const preview = await promotionRepository.getPromotionVariantProfitPreview(99);

        expect(preview[0].final_price).toBe(200000);
        expect(preview[0].average_cost).toBe(150000);
        expect(preview[0].expected_profit).toBe(50000);
        expect(preview[0].expected_margin).toBe(25);
        expect(preview[0].is_loss).toBe(false);
    });

    // Case 4: finalPrice = 140.000, averageCost = 150.000 -> expectedProfit = -10.000, expectedMargin ≈ -7.14%
    test('Case 4: lợi nhuận âm (bán lỗ dự kiến)', async () => {
        mockPool.setup({
            query: jest
                .fn()
                .mockResolvedValueOnce({ rows: [{ discount_type: 'fixed', value: 0 }] })
                .mockResolvedValueOnce({
                    rows: [
                        { variant_id: 2, product_id: 10, sku: 'SKU2', price: 140000, average_cost: 150000, loai_san_pham_id: 1 },
                    ],
                }),
        });
        const promotionRepository = require('../../src/repositories/promotionRepository');

        const preview = await promotionRepository.getPromotionVariantProfitPreview(99);

        expect(preview[0].expected_profit).toBe(-10000);
        expect(preview[0].expected_margin).toBeCloseTo(-7.14, 2);
        expect(preview[0].is_loss).toBe(true);
    });

    test('finalPrice = 0 -> expectedMargin = null (tránh chia cho 0)', async () => {
        mockPool.setup({
            query: jest
                .fn()
                .mockResolvedValueOnce({ rows: [{ discount_type: 'fixed', value: 200000 }] })
                .mockResolvedValueOnce({
                    rows: [
                        { variant_id: 3, product_id: 10, sku: 'SKU3', price: 200000, average_cost: 150000, loai_san_pham_id: 1 },
                    ],
                }),
        });
        const promotionRepository = require('../../src/repositories/promotionRepository');

        const preview = await promotionRepository.getPromotionVariantProfitPreview(99);

        expect(preview[0].final_price).toBe(0);
        expect(preview[0].expected_margin).toBeNull();
    });

    test('Workshop: cost = basePrice (variant.gia), không dùng averageCost', async () => {
        mockPool.setup({
            query: jest
                .fn()
                .mockResolvedValueOnce({ rows: [{ discount_type: 'fixed', value: 0 }] })
                .mockResolvedValueOnce({
                    rows: [
                        { variant_id: 4, product_id: 11, sku: 'WS1', price: 500000, average_cost: null, loai_san_pham_id: 3 },
                    ],
                }),
        });
        const promotionRepository = require('../../src/repositories/promotionRepository');

        const preview = await promotionRepository.getPromotionVariantProfitPreview(99);

        expect(preview[0].average_cost).toBe(500000); // = basePrice, không phải averageCost (null)
        expect(preview[0].expected_profit).toBe(0);
    });
});
