const pool = require('../config/db');
const { uploadImageToImgBB } = require('../utils/imgbb');

const generateSKU = (prefix, id) => {
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${id}-${randomStr}`;
};
const normalizeText = (value) => (value === undefined || value === null ? '' : String(value)).trim();
const slugifyText = (value) => normalizeText(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const processWorkshopSessions = (sessions) => {
    return sessions.map(s => {
        const price = Number(s.price);
        const capacity = Number(s.capacity);
        const booked = Number(s.booked_slots);
        const available = Math.max(0, capacity - booked);
        
        let finalPrice = price;
        let discount = s.discount || null;

        if (discount) {
            discount.value = Number(discount.value);
            if (discount.type === 'percent') finalPrice = price - (price * discount.value / 100);
            else if (discount.type === 'fixed') finalPrice = price - discount.value;
            finalPrice = Math.max(0, finalPrice);
        }

        return {
            variant_id: s.variant_id,
            sku: s.sku,
            slug: s.slug,
            session_name: s.session_name,
            price: price,
            discount: discount,
            final_price: finalPrice,
            total_capacity: capacity,
            booked_slots: booked,
            available_slots: available,
            start_date: s.start_date,
            end_date: s.end_date,
            status: (available <= 0) ? 'full' : s.status,
            images: s.images || []
        };
    });
};

const filterWorkshopsAdmin = async ({ page = 1, limit = 10, keyword, status }) => {
    const offset = (page - 1) * limit;
    const params = [];
    let paramIndex = 1;
    let whereClauses = ["sp.loai_san_pham_id = 3"];

    if (keyword) {
        whereClauses.push(`(ht.tieu_de ILIKE $${paramIndex} OR ht.dia_diem ILIKE $${paramIndex})`);
        params.push(`%${keyword}%`);
        paramIndex++;
    }

    if (status) {
        whereClauses.push(`sp.trang_thai_san_pham = $${paramIndex}`);
        params.push(status);
        paramIndex++;
    }

    const whereString = `WHERE ${whereClauses.join(' AND ')}`;
    const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM hoi_thao ht JOIN san_pham sp ON ht.san_pham_id = sp.san_pham_id ${whereString}`, params);
    const totalItems = countRes.rows[0].total;

    if (totalItems === 0) return { workshops: [], pagination: { total_items: 0, total_pages: 1, current_page: page, limit } };

    const fetchParams = [...params, limit, offset];

    const workshopsRes = await pool.query(
        `SELECT ht.hoi_thao_id AS workshop_id, ht.san_pham_id AS product_id, ht.tieu_de AS title, ht.mo_ta AS description, ht.dia_diem AS location,
                sp.trang_thai_san_pham AS status, sp.danh_muc_id AS category_id, c.ten_danh_muc AS category_name, pt.ten_loai AS type_name
         FROM hoi_thao ht
         JOIN san_pham sp ON ht.san_pham_id = sp.san_pham_id
         LEFT JOIN danh_muc c ON sp.danh_muc_id = c.danh_muc_id
         LEFT JOIN loai_san_pham pt ON sp.loai_san_pham_id = pt.loai_san_pham_id
         ${whereString}
         ORDER BY ht.hoi_thao_id DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        fetchParams
    );

    const workshopIds = workshopsRes.rows.map(ws => ws.workshop_id);
    const sessionsRes = await pool.query(`
        SELECT htb.hoi_thao_id AS workshop_id, htb.bien_the_id AS variant_id, htb.ngay_bat_dau AS start_date, htb.ngay_ket_thuc AS end_date, htb.trang_thai AS status,
               bt.sku, bt.slug, bt.gia AS price, bt.mau_sac AS session_name, tk.so_luong_ton AS capacity,
               COALESCE((SELECT SUM(so_luong) FROM chi_tiet_don_hang ct JOIN don_hang dh ON ct.don_hang_id=dh.don_hang_id WHERE ct.bien_the_id=htb.bien_the_id AND dh.trang_thai!='cancelled'), 0)::int AS booked_slots,
               COALESCE(json_agg(json_build_object('image_url', vi.duong_dan_anh, 'sort_order', vi.thu_tu_hien_thi) ORDER BY vi.thu_tu_hien_thi ASC) FILTER (WHERE vi.hinh_anh_id IS NOT NULL), '[]') AS images,
               (SELECT row_to_json(d) FROM (
                    SELECT km.khuyen_mai_id AS voucher_id, km.tieu_de AS voucher_name, km.kieu_giam_gia AS type, km.gia_tri AS value
                    FROM khuyen_mai_san_pham kmsp JOIN khuyen_mai km ON km.khuyen_mai_id = kmsp.khuyen_mai_id
                    WHERE kmsp.san_pham_id = bt.san_pham_id AND km.trang_thai = 'active'
                    LIMIT 1
               ) d) AS discount
        FROM hoi_thao_bien_the htb 
        JOIN bien_the_san_pham bt ON htb.bien_the_id = bt.bien_the_id 
        LEFT JOIN ton_kho tk ON bt.bien_the_id = tk.bien_the_id
        LEFT JOIN hinh_anh_bien_the vi ON bt.bien_the_id = vi.bien_the_id
        WHERE htb.hoi_thao_id = ANY($1::int[])
        GROUP BY htb.hoi_thao_id, htb.bien_the_id, htb.ngay_bat_dau, htb.ngay_ket_thuc, htb.trang_thai, bt.sku, bt.slug, bt.gia, bt.mau_sac, tk.so_luong_ton, bt.san_pham_id`, 
        [workshopIds]
    );

    const sessionsMap = new Map();
    sessionsRes.rows.forEach(s => {
        if (!sessionsMap.has(s.workshop_id)) sessionsMap.set(s.workshop_id, []);
        
        const price = Number(s.price);
        let finalPrice = price;
        let discount = s.discount || null;
        if (discount) {
            discount.value = Number(discount.value);
            if (discount.type === 'percent') finalPrice = Math.max(0, price - (price * discount.value / 100));
            else if (discount.type === 'fixed') finalPrice = Math.max(0, price - discount.value);
        }
        
        const capacity = Number(s.capacity);
        const booked = Number(s.booked_slots);
        const available = Math.max(0, capacity - booked);

        sessionsMap.get(s.workshop_id).push({
            variant_id: s.variant_id, sku: s.sku, slug: s.slug, session_name: s.session_name,
            price, discount, final_price: finalPrice, total_capacity: capacity, booked_slots: booked,
            available_slots: available, start_date: s.start_date, end_date: s.end_date,
            status: (available <= 0) ? 'full' : s.status, images: s.images
        });
    });

    return {
        workshops: workshopsRes.rows.map(ws => {
            const sessions = sessionsMap.get(ws.workshop_id) || [];
            return { ...ws, sessions };
        }),
        pagination: { total_items: totalItems, total_pages: Math.max(1, Math.ceil(totalItems / limit)), current_page: page, limit }
    };
};

const getWorkshopDetail = async (workshopId) => {
    const wsRes = await pool.query(
        `SELECT ht.hoi_thao_id AS workshop_id, ht.san_pham_id AS product_id, ht.tieu_de AS title, ht.mo_ta AS description, ht.dia_diem AS location,
                sp.danh_muc_id AS category_id, sp.trang_thai_san_pham AS status, c.ten_danh_muc AS category_name, pt.ten_loai AS type_name
         FROM hoi_thao ht
         JOIN san_pham sp ON ht.san_pham_id = sp.san_pham_id
         LEFT JOIN danh_muc c ON sp.danh_muc_id = c.danh_muc_id
         LEFT JOIN loai_san_pham pt ON sp.loai_san_pham_id = pt.loai_san_pham_id
         WHERE ht.hoi_thao_id = $1`, [workshopId]
    );

    if (wsRes.rows.length === 0) return null;
    const workshop = wsRes.rows[0];

    const sRes = await pool.query(`
        SELECT 
            htb.bien_the_id AS variant_id, 
            htb.ngay_bat_dau AS start_date, 
            htb.ngay_ket_thuc AS end_date, 
            htb.trang_thai AS status,
            bt.sku, 
            bt.slug, 
            bt.gia AS price, 
            bt.mau_sac AS session_name, 
            tk.so_luong_ton AS capacity,
            COALESCE((
                SELECT SUM(ct.so_luong) 
                FROM chi_tiet_don_hang ct 
                JOIN don_hang dh ON ct.don_hang_id = dh.don_hang_id 
                WHERE ct.bien_the_id = htb.bien_the_id 
                AND dh.trang_thai != 'cancelled'
            ), 0)::int AS booked_slots,
            COALESCE(json_agg(
                json_build_object('image_url', vi.duong_dan_anh, 'sort_order', vi.thu_tu_hien_thi) 
                ORDER BY vi.thu_tu_hien_thi ASC
            ) FILTER (WHERE vi.hinh_anh_id IS NOT NULL), '[]') AS images,
            (SELECT row_to_json(d) FROM (
                SELECT km.khuyen_mai_id AS voucher_id, km.tieu_de AS voucher_name, km.kieu_giam_gia AS type, km.gia_tri AS value
                FROM khuyen_mai_san_pham kmsp 
                JOIN khuyen_mai km ON km.khuyen_mai_id = kmsp.khuyen_mai_id
                WHERE kmsp.san_pham_id = bt.san_pham_id 
                AND km.trang_thai = 'active'
                LIMIT 1
            ) d) AS discount
        FROM hoi_thao_bien_the htb 
        JOIN bien_the_san_pham bt ON htb.bien_the_id = bt.bien_the_id 
        LEFT JOIN ton_kho tk ON bt.bien_the_id = tk.bien_the_id
        LEFT JOIN hinh_anh_bien_the vi ON bt.bien_the_id = vi.bien_the_id
        WHERE htb.hoi_thao_id = $1
        GROUP BY 
            htb.bien_the_id, 
            htb.ngay_bat_dau, 
            htb.ngay_ket_thuc, 
            htb.trang_thai, 
            bt.sku, 
            bt.slug, 
            bt.gia, 
            bt.mau_sac, 
            tk.so_luong_ton, 
            bt.san_pham_id`, 
        [workshopId]
    );

    workshop.sessions = processWorkshopSessions(sRes.rows);
    return workshop;
};

const createWorkshop = async (payload) => {
    const { title, description, location, category_id, status = 'active', sessions } = payload;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const productRes = await client.query(
            `INSERT INTO san_pham (loai_san_pham_id, danh_muc_id, ten_san_pham, mo_ta, trang_thai_san_pham)
             VALUES (3, $1, $2, $3, $4) RETURNING san_pham_id`,
            [category_id, title, description, status]
        );
        const productId = productRes.rows[0].san_pham_id;

        const workshopRes = await client.query(
            `INSERT INTO hoi_thao (san_pham_id, tieu_de, mo_ta, dia_diem)
             VALUES ($1, $2, $3, $4) RETURNING hoi_thao_id`,
            [productId, title, description, location]
        );
        const workshopId = workshopRes.rows[0].hoi_thao_id;

        for (const session of sessions) {
            const sku = generateSKU('WS', productId);
            const baseSlug = slugifyText(`${title} ${session.session_name}`);
            const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

            const sessionCapacity = session.total_capacity !== undefined ? session.total_capacity : (session.capacity || 0);

            const variantRes = await client.query(
                `INSERT INTO bien_the_san_pham (san_pham_id, sku, slug, gia, mau_sac, kich_co)
                 VALUES ($1, $2, $3, $4, $5, '1 Buổi') RETURNING bien_the_id`,
                [productId, sku, slug, session.price, session.session_name]
            );
            const variantId = variantRes.rows[0].bien_the_id;

            await client.query(`INSERT INTO ton_kho (bien_the_id, so_luong_ton) VALUES ($1, $2)`, [variantId, sessionCapacity]);
            
            await client.query(
                `INSERT INTO hoi_thao_bien_the (hoi_thao_id, bien_the_id, ngay_bat_dau, ngay_ket_thuc, trang_thai) VALUES ($1, $2, $3, $4, $5)`,
                [workshopId, variantId, session.start_date, session.end_date, session.status || 'open']
            );

            if (Array.isArray(session.images)) {
                for (let i = 0; i < session.images.length; i++) {
                    const img = session.images[i];
                    const resolvedUrl = await uploadImageToImgBB(img.image_url, `${sku}-${i}`);
                    await client.query(`INSERT INTO hinh_anh_bien_the (bien_the_id, duong_dan_anh, thu_tu_hien_thi) VALUES ($1, $2, $3)`, [variantId, resolvedUrl, img.sort_order || 1]);
                }
            }
        }

        await client.query('COMMIT');
        return await getWorkshopDetail(workshopId);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const updateWorkshop = async (workshopId, payload) => {
    const { title, description, location, category_id, status, sessions } = payload;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const wsRes = await client.query(`UPDATE hoi_thao SET tieu_de = $1, mo_ta = $2, dia_diem = $3 WHERE hoi_thao_id = $4 RETURNING san_pham_id`, [title, description, location, workshopId]);
        if (wsRes.rows.length === 0) throw new Error('Workshop không tồn tại');
        const productId = wsRes.rows[0].san_pham_id;

        await client.query(`UPDATE san_pham SET danh_muc_id = $1, ten_san_pham = $2, mo_ta = $3, trang_thai_san_pham = $4 WHERE san_pham_id = $5`, [category_id, title, description, status, productId]);

        if (Array.isArray(sessions)) {
            for (const session of sessions) {
                const sessionCapacity = session.total_capacity !== undefined ? session.total_capacity : (session.capacity || 0);

                const checkOwnership = await client.query(
                    `SELECT 1 FROM hoi_thao_bien_the WHERE hoi_thao_id = $1 AND bien_the_id = $2`,
                    [workshopId, session.variant_id]
                );

                if (checkOwnership.rows.length === 0) {
                    throw { statusCode: 400, message: `Ca học (variant_id: ${session.variant_id}) không thuộc về Workshop này!` };
                }

                if (session.variant_id) {
                    await client.query(`UPDATE bien_the_san_pham SET gia = $1, mau_sac = $2 WHERE bien_the_id = $3`, [session.price, session.session_name, session.variant_id]);

                    await client.query(`UPDATE ton_kho SET so_luong_ton = $1 WHERE bien_the_id = $2`, [sessionCapacity, session.variant_id]);
                    
                    await client.query(`UPDATE hoi_thao_bien_the SET ngay_bat_dau = $1, ngay_ket_thuc = $2, trang_thai = $3 WHERE bien_the_id = $4`, [session.start_date, session.end_date, session.status, session.variant_id]);

                    if (Array.isArray(session.images)) {
                        await client.query(`DELETE FROM hinh_anh_bien_the WHERE bien_the_id = $1`, [session.variant_id]);
                        for (let i = 0; i < session.images.length; i++) {
                            const img = session.images[i];
                            const resolvedUrl = await uploadImageToImgBB(img.image_url, `WS-UP-${session.variant_id}-${i}`);
                            await client.query(`INSERT INTO hinh_anh_bien_the (bien_the_id, duong_dan_anh, thu_tu_hien_thi) VALUES ($1, $2, $3)`, [session.variant_id, resolvedUrl, img.sort_order || 1]);
                        }
                    }
                } else {
                    const sku = generateSKU('WS', productId);
                    const baseSlug = slugifyText(`${title} ${session.session_name}`);
                    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

                    const variantRes = await client.query(
                        `INSERT INTO bien_the_san_pham (san_pham_id, sku, slug, gia, mau_sac, kich_co) VALUES ($1, $2, $3, $4, $5, '1 Buổi') RETURNING bien_the_id`,
                        [productId, sku, slug, session.price, session.session_name]
                    );
                    const newVariantId = variantRes.rows[0].bien_the_id;

                    await client.query(`INSERT INTO ton_kho (bien_the_id, so_luong_ton) VALUES ($1, $2)`, [newVariantId, sessionCapacity]);
                    await client.query(`INSERT INTO hoi_thao_bien_the (hoi_thao_id, bien_the_id, ngay_bat_dau, ngay_ket_thuc, trang_thai) VALUES ($1, $2, $3, $4, $5)`, [workshopId, newVariantId, session.start_date, session.end_date, session.status || 'open']);
                    
                    if (Array.isArray(session.images)) {
                        for (let i = 0; i < session.images.length; i++) {
                            const img = session.images[i];
                            const resolvedUrl = await uploadImageToImgBB(img.image_url, `${sku}-${i}`);
                            await client.query(`INSERT INTO hinh_anh_bien_the (bien_the_id, duong_dan_anh, thu_tu_hien_thi) VALUES ($1, $2, $3)`, [newVariantId, resolvedUrl, img.sort_order || 1]);
                        }
                    }
                }
            }
        }

        await client.query('COMMIT');
        return await getWorkshopDetail(workshopId);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const deleteWorkshop = async (workshopId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const wsRes = await client.query(`SELECT san_pham_id FROM hoi_thao WHERE hoi_thao_id = $1`, [workshopId]);
        if (wsRes.rows.length === 0) throw { statusCode: 404, message: 'Workshop không tồn tại' };
        const productId = wsRes.rows[0].san_pham_id;

        const variantRes = await client.query(`SELECT bien_the_id FROM hoi_thao_bien_the WHERE hoi_thao_id = $1`, [workshopId]);
        const variantIds = variantRes.rows.map(row => row.bien_the_id);

        if (variantIds.length > 0) {
            const checkOrders = await client.query(`SELECT 1 FROM chi_tiet_don_hang WHERE bien_the_id = ANY($1::int[]) LIMIT 1`, [variantIds]);
            if (checkOrders.rows.length > 0) throw { statusCode: 400, message: 'Không thể xóa Workshop đã có học viên đăng ký/mua vé.' };

            await client.query(`DELETE FROM hinh_anh_bien_the WHERE bien_the_id = ANY($1::int[])`, [variantIds]);
            await client.query(`DELETE FROM ton_kho WHERE bien_the_id = ANY($1::int[])`, [variantIds]);
            await client.query(`DELETE FROM gio_hang WHERE bien_the_id = ANY($1::int[])`, [variantIds]);
            await client.query(`DELETE FROM danh_sach_yeu_thich WHERE san_pham_id = $1`, [productId]);
            await client.query(`DELETE FROM khuyen_mai_san_pham WHERE san_pham_id = $1`, [productId]);
            await client.query(`DELETE FROM phieu_giam_gia_san_pham WHERE san_pham_id = $1 OR bien_the_id = ANY($2::int[])`, [productId, variantIds]);
            await client.query(`DELETE FROM hoi_thao_bien_the WHERE hoi_thao_id = $1`, [workshopId]);
            await client.query(`DELETE FROM bien_the_san_pham WHERE san_pham_id = $1`, [productId]);
        }

        await client.query(`DELETE FROM hoi_thao WHERE hoi_thao_id = $1`, [workshopId]);
        await client.query(`DELETE FROM san_pham WHERE san_pham_id = $1`, [productId]);

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    filterWorkshopsAdmin, 
    getWorkshopDetail, 
    createWorkshop, 
    updateWorkshop, 
    deleteWorkshop
};