const mockPool = require('../helpers/mockPool');

describe('inventoryRepository - adjustInventory (giá vốn bình quân)', () => {
    afterEach(() => {
        mockPool.teardown();
    });

    const routeQuery = (overrides = {}) => (sql, params) => {
        if (sql.includes('FOR UPDATE') && sql.includes('bien_the_san_pham b')) {
            return Promise.resolve({ rows: overrides.variantRow !== undefined ? overrides.variantRow : [] });
        }
        if (sql.includes('SELECT so_luong_ton FROM ton_kho')) {
            return Promise.resolve({ rows: overrides.stockRow !== undefined ? overrides.stockRow : [] });
        }
        if (sql.includes('UPDATE bien_the_san_pham SET gia_von_binh_quan')) {
            overrides.onUpdateVariant && overrides.onUpdateVariant(params);
            return Promise.resolve({ rows: [] });
        }
        if (sql.includes('INSERT INTO ton_kho')) {
            return Promise.resolve({ rows: [] });
        }
        if (sql.includes('UPDATE ton_kho SET so_luong_ton')) {
            return Promise.resolve({ rows: [] });
        }
        if (sql.includes('INSERT INTO lich_su_ton_kho')) {
            overrides.onInsertHistory && overrides.onInsertHistory(params);
            return Promise.resolve({ rows: [] });
        }
        if (sql.includes('SELECT b.gia AS price, sp.san_pham_id')) {
            return Promise.resolve({ rows: overrides.lossLookupRow !== undefined ? overrides.lossLookupRow : [] });
        }
        if (sql.includes('FROM khuyen_mai_san_pham kmsp')) {
            return Promise.resolve({ rows: overrides.discountRow !== undefined ? overrides.discountRow : [] });
        }
        return Promise.resolve({ rows: [] });
    };

    // Case 1: Nhập lần đầu 100 x 100.000
    test('Case 1: nhập lần đầu -> averageCost = latestUnitCost = unitCost, stock = quantity', async () => {
        mockPool.setup({
            clientQuery: routeQuery({
                variantRow: [{ gia: 250000, gia_von_binh_quan: null, loai_san_pham_id: 1 }],
                stockRow: [], // chưa có tồn kho -> isInsert
                lossLookupRow: [{ price: 250000, san_pham_id: 10 }],
                discountRow: [],
            }),
        });
        const inventoryRepository = require('../../src/repositories/inventoryRepository');

        const results = await inventoryRepository.adjustInventory(1, [
            { variant_id: 1, quantity_change: 100, transaction_type: 'nhap_kho', unit_cost: 100000 },
        ]);

        expect(results[0].new_stock).toBe(100);
        expect(results[0].average_cost).toBe(100000);
        expect(results[0].latest_unit_cost).toBe(100000);
        expect(results[0].unit_cost).toBe(100000);
        expect(results[0].total_cost).toBe(10000000);
        expect(results[0].loss_warning).toBeUndefined(); // 250.000 - 100.000 > 0 -> không lỗ
    });

    // Case 2: Nhập tiếp 100 x 120.000 trên nền tồn kho 100 @ 100.000
    test('Case 2: nhập tiếp -> averageCost tính bình quân gia quyền, latestUnitCost = lần nhập mới nhất', async () => {
        mockPool.setup({
            clientQuery: routeQuery({
                variantRow: [{ gia: 250000, gia_von_binh_quan: 100000, loai_san_pham_id: 1 }],
                stockRow: [{ so_luong_ton: 100 }],
                lossLookupRow: [{ price: 250000, san_pham_id: 10 }],
                discountRow: [],
            }),
        });
        const inventoryRepository = require('../../src/repositories/inventoryRepository');

        const results = await inventoryRepository.adjustInventory(1, [
            { variant_id: 1, quantity_change: 100, transaction_type: 'nhap_kho', unit_cost: 120000 },
        ]);

        expect(results[0].new_stock).toBe(200);
        expect(results[0].average_cost).toBe(110000); // (100*100000 + 100*120000) / 200
        expect(results[0].latest_unit_cost).toBe(120000);
    });

    test('Cảnh báo lỗ: giá bán hiệu lực (sau khuyến mãi) thấp hơn averageCost mới', async () => {
        mockPool.setup({
            clientQuery: routeQuery({
                variantRow: [{ gia: 150000, gia_von_binh_quan: null, loai_san_pham_id: 1 }],
                stockRow: [],
                lossLookupRow: [{ price: 150000, san_pham_id: 10 }],
                discountRow: [{ type: 'percent', value: 50 }], // giá hiệu lực = 75.000
            }),
        });
        const inventoryRepository = require('../../src/repositories/inventoryRepository');

        const results = await inventoryRepository.adjustInventory(1, [
            { variant_id: 1, quantity_change: 10, transaction_type: 'nhap_kho', unit_cost: 100000 },
        ]);

        expect(results[0].loss_warning).toBeDefined();
        expect(results[0].loss_warning.profit).toBe(-25000); // 75.000 - 100.000
    });

    test('Từ chối nhập kho quantity_change <= 0', async () => {
        mockPool.setup({
            clientQuery: routeQuery({
                variantRow: [{ gia: 150000, gia_von_binh_quan: null, loai_san_pham_id: 1 }],
                stockRow: [],
            }),
        });
        const inventoryRepository = require('../../src/repositories/inventoryRepository');

        await expect(
            inventoryRepository.adjustInventory(1, [
                { variant_id: 1, quantity_change: 0, transaction_type: 'nhap_kho', unit_cost: 100000 },
            ])
        ).rejects.toMatchObject({ statusCode: 400 });
    });

    test('Từ chối nhập kho khi thiếu hoặc unit_cost <= 0', async () => {
        mockPool.setup({
            clientQuery: routeQuery({
                variantRow: [{ gia: 150000, gia_von_binh_quan: null, loai_san_pham_id: 1 }],
                stockRow: [],
            }),
        });
        const inventoryRepository = require('../../src/repositories/inventoryRepository');

        await expect(
            inventoryRepository.adjustInventory(1, [
                { variant_id: 1, quantity_change: 10, transaction_type: 'nhap_kho', unit_cost: 0 },
            ])
        ).rejects.toMatchObject({ statusCode: 400 });
    });

    test('Từ chối nhập kho cho biến thể Workshop (Workshop không nhập kho)', async () => {
        mockPool.setup({
            clientQuery: routeQuery({
                variantRow: [{ gia: 150000, gia_von_binh_quan: null, loai_san_pham_id: 3 }],
            }),
        });
        const inventoryRepository = require('../../src/repositories/inventoryRepository');

        await expect(
            inventoryRepository.adjustInventory(1, [
                { variant_id: 5, quantity_change: 10, transaction_type: 'nhap_kho', unit_cost: 100000 },
            ])
        ).rejects.toMatchObject({ statusCode: 400 });
    });
});
