const pool = require('../config/db');
const { applyDiscount, computeProfitAndMargin, getActiveDiscountForProduct } = require('../utils/costing');

const getInventoryOverview = async ({ page, limit, stock_status, keyword }) => {
    const offset = (page - 1) * limit;
    const params = [];
    let paramIndex = 1;
    let whereClauses = [];

    whereClauses.push(`sp.loai_san_pham_id <> 3`);

    if (keyword) {
        whereClauses.push(`(b.sku ILIKE $${paramIndex} OR sp.ten_san_pham ILIKE $${paramIndex})`);
        params.push(`%${keyword}%`);
        paramIndex++;
    }

    if (stock_status === 'out_of_stock') {
        whereClauses.push(`COALESCE(t.so_luong_ton, 0) = 0`);
    } else if (stock_status === 'low_stock') {
        whereClauses.push(`COALESCE(t.so_luong_ton, 0) > 0 AND COALESCE(t.so_luong_ton, 0) <= 10`);
    } else if (stock_status === 'in_stock') {
        whereClauses.push(`COALESCE(t.so_luong_ton, 0) > 10`);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `
        SELECT COUNT(*)::int AS total 
        FROM bien_the_san_pham b
        LEFT JOIN ton_kho t ON b.bien_the_id = t.bien_the_id
        JOIN san_pham sp ON b.san_pham_id = sp.san_pham_id
        ${whereString}
    `;
    const countRes = await pool.query(countQuery, params);
    const totalItems = countRes.rows[0].total;

    const fetchParams = [...params, limit, offset];
    const dataQuery = `
        SELECT 
            b.bien_the_id as variant_id, 
            sp.san_pham_id as product_id,
            sp.ten_san_pham as product_name,
            b.sku, 
            b.mau_sac as color, 
            b.kich_co as size, 
            b.gia AS selling_price,
            b.gia_von_binh_quan AS average_cost,
            b.gia_nhap_gan_nhat AS latest_unit_cost,
            COALESCE(t.so_luong_ton, 0) AS available_stock, 
            COALESCE(d.reserved_stock, 0)::int AS reserved_stock, 
            (COALESCE(t.so_luong_ton, 0) + COALESCE(d.reserved_stock, 0))::int AS physical_stock,
            promo.kieu_giam_gia AS promo_type,
            promo.gia_tri AS promo_value
        FROM bien_the_san_pham b
        LEFT JOIN ton_kho t ON b.bien_the_id = t.bien_the_id
        JOIN san_pham sp ON b.san_pham_id = sp.san_pham_id
        LEFT JOIN (
            SELECT ct.bien_the_id, SUM(ct.so_luong) AS reserved_stock
            FROM chi_tiet_don_hang ct
            JOIN don_hang dh ON ct.don_hang_id = dh.don_hang_id
            WHERE dh.trang_thai IN ('pending', 'processing') 
            GROUP BY ct.bien_the_id
        ) d ON b.bien_the_id = d.bien_the_id
        LEFT JOIN LATERAL (
            SELECT km.kieu_giam_gia, km.gia_tri
            FROM khuyen_mai_san_pham kmsp
            JOIN khuyen_mai km ON km.khuyen_mai_id = kmsp.khuyen_mai_id
            WHERE kmsp.san_pham_id = sp.san_pham_id
              AND km.trang_thai = 'active'
              AND (km.ngay_bat_dau IS NULL OR km.ngay_bat_dau <= CURRENT_TIMESTAMP)
              AND (km.ngay_ket_thuc IS NULL OR km.ngay_ket_thuc >= CURRENT_TIMESTAMP)
            ORDER BY km.khuyen_mai_id DESC
            LIMIT 1
        ) promo ON true
        ${whereString}
        ORDER BY b.bien_the_id DESC 
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const { rows } = await pool.query(dataQuery, fetchParams);

    const inventory = rows.map((row) => {
        const averageCost = row.average_cost !== null ? Number(row.average_cost) : null;
        const discount = row.promo_type ? { type: row.promo_type, value: row.promo_value } : null;
        const effectivePrice = applyDiscount(row.selling_price, discount);
        const { profit, margin } = computeProfitAndMargin(effectivePrice, averageCost);

        return {
            variant_id: row.variant_id,
            product_id: row.product_id,
            product_name: row.product_name,
            sku: row.sku,
            color: row.color,
            size: row.size,
            available_stock: row.available_stock,
            reserved_stock: row.reserved_stock,
            physical_stock: row.physical_stock,
            selling_price: Number(row.selling_price),
            effective_price: effectivePrice,
            average_cost: averageCost,
            latest_unit_cost: row.latest_unit_cost !== null ? Number(row.latest_unit_cost) : null,
            expected_profit: profit,
            expected_margin: margin,
            is_loss: profit !== null ? profit < 0 : false
        };
    });

    return {
        inventory,
        pagination: { total_items: totalItems, total_pages: Math.ceil(totalItems / limit), current_page: page, limit }
    };
};

const getInventoryHistory = async (variantId, { page, limit }) => {
    const offset = (page - 1) * limit;
    
    const countRes = await pool.query(
        "SELECT COUNT(*)::int AS total FROM lich_su_ton_kho WHERE bien_the_id = $1", 
        [variantId]
    );
    const totalItems = countRes.rows[0].total;
    
    const { rows } = await pool.query(
        `SELECT 
            lich_su_id AS history_id,
            so_luong_thay_doi AS quantity_change,
            so_luong_sau_khi_doi AS new_stock,
            loai_giao_dich AS transaction_type,
            tham_chieu_id AS reference_code,
            ghi_chu AS note,
            nguoi_thuc_hien AS performed_by,
            gia_nhap AS unit_cost,
            thanh_tien AS total_cost,
            ngay_tao AS created_at
         FROM lich_su_ton_kho 
         WHERE bien_the_id = $1 
         ORDER BY ngay_tao DESC 
         LIMIT $2 OFFSET $3`,
        [variantId, limit, offset]
    );
    
    return {
        history: rows,
        pagination: { total_items: totalItems, total_pages: Math.ceil(totalItems / limit), current_page: page, limit }
    };
};

const adjustInventory = async (adminId, payloads) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const results = [];

        const now = new Date();
        const fallbackRefCode = `ADJ-${now.toISOString().replace(/[-:T.]/g, '').slice(0, 14)}`; 

        for (const item of payloads) {
            const { variant_id, quantity_change, physical_quantity, transaction_type, reference_code, note, unit_cost } = item;

            const variantRes = await client.query(
                `SELECT b.gia, b.gia_von_binh_quan, sp.loai_san_pham_id
                 FROM bien_the_san_pham b
                 JOIN san_pham sp ON b.san_pham_id = sp.san_pham_id
                 WHERE b.bien_the_id = $1
                 FOR UPDATE`,
                [variant_id]
            );

            if (variantRes.rows.length === 0) {
                const error = new Error(`Biến thể ID ${variant_id} không tồn tại.`);
                error.statusCode = 404;
                throw error;
            }

            if (transaction_type === 'nhap_kho' && Number(variantRes.rows[0].loai_san_pham_id) === 3) {
                const error = new Error(`Biến thể ID ${variant_id} thuộc loại Workshop, không thực hiện nhập kho cho Workshop.`);
                error.statusCode = 400;
                throw error;
            }

            const stockRes = await client.query("SELECT so_luong_ton FROM ton_kho WHERE bien_the_id = $1 FOR UPDATE", [variant_id]);
            let currentStock = 0;
            let isInsert = false;

            if (stockRes.rows.length === 0) {
                isInsert = true;
            } else {
                currentStock = Number(stockRes.rows[0].so_luong_ton);
            }

            let actualChange = 0;
            const increaseTypes = ['nhap_kho', 'hoan_tra'];
            const decreaseTypes = ['xuat_ban']; 
            const bypassTypes = ['khac'];

            if (transaction_type === 'kiem_kho') {
                actualChange = Number(physical_quantity) - currentStock; 
            } else if (increaseTypes.includes(transaction_type)) {
                actualChange = Math.abs(quantity_change); 
            } else if (decreaseTypes.includes(transaction_type)) {
                actualChange = -Math.abs(quantity_change); 
            } else if (bypassTypes.includes(transaction_type)) {
                actualChange = quantity_change; 
            } else {
                const error = new Error(`Loại giao dịch '${transaction_type}' không hợp lệ. Chỉ chấp nhận: nhap_kho, xuat_ban, hoan_tra, kiem_kho, khac.`); 
                error.statusCode = 400; 
                throw error;
            }

            let unitCostUsed = null;
            let totalCostUsed = null;
            let newAverageCost = variantRes.rows[0].gia_von_binh_quan !== null
                ? Number(variantRes.rows[0].gia_von_binh_quan)
                : null;
            let newLatestUnitCost = null;

            if (transaction_type === 'nhap_kho') {
                const importQuantity = Math.abs(Number(quantity_change));
                const importUnitCost = Number(unit_cost);

                if (!Number.isFinite(importQuantity) || importQuantity <= 0) {
                    const error = new Error(`Số lượng nhập kho của biến thể ID ${variant_id} phải lớn hơn 0.`);
                    error.statusCode = 400;
                    throw error;
                }
                if (unit_cost === undefined || unit_cost === null || !Number.isFinite(importUnitCost) || importUnitCost <= 0) {
                    const error = new Error(`Giá nhập (unit_cost) của biến thể ID ${variant_id} là bắt buộc và phải lớn hơn 0 khi nhập kho.`);
                    error.statusCode = 400;
                    throw error;
                }

                const oldStock = currentStock;
                const oldAverageCost = variantRes.rows[0].gia_von_binh_quan !== null
                    ? Number(variantRes.rows[0].gia_von_binh_quan)
                    : null;

                if (oldStock === 0 || oldAverageCost === null) {
                    newAverageCost = importUnitCost;
                } else {
                    newAverageCost = ((oldStock * oldAverageCost) + (importQuantity * importUnitCost)) / (oldStock + importQuantity);
                }

                newLatestUnitCost = importUnitCost;
                unitCostUsed = importUnitCost;
                totalCostUsed = importQuantity * importUnitCost;

                await client.query(
                    "UPDATE bien_the_san_pham SET gia_von_binh_quan = $1, gia_nhap_gan_nhat = $2 WHERE bien_the_id = $3",
                    [newAverageCost, newLatestUnitCost, variant_id]
                );
            }

            const newStock = currentStock + actualChange;

            if (newStock < 0) {
                const error = new Error(`Số lượng tồn kho của biến thể ID ${variant_id} không đủ để thực hiện giao dịch này.`); 
                error.statusCode = 400; 
                throw error;
            }

            if (isInsert) {
                await client.query(
                    "INSERT INTO ton_kho (bien_the_id, so_luong_ton) VALUES ($1, $2) ON CONFLICT (bien_the_id) DO UPDATE SET so_luong_ton = EXCLUDED.so_luong_ton",
                    [variant_id, newStock]
                );
            } else {
                await client.query("UPDATE ton_kho SET so_luong_ton = $2 WHERE bien_the_id = $1", [variant_id, newStock]);
            }

            const finalRefCode = (reference_code && reference_code.trim() !== '') ? reference_code.trim() : fallbackRefCode;

            await client.query(
                `INSERT INTO lich_su_ton_kho (bien_the_id, so_luong_thay_doi, so_luong_sau_khi_doi, loai_giao_dich, tham_chieu_id, ghi_chu, nguoi_thuc_hien, gia_nhap, thanh_tien) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [variant_id, actualChange, newStock, transaction_type, finalRefCode, note || '', adminId, unitCostUsed, totalCostUsed]
            );

            const resultItem = {
                variant_id: variant_id,
                previous_stock: currentStock,
                new_stock: newStock,
                reference_code_used: finalRefCode 
            };

            if (transaction_type === 'kiem_kho') {
                resultItem.physical_quantity = physical_quantity;
                resultItem.variance = actualChange;
            } else {
                resultItem.quantity_change = actualChange;
            }

            if (transaction_type === 'nhap_kho') {
                resultItem.unit_cost = unitCostUsed;
                resultItem.total_cost = totalCostUsed;
                resultItem.average_cost = newAverageCost;
                resultItem.latest_unit_cost = newLatestUnitCost;

                const lossWarning = await getLossWarningForVariant(client, variant_id, newAverageCost);
                if (lossWarning) {
                    resultItem.loss_warning = lossWarning;
                }
            }

            results.push(resultItem);
        }

        await client.query("COMMIT");
        return results;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const getLossWarningForVariant = async (client, variantId, averageCost) => {
    if (averageCost === null || averageCost === undefined) return null;

    const res = await client.query(
        `SELECT b.gia AS price, sp.san_pham_id
         FROM bien_the_san_pham b
         JOIN san_pham sp ON b.san_pham_id = sp.san_pham_id
         WHERE b.bien_the_id = $1`,
        [variantId]
    );
    if (res.rows.length === 0) return null;

    const { price, san_pham_id } = res.rows[0];
    const discount = await getActiveDiscountForProduct(client, san_pham_id);
    const effectivePrice = applyDiscount(price, discount);
    const { profit } = computeProfitAndMargin(effectivePrice, averageCost);

    if (profit === null || profit >= 0) return null;

    return {
        effective_price: effectivePrice,
        average_cost: Number(averageCost),
        profit,
        message: 'Sản phẩm đang có lợi nhuận âm (bán lỗ) so với giá vốn bình quân sau khi nhập kho.'
    };
};

module.exports = {
    getInventoryOverview,
    getInventoryHistory,
    adjustInventory
};