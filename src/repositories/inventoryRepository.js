const pool = require('../config/db');

// Lấy danh sách tồn kho tổng quan (Có tính toán Hàng đang giữ trong đơn chờ)
const getInventoryOverview = async ({ page, limit, stock_status, keyword }) => {
    const offset = (page - 1) * limit;
    const params = [];
    let paramIndex = 1;
    let whereClauses = [];

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
        JOIN san_pham sp ON b.san_pham_id = sp.san_pham_id
        LEFT JOIN ton_kho t ON b.bien_the_id = t.bien_the_id
        ${whereString}
    `;
    const { rows: countRows } = await pool.query(countQuery, params);
    const totalItems = countRows[0].total;

    const fetchParams = [...params, limit, offset];
    const query = `
        SELECT 
            b.bien_the_id as variant_id, 
            sp.ten_san_pham as product_name,
            b.sku, 
            b.mau_sac as color, 
            b.kich_co as size, 
            COALESCE(t.so_luong_ton, 0) AS available_stock, 
            COALESCE(d.reserved_stock, 0)::int AS reserved_stock, 
            (COALESCE(t.so_luong_ton, 0) + COALESCE(d.reserved_stock, 0))::int AS physical_stock 
        FROM bien_the_san_pham b
        JOIN san_pham sp ON b.san_pham_id = sp.san_pham_id
        LEFT JOIN ton_kho t ON b.bien_the_id = t.bien_the_id
        LEFT JOIN (
            SELECT ct.bien_the_id, SUM(ct.so_luong) AS reserved_stock
            FROM chi_tiet_don_hang ct
            JOIN don_hang dh ON ct.don_hang_id = dh.don_hang_id
            WHERE dh.trang_thai IN ('pending', 'processing') 
            GROUP BY ct.bien_the_id
        ) d ON b.bien_the_id = d.bien_the_id
        ${whereString}
        ORDER BY b.bien_the_id DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const { rows } = await pool.query(query, fetchParams);

    return {
        inventory: rows,
        pagination: { total_items: totalItems, total_pages: Math.max(1, Math.ceil(totalItems / limit)), current_page: page, limit }
    };
};

// Lấy lịch sử biến động kho của 1 sản phẩm cụ thể
const getInventoryHistory = async (variantId, { page, limit }) => {
    const offset = (page - 1) * limit;

    const countRes = await pool.query('SELECT COUNT(*)::int AS total FROM lich_su_ton_kho WHERE bien_the_id = $1', [variantId]);
    const totalItems = countRes.rows[0].total;

    const { rows } = await pool.query(
        `SELECT l.lich_su_id AS history_id, l.so_luong_thay_doi AS quantity_changed, l.so_luong_sau_khi_doi AS stock_after, 
                l.loai_giao_dich AS transaction_type, l.tham_chieu_id AS reference_code, l.ghi_chu AS note, l.ngay_tao AS created_at,
                nd.ten_dang_nhap AS performed_by
         FROM lich_su_ton_kho l
         LEFT JOIN nguoi_dung nd ON l.nguoi_thuc_hien = nd.nguoi_dung_id
         WHERE l.bien_the_id = $1
         ORDER BY l.lich_su_id DESC
         LIMIT $2 OFFSET $3`,
        [variantId, limit, offset]
    );

    return {
        history: rows,
        pagination: { total_items: totalItems, total_pages: Math.max(1, Math.ceil(totalItems / limit)), current_page: page, limit }
    };
};

// Điều chỉnh kho thủ công (Hỗ trợ xử lý mảng hàng loạt)
const adjustInventory = async (adminId, payloads) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const results = [];

        const now = new Date();
        const fallbackRefCode = `ADJ-${now.toISOString().replace(/[-:T.]/g, '').slice(0, 14)}`; 

        for (const item of payloads) {
            const { variant_id, quantity_change, transaction_type, reference_code, note } = item;

            const stockRes = await client.query("SELECT so_luong_ton FROM ton_kho WHERE bien_the_id = $1", [variant_id]);
            let currentStock = 0;
            let isInsert = false;

            if (stockRes.rows.length === 0) {
                isInsert = true;
            } else {
                currentStock = Number(stockRes.rows[0].so_luong_ton);
            }

            const newStock = currentStock + quantity_change;

            if (newStock < 0) {
                const error = new Error(`Số lượng tồn kho của biến thể ${variant_id} không hợp lệ hoặc không đủ để trừ`); 
                error.statusCode = 400; 
                throw error;
            }

            if (isInsert) {
                await client.query("INSERT INTO ton_kho (bien_the_id, so_luong_ton) VALUES ($1, $2)", [variant_id, newStock]);
            } else {
                await client.query("UPDATE ton_kho SET so_luong_ton = $2 WHERE bien_the_id = $1", [variant_id, newStock]);
            }

            const finalRefCode = (reference_code && reference_code.trim() !== '') ? reference_code.trim() : fallbackRefCode;

            await client.query(
                `INSERT INTO lich_su_ton_kho (bien_the_id, so_luong_thay_doi, so_luong_sau_khi_doi, loai_giao_dich, tham_chieu_id, ghi_chu, nguoi_thuc_hien) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [variant_id, quantity_change, newStock, transaction_type, finalRefCode, note || '', adminId]
            );

            results.push({
                variant_id: variant_id,
                quantity_change: quantity_change,
                previous_stock: currentStock,
                new_stock: newStock,
                reference_code_used: finalRefCode
            });
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

module.exports = {
    getInventoryOverview,
    getInventoryHistory,
    adjustInventory
};