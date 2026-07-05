const pool = require('../config/db');

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
            sp.ten_san_pham as product_name,
            b.sku, 
            b.mau_sac as color, 
            b.kich_co as size, 
            COALESCE(t.so_luong_ton, 0) AS available_stock, 
            COALESCE(d.reserved_stock, 0)::int AS reserved_stock, 
            (COALESCE(t.so_luong_ton, 0) + COALESCE(d.reserved_stock, 0))::int AS physical_stock 
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
        ${whereString}
        ORDER BY b.bien_the_id DESC 
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const { rows } = await pool.query(dataQuery, fetchParams);
    
    return {
        inventory: rows,
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
            const { variant_id, quantity_change, physical_quantity, transaction_type, reference_code, note } = item;

            const stockRes = await client.query("SELECT so_luong_ton FROM ton_kho WHERE bien_the_id = $1", [variant_id]);
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

            const newStock = currentStock + actualChange;

            if (newStock < 0) {
                const error = new Error(`Số lượng tồn kho của biến thể ID ${variant_id} không đủ để thực hiện giao dịch này.`); 
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
                [variant_id, actualChange, newStock, transaction_type, finalRefCode, note || '', adminId]
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

module.exports = {
    getInventoryOverview,
    getInventoryHistory,
    adjustInventory
};