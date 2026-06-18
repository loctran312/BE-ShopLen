const pool = require('../config/db');
const { uploadImageToImgBB } = require('../utils/imgbb');

const normalizeText = (value) => (value === undefined || value === null ? '' : String(value)).trim();

const slugifyText = (value) => normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const parseInteger = (value, fieldName) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
        const error = new Error(`${fieldName} không hợp lệ`);
        error.statusCode = 400;
        throw error;
    }
    return parsed;
};

const parsePositiveInteger = (value, fieldName) => {
    const parsed = parseInteger(value, fieldName);
    if (parsed <= 0) {
        const error = new Error(`${fieldName} không hợp lệ`);
        error.statusCode = 400;
        throw error;
    }
    return parsed;
};

const parsePrice = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        const error = new Error('price không hợp lệ');
        error.statusCode = 400;
        throw error;
    }
    return parsed;
};

const normalizeCategoryOrTypeId = (value, fieldName) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        const error = new Error(`${fieldName} không hợp lệ`);
        error.statusCode = 400;
        throw error;
    }
    return parsed;
};

const validateProductStatus = (value) => {
    if (value === undefined || value === null || value === '') {
        return 'active';
    }
    return normalizeText(value).toLowerCase();
};

const buildVariantBaseSlug = (productName, variant) => {
    const slugSource = normalizeText(variant.slug)
        || (variant.color ? `${productName} mau ${variant.color}` : '')
        || (variant.size ? `${productName} ${variant.size}` : productName);

    const slug = slugifyText(slugSource);
    if (!slug) {
        const error = new Error('Không thể tạo slug cho biến thể');
        error.statusCode = 400;
        throw error;
    }
    return slug;
};

const generateSKU = (prefix, id) => {
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${id}-${randomStr}`;
};

const generateUniqueVariantSlug = async (baseSlug, ignoreVariantId = null) => {
    if (!baseSlug) {
        const error = new Error('slug không hợp lệ');
        error.statusCode = 400;
        throw error;
    }

    const params = ignoreVariantId
        ? [baseSlug, `${baseSlug}-%`, ignoreVariantId]
        : [baseSlug, `${baseSlug}-%`];

    const query = ignoreVariantId
        ? `SELECT slug FROM bien_the_san_pham WHERE (slug = $1 OR slug LIKE $2) AND bien_the_id <> $3`
        : `SELECT slug FROM bien_the_san_pham WHERE slug = $1 OR slug LIKE $2`;

    const result = await pool.query(query, params);
    const usedSlugs = new Set(result.rows.map((row) => row.slug));

    if (!usedSlugs.has(baseSlug)) return baseSlug;

    let suffix = 2;
    let candidate = `${baseSlug}-${suffix}`;
    while (usedSlugs.has(candidate)) {
        suffix += 1;
        candidate = `${baseSlug}-${suffix}`;
    }
    return candidate;
};

const normalizeImageItems = (images, variantIndex) => {
    if (images === undefined || images === null) return null;
    if (!Array.isArray(images)) {
        const error = new Error(`images ở biến thể ${variantIndex + 1} phải là mảng`);
        error.statusCode = 400;
        throw error;
    }

    return images.map((image, imageIndex) => {
        if (!isObject(image)) {
            const error = new Error(`Ảnh ở biến thể ${variantIndex + 1}, vị trí ${imageIndex + 1} không hợp lệ`);
            error.statusCode = 400;
            throw error;
        }

        const imageUrl = normalizeText(image.image_url);
        if (!imageUrl) {
            const error = new Error(`image_url ở biến thể ${variantIndex + 1}, vị trí ${imageIndex + 1} không được để trống`);
            error.statusCode = 400;
            throw error;
        }

        const sortOrder = image.sort_order === undefined || image.sort_order === null || image.sort_order === ''
            ? imageIndex + 1
            : parseInteger(image.sort_order, 'sort_order');

        return { image_url: imageUrl, sort_order: sortOrder };
    });
};

const normalizeVariantPayload = (variant, index) => {
    if (!isObject(variant)) {
        const error = new Error(`Biến thể ở vị trí ${index + 1} không hợp lệ`);
        error.statusCode = 400;
        throw error;
    }

    const variantId = variant.variant_id === undefined || variant.variant_id === null || variant.variant_id === ''
        ? null
        : parseInteger(variant.variant_id, 'variant_id');
    const sku = normalizeText(variant.sku);
    const price = parsePrice(variant.price);
    const color = normalizeText(variant.color) || null;
    const size = normalizeText(variant.size) || null;
    const slug = normalizeText(variant.slug) || null;
    const images = normalizeImageItems(variant.images, index);

    return { variant_id: variantId, sku, price, color, size, slug, images, stock_quantity: variant.stock_quantity };
};

const getProductTypeById = (typeId) => pool.query(
    'SELECT loai_san_pham_id AS type_id FROM loai_san_pham WHERE loai_san_pham_id = $1 LIMIT 1',
    [typeId]
);

const getCategoryById = (categoryId) => pool.query(
    'SELECT danh_muc_id AS category_id FROM danh_muc WHERE danh_muc_id = $1 LIMIT 1',
    [categoryId]
);

const buildProductsList = async ({ page, limit }) => {
    const offset = (page - 1) * limit;

    const [countResult, productsResult] = await Promise.all([
        pool.query('SELECT COUNT(*)::int AS total_items FROM san_pham'),
        pool.query(
            `SELECT p.san_pham_id AS product_id, p.ten_san_pham AS product_name, p.mo_ta AS description, p.trang_thai_san_pham AS product_status,
                    c.ten_danh_muc AS category_name, pt.ten_loai AS type_name
             FROM san_pham p
             LEFT JOIN danh_muc c ON c.danh_muc_id = p.danh_muc_id
             LEFT JOIN loai_san_pham pt ON pt.loai_san_pham_id = p.loai_san_pham_id
             ORDER BY p.san_pham_id DESC LIMIT $1 OFFSET $2`,
            [limit, offset]
        ),
    ]);

    const products = productsResult.rows;

    if (products.length === 0) {
        return { products: [], pagination: { total_items: countResult.rows[0].total_items, total_pages: Math.max(1, Math.ceil(countResult.rows[0].total_items / limit)), current_page: page, limit } };
    }

    const productIds = products.map((product) => product.product_id);

    const variantsResult = await pool.query(
        `SELECT pv.san_pham_id AS product_id, pv.bien_the_id AS variant_id, pv.sku, pv.slug, pv.gia AS price, pv.mau_sac AS color, pv.kich_co AS size,
                COALESCE(tk.so_luong_ton, 0) AS stock_quantity,
                COALESCE(json_agg(json_build_object('image_id', vi.hinh_anh_id, 'image_url', vi.duong_dan_anh, 'sort_order', vi.thu_tu_hien_thi) ORDER BY vi.thu_tu_hien_thi ASC, vi.hinh_anh_id ASC) FILTER (WHERE vi.hinh_anh_id IS NOT NULL), '[]') AS images,
                (SELECT row_to_json(d) FROM (
                    SELECT km.khuyen_mai_id AS voucher_id, km.tieu_de AS voucher_name, km.kieu_giam_gia AS type, km.gia_tri AS value
                    FROM khuyen_mai_san_pham kmsp
                    JOIN khuyen_mai km ON km.khuyen_mai_id = kmsp.khuyen_mai_id
                    WHERE (kmsp.bien_the_id = pv.bien_the_id OR kmsp.san_pham_id = pv.san_pham_id)
                      AND km.trang_thai = 'active'
                      AND (km.ngay_bat_dau IS NULL OR km.ngay_bat_dau <= CURRENT_TIMESTAMP)
                      AND (km.ngay_ket_thuc IS NULL OR km.ngay_ket_thuc >= CURRENT_TIMESTAMP)
                    ORDER BY (CASE WHEN kmsp.bien_the_id IS NOT NULL THEN 1 ELSE 2 END) ASC, km.khuyen_mai_id DESC
                    LIMIT 1
                ) d) AS discount
         FROM bien_the_san_pham pv
         LEFT JOIN ton_kho tk ON tk.bien_the_id = pv.bien_the_id
         LEFT JOIN hinh_anh_bien_the vi ON vi.bien_the_id = pv.bien_the_id
         WHERE pv.san_pham_id = ANY($1::int[])
         GROUP BY pv.san_pham_id, pv.bien_the_id, pv.sku, pv.slug, pv.gia, pv.mau_sac, pv.kich_co, tk.so_luong_ton
         ORDER BY pv.san_pham_id DESC, pv.bien_the_id ASC`,
        [productIds]
    );

    const variantsByProductId = new Map();
    for (const row of variantsResult.rows) {
        if (!variantsByProductId.has(row.product_id)) variantsByProductId.set(row.product_id, []);

        const price = Number(row.price);
        let finalPrice = price;
        let discount = row.discount || null;

        if (discount) {
            discount.value = Number(discount.value);
            if (discount.type === 'percent') {
                finalPrice = price - (price * discount.value / 100);
            } else if (discount.type === 'fixed') {
                finalPrice = price - discount.value;
            }
            if (finalPrice < 0) finalPrice = 0;
        }

        variantsByProductId.get(row.product_id).push({
            variant_id: row.variant_id, sku: row.sku, slug: row.slug, 
            price: price, discount: discount, final_price: finalPrice, 
            color: row.color, size: row.size, stock_quantity: Number(row.stock_quantity), images: row.images || [],
        });
    }

    return {
        products: products.map((product) => ({
            ...product,
            variants: variantsByProductId.get(product.product_id) || [],
        })),
        pagination: { total_items: countResult.rows[0].total_items, total_pages: Math.max(1, Math.ceil(countResult.rows[0].total_items / limit)), current_page: page, limit },
    };
};

const buildProductDetail = async (productId) => {
    const productResult = await pool.query(
        `SELECT p.san_pham_id AS product_id, p.loai_san_pham_id AS type_id, p.danh_muc_id AS category_id, p.ten_san_pham AS product_name, p.mo_ta AS description, p.trang_thai_san_pham AS product_status, c.ten_danh_muc AS category_name, pt.ten_loai AS type_name
         FROM san_pham p
         LEFT JOIN danh_muc c ON c.danh_muc_id = p.danh_muc_id
         LEFT JOIN loai_san_pham pt ON pt.loai_san_pham_id = p.loai_san_pham_id
         WHERE p.san_pham_id = $1`,
        [productId]
    );

    if (productResult.rows.length === 0) return null;

    const variantResult = await pool.query(
        `SELECT pv.bien_the_id AS variant_id, pv.sku, pv.slug, pv.gia AS price, pv.mau_sac AS color, pv.kich_co AS size, COALESCE(i.so_luong_ton, 0) AS stock_quantity, vi.hinh_anh_id AS image_id, vi.duong_dan_anh AS image_url, vi.thu_tu_hien_thi AS sort_order,
                (SELECT row_to_json(d) FROM (
                    SELECT km.khuyen_mai_id AS voucher_id, km.tieu_de AS voucher_name, km.kieu_giam_gia AS type, km.gia_tri AS value
                    FROM khuyen_mai_san_pham kmsp
                    JOIN khuyen_mai km ON km.khuyen_mai_id = kmsp.khuyen_mai_id
                    WHERE (kmsp.bien_the_id = pv.bien_the_id OR kmsp.san_pham_id = pv.san_pham_id)
                      AND km.trang_thai = 'active'
                      AND (km.ngay_bat_dau IS NULL OR km.ngay_bat_dau <= CURRENT_TIMESTAMP)
                      AND (km.ngay_ket_thuc IS NULL OR km.ngay_ket_thuc >= CURRENT_TIMESTAMP)
                    ORDER BY (CASE WHEN kmsp.bien_the_id IS NOT NULL THEN 1 ELSE 2 END) ASC, km.khuyen_mai_id DESC
                    LIMIT 1
                ) d) AS discount
         FROM bien_the_san_pham pv
         LEFT JOIN ton_kho i ON i.bien_the_id = pv.bien_the_id
         LEFT JOIN hinh_anh_bien_the vi ON vi.bien_the_id = pv.bien_the_id
         WHERE pv.san_pham_id = $1
         ORDER BY pv.bien_the_id ASC, vi.thu_tu_hien_thi ASC, vi.hinh_anh_id ASC`,
        [productId]
    );

    const variantMap = new Map();
    for (const row of variantResult.rows) {
        if (!variantMap.has(row.variant_id)) {
            // BỔ SUNG: Tính toán final_price cho detail
            const price = Number(row.price);
            let finalPrice = price;
            let discount = row.discount || null;

            if (discount) {
                discount.value = Number(discount.value);
                if (discount.type === 'percent') {
                    finalPrice = price - (price * discount.value / 100);
                } else if (discount.type === 'fixed') {
                    finalPrice = price - discount.value;
                }
                if (finalPrice < 0) finalPrice = 0;
            }

            variantMap.set(row.variant_id, {
                variant_id: row.variant_id, sku: row.sku, slug: row.slug, 
                price: price, discount: discount, final_price: finalPrice,
                color: row.color, size: row.size, stock_quantity: Number(row.stock_quantity || 0), images: [],
            });
        }
        if (row.image_id) {
            variantMap.get(row.variant_id).images.push({ image_id: row.image_id, image_url: row.image_url, sort_order: row.sort_order });
        }
    }

    const product = productResult.rows[0];
    return { ...product, variants: Array.from(variantMap.values()) };
};

const ensureProductDependenciesAreClear = async (client, productId) => {
    const [workshops, cartItems, wishlistItems, workshopVariants] = await Promise.all([
        client.query('SELECT 1 FROM hoi_thao WHERE san_pham_id = $1 LIMIT 1', [productId]),
        client.query(`SELECT 1 FROM gio_hang c INNER JOIN bien_the_san_pham pv ON pv.bien_the_id = c.bien_the_id WHERE pv.san_pham_id = $1 LIMIT 1`, [productId]),
        client.query(`SELECT 1 FROM danh_sach_yeu_thich w INNER JOIN bien_the_san_pham pv ON pv.bien_the_id = w.bien_the_id WHERE pv.san_pham_id = $1 LIMIT 1`, [productId]),
        client.query(`SELECT 1 FROM hoi_thao_bien_the wv INNER JOIN hoi_thao ws ON ws.hoi_thao_id = wv.hoi_thao_id WHERE ws.san_pham_id = $1 LIMIT 1`, [productId]),
    ]);

    return workshops.rows.length > 0 || cartItems.rows.length > 0 || wishlistItems.rows.length > 0 || workshopVariants.rows.length > 0;
};

const uploadVariantImages = async (images, slugPrefix, variantIndex) => {
    if (images === null) return [];
    if (!Array.isArray(images)) return null;

    const uploadedImages = [];
    for (let imageIndex = 0; imageIndex < images.length; imageIndex += 1) {
        const image = images[imageIndex];
        const imageUrl = await uploadImageToImgBB(image.image_url, `${slugPrefix}-${variantIndex + 1}-${imageIndex + 1}`);
        uploadedImages.push({ image_url: imageUrl, sort_order: image.sort_order });
    }
    return uploadedImages;
};

const upsertVariantInventory = async (client, variantId, stockQuantity) => {
    await client.query(
        `INSERT INTO ton_kho (bien_the_id, so_luong_ton) VALUES ($1, $2) ON CONFLICT (bien_the_id) DO UPDATE SET so_luong_ton = EXCLUDED.so_luong_ton`,
        [variantId, stockQuantity]
    );
};

const replaceVariantImages = async (client, variantId, images) => {
    await client.query('DELETE FROM hinh_anh_bien_the WHERE bien_the_id = $1', [variantId]);
    if (!Array.isArray(images) || images.length === 0) return;
    for (const image of images) {
        await client.query(
            `INSERT INTO hinh_anh_bien_the (bien_the_id, duong_dan_anh, thu_tu_hien_thi) VALUES ($1, $2, $3)`,
            [variantId, image.image_url, image.sort_order]
        );
    }
};

// ==========================================
// HÀM GHI NHẬN SỰ KIỆN WISHLIST (GIẢM GIÁ / HÀNG VỀ)
// ==========================================
const triggerWishlistEvent = async (client, variantId, productId, eventType) => {
    const usersRes = await client.query(
        `SELECT nguoi_dung_id FROM danh_sach_yeu_thich WHERE bien_the_id = $1`, 
        [variantId]
    );

    for (const row of usersRes.rows) {
        const checkSpam = await client.query(
            `SELECT 1 FROM thong_bao_yeu_thich 
             WHERE nguoi_dung_id = $1 AND san_pham_id = $2 AND loai_thong_bao = $3 AND da_gui = FALSE`,
            [row.nguoi_dung_id, productId, eventType]
        );

        if (checkSpam.rows.length === 0) {
            await client.query(
                `INSERT INTO thong_bao_yeu_thich (nguoi_dung_id, san_pham_id, loai_thong_bao, da_gui) 
                 VALUES ($1, $2, $3, FALSE)`,
                [row.nguoi_dung_id, productId, eventType]
            );
        }
    }
};

const getAllProductTypes = async () => pool.query('SELECT loai_san_pham_id AS type_id, ten_loai AS type_name, mo_ta AS description FROM loai_san_pham ORDER BY loai_san_pham_id ASC');
const getAllProducts = async ({ page, limit }) => buildProductsList({ page, limit });
const getProductDetail = async (productId) => buildProductDetail(productId);

const createProduct = async (payload) => {
    const client = await pool.connect();
    try {
        const typeId = normalizeCategoryOrTypeId(payload.type_id, 'type_id');
        const categoryId = normalizeCategoryOrTypeId(payload.category_id, 'category_id');
        const productName = normalizeText(payload.product_name);
        const description = normalizeText(payload.description) || null;
        const productStatus = validateProductStatus(payload.product_status);

        if (!productName) {
            const error = new Error('product_name không được để trống');
            error.statusCode = 400;
            throw error;
        }

        if (!Array.isArray(payload.variants) || payload.variants.length === 0) {
            const error = new Error('variants phải là một mảng không rỗng');
            error.statusCode = 400;
            throw error;
        }

        const [typeExists, categoryExists] = await Promise.all([getProductTypeById(typeId), getCategoryById(categoryId)]);
        if (typeExists.rows.length === 0) { const error = new Error('type_id không tồn tại'); error.statusCode = 400; throw error; }
        if (categoryExists.rows.length === 0) { const error = new Error('category_id không tồn tại'); error.statusCode = 400; throw error; }

        const normalizedVariants = payload.variants.map((variant, index) => normalizeVariantPayload(variant, index));
        const preparedVariants = [];

        for (let index = 0; index < normalizedVariants.length; index += 1) {
            const variant = normalizedVariants[index];
            const baseSlug = variant.slug || buildVariantBaseSlug(productName, variant);
            const resolvedSlug = await generateUniqueVariantSlug(baseSlug);
            const uploadedImages = await uploadVariantImages(variant.images, resolvedSlug, index);

            preparedVariants.push({
                ...variant, slug: resolvedSlug, images: uploadedImages, stock_quantity: variant.stock_quantity === null ? 0 : variant.stock_quantity,
            });
        }

        await client.query('BEGIN');
        const productResult = await client.query(
            `INSERT INTO san_pham (loai_san_pham_id, danh_muc_id, ten_san_pham, mo_ta, trang_thai_san_pham) VALUES ($1, $2, $3, $4, $5) RETURNING san_pham_id AS product_id`,
            [typeId, categoryId, productName, description, productStatus]
        );
        const productId = productResult.rows[0].product_id;

        for (const variant of preparedVariants) {
            const sku = generateSKU('SP', productId);
            const variantResult = await client.query(
                `INSERT INTO bien_the_san_pham (san_pham_id, sku, slug, gia, mau_sac, kich_co) VALUES ($1, $2, $3, $4, $5, $6) RETURNING bien_the_id`,
                [productId, sku, variant.slug, variant.price, variant.color, variant.size]
            );
            const createdVariant = variantResult.rows[0];
            await upsertVariantInventory(client, createdVariant.bien_the_id, variant.stock_quantity);

            if (Array.isArray(variant.images) && variant.images.length > 0) {
                await replaceVariantImages(client, createdVariant.bien_the_id, variant.images);
            }
        }
        await client.query('COMMIT');
        return await buildProductDetail(productId);
    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        if (!error.statusCode) error.statusCode = error.code === '23505' ? 400 : 400;
        if (error.code === '23505') error.message = 'SKU hoặc slug đã tồn tại';
        throw error;
    } finally {
        client.release();
    }
};

const updateProduct = async (productId, payload) => {
    const client = await pool.connect();
    try {
        const currentProductResult = await client.query(`SELECT * FROM san_pham WHERE san_pham_id = $1`, [productId]);
        if (currentProductResult.rows.length === 0) { const error = new Error('Sản phẩm không tồn tại'); error.statusCode = 404; throw error; }

        const currentProduct = currentProductResult.rows[0];
        const typeId = payload.type_id === undefined ? currentProduct.loai_san_pham_id : normalizeCategoryOrTypeId(payload.type_id, 'type_id');
        const categoryId = payload.category_id === undefined ? currentProduct.danh_muc_id : normalizeCategoryOrTypeId(payload.category_id, 'category_id');
        const productName = payload.product_name === undefined ? currentProduct.ten_san_pham : normalizeText(payload.product_name);
        const description = payload.description === undefined ? currentProduct.mo_ta : (normalizeText(payload.description) || null);
        const productStatus = payload.product_status === undefined ? currentProduct.trang_thai_san_pham : validateProductStatus(payload.product_status);

        if (!productName) { const error = new Error('product_name không được để trống'); error.statusCode = 400; throw error; }

        const [typeExists, categoryExists] = await Promise.all([getProductTypeById(typeId), getCategoryById(categoryId)]);
        if (typeExists.rows.length === 0) { const error = new Error('type_id không tồn tại'); error.statusCode = 400; throw error; }
        if (categoryExists.rows.length === 0) { const error = new Error('category_id không tồn tại'); error.statusCode = 400; throw error; }

        const hasVariantsPayload = Array.isArray(payload.variants);
        let normalizedVariants = [];

        if (hasVariantsPayload) {
            if (payload.variants.length === 0) { const error = new Error('variants không được để trống khi gửi cập nhật'); error.statusCode = 400; throw error; }
            normalizedVariants = payload.variants.map((variant, index) => normalizeVariantPayload(variant, index));
        }

        const preparedVariants = normalizedVariants.map((variant, index) => ({ ...variant, _uploadIndex: index }));

        await client.query('BEGIN');
        await client.query(
            `UPDATE san_pham SET loai_san_pham_id = $1, danh_muc_id = $2, ten_san_pham = $3, mo_ta = $4, trang_thai_san_pham = $5 WHERE san_pham_id = $6`,
            [typeId, categoryId, productName, description, productStatus, productId]
        );

        if (hasVariantsPayload) {
            for (const variant of preparedVariants) {
                if (variant.variant_id) {
                    // Lấy ra GIÁ CŨ và TỒN KHO CŨ để so sánh
                    const currentVariantResult = await client.query(
                        `SELECT bt.bien_the_id AS variant_id, bt.san_pham_id AS product_id, bt.sku, bt.slug, bt.gia AS price, COALESCE(tk.so_luong_ton, 0) AS stock_quantity
                         FROM bien_the_san_pham bt
                         LEFT JOIN ton_kho tk ON bt.bien_the_id = tk.bien_the_id
                         WHERE bt.bien_the_id = $1 AND bt.san_pham_id = $2`,
                        [variant.variant_id, productId]
                    );

                    if (currentVariantResult.rows.length === 0) {
                        const error = new Error(`variant_id ${variant.variant_id} không tồn tại trong sản phẩm này`);
                        error.statusCode = 400; throw error;
                    }

                    const currentVariant = currentVariantResult.rows[0];
                    const nextSlug = variant.slug ? await generateUniqueVariantSlug(variant.slug, variant.variant_id) : currentVariant.slug;
                    const uploadedImages = variant.images !== null ? await uploadVariantImages(variant.images, nextSlug, variant._uploadIndex) : null;

                    await client.query(
                        `UPDATE bien_the_san_pham SET slug = $1, sku = $2, gia = $3, mau_sac = $4, kich_co = $5 WHERE bien_the_id = $6`,
                        [nextSlug, variant.sku, variant.price, variant.color, variant.size, variant.variant_id]
                    );

                    const newStock = variant.stock_quantity === null ? Number(currentVariant.stock_quantity) : Number(variant.stock_quantity);
                    await upsertVariantInventory(client, variant.variant_id, newStock);

                    if (uploadedImages !== null) await replaceVariantImages(client, variant.variant_id, uploadedImages);

                    // KIỂM TRA ĐIỀU KIỆN ĐỂ TẠO THÔNG BÁO WISHLIST
                    const oldPrice = Number(currentVariant.price);
                    const newPrice = Number(variant.price);
                    if (newPrice < oldPrice) {
                        await triggerWishlistEvent(client, variant.variant_id, productId, 'price_drop');
                    }

                    const oldStock = Number(currentVariant.stock_quantity);
                    if (oldStock === 0 && newStock > 0) {
                        await triggerWishlistEvent(client, variant.variant_id, productId, 'back_in_stock');
                    }
                } else {
                    const baseSlug = variant.slug || buildVariantBaseSlug(productName, variant);
                    const nextSlug = await generateUniqueVariantSlug(baseSlug);
                    const uploadedImages = variant.images !== null ? await uploadVariantImages(variant.images, nextSlug, variant._uploadIndex) : null;
                    const sku = generateSKU('SP', productId);

                    const insertedVariantResult = await client.query(
                        `INSERT INTO bien_the_san_pham (san_pham_id, sku, slug, gia, mau_sac, kich_co) VALUES ($1, $2, $3, $4, $5, $6) RETURNING bien_the_id AS variant_id`,
                        [productId, sku, nextSlug, variant.price, variant.color, variant.size]
                    );

                    const newVariantId = insertedVariantResult.rows[0].variant_id;
                    await upsertVariantInventory(client, newVariantId, variant.stock_quantity === null ? 0 : variant.stock_quantity);
                    if (uploadedImages !== null && uploadedImages.length > 0) await replaceVariantImages(client, newVariantId, uploadedImages);
                }
            }
        }

        await client.query('COMMIT');
        return buildProductDetail(productId);
    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        if (!error.statusCode) error.statusCode = error.code === '23505' ? 400 : 400;
        if (error.code === '23505') error.message = 'SKU hoặc slug đã tồn tại';
        throw error;
    } finally {
        client.release();
    }
};

const deleteProduct = async (productId) => {
    const client = await pool.connect();
    try {
        const currentProductResult = await client.query('SELECT san_pham_id AS product_id FROM san_pham WHERE san_pham_id = $1', [productId]);
        if (currentProductResult.rows.length === 0) { const error = new Error('Sản phẩm không tồn tại'); error.statusCode = 404; throw error; }

        const blocked = await ensureProductDependenciesAreClear(client, productId);
        if (blocked) { const error = new Error('Không thể xóa sản phẩm đang được sử dụng'); error.statusCode = 400; throw error; }

        await client.query('BEGIN');
        const variantResult = await client.query('SELECT bien_the_id AS variant_id FROM bien_the_san_pham WHERE san_pham_id = $1', [productId]);
        const variantIds = variantResult.rows.map((row) => row.variant_id);

        if (variantIds.length > 0) {
            await client.query('DELETE FROM hinh_anh_bien_the WHERE bien_the_id = ANY($1::int[])', [variantIds]);
            await client.query('DELETE FROM ton_kho WHERE bien_the_id = ANY($1::int[])', [variantIds]);
            await client.query('DELETE FROM phieu_giam_gia_san_pham WHERE san_pham_id = $1 OR bien_the_id = ANY($2::int[])', [productId, variantIds]);
            await client.query('DELETE FROM khuyen_mai_san_pham WHERE san_pham_id = $1 OR bien_the_id = ANY($2::int[])', [productId, variantIds]);
        } else {
            await client.query('DELETE FROM phieu_giam_gia_san_pham WHERE san_pham_id = $1', [productId]);
            await client.query('DELETE FROM khuyen_mai_san_pham WHERE san_pham_id = $1', [productId]);
        }

        await client.query('DELETE FROM thong_bao_yeu_thich WHERE san_pham_id = $1', [productId]);
        await client.query('DELETE FROM bien_the_san_pham WHERE san_pham_id = $1', [productId]);
        await client.query('DELETE FROM san_pham WHERE san_pham_id = $1', [productId]);
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        if (!error.statusCode) error.statusCode = 400;
        throw error;
    } finally {
        client.release();
    }
};

const filterProducts = async (filters) => {
    const { page = 1, limit = 10, keyword, category_ids, type_ids, min_price, max_price, status } = filters;
    const offset = (page - 1) * limit;

    const params = [];
    let paramIndex = 1;
    let whereClauses = [];

    if (keyword) {
        whereClauses.push(`p.ten_san_pham ILIKE $${paramIndex}`);
        params.push(`%${keyword}%`);
        paramIndex++;
    }

    if (Array.isArray(category_ids) && category_ids.length > 0) {
        whereClauses.push(`p.danh_muc_id = ANY($${paramIndex}::int[])`);
        params.push(category_ids);
        paramIndex++;
    }

    if (Array.isArray(type_ids) && type_ids.length > 0) {
        whereClauses.push(`p.loai_san_pham_id = ANY($${paramIndex}::int[])`);
        params.push(type_ids);
        paramIndex++;
    }

    if (status) {
        whereClauses.push(`p.trang_thai_san_pham = $${paramIndex}`);
        params.push(status);
        paramIndex++;
    }

    if (min_price !== undefined || max_price !== undefined) {
        let priceClause = `EXISTS (SELECT 1 FROM bien_the_san_pham bt WHERE bt.san_pham_id = p.san_pham_id`;
        if (min_price !== undefined) {
            priceClause += ` AND bt.gia >= $${paramIndex}`;
            params.push(min_price);
            paramIndex++;
        }
        if (max_price !== undefined) {
            priceClause += ` AND bt.gia <= $${paramIndex}`;
            params.push(max_price);
            paramIndex++;
        }
        priceClause += `)`;
        whereClauses.push(priceClause);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*)::int AS total_items FROM san_pham p ${whereString}`;
    const countResult = await pool.query(countQuery, params);
    const totalItems = countResult.rows[0].total_items;

    if (totalItems === 0) {
        return { products: [], pagination: { total_items: 0, total_pages: 1, current_page: page, limit } };
    }

    const fetchParams = [...params, limit, offset];
    const fetchQuery = `
        SELECT p.san_pham_id AS product_id, p.ten_san_pham AS product_name, p.mo_ta AS description, p.trang_thai_san_pham AS product_status,
               c.ten_danh_muc AS category_name, pt.ten_loai AS type_name
        FROM san_pham p
        LEFT JOIN danh_muc c ON c.danh_muc_id = p.danh_muc_id
        LEFT JOIN loai_san_pham pt ON pt.loai_san_pham_id = p.loai_san_pham_id
        ${whereString}
        ORDER BY p.san_pham_id DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const productsResult = await pool.query(fetchQuery, fetchParams);
    const productIds = productsResult.rows.map((product) => product.product_id);

    const variantsResult = await pool.query(
        `SELECT pv.san_pham_id AS product_id, pv.bien_the_id AS variant_id, pv.sku, pv.slug, pv.gia AS price, pv.mau_sac AS color, pv.kich_co AS size,
                COALESCE(tk.so_luong_ton, 0) AS stock_quantity,
                COALESCE(json_agg(json_build_object('image_url', vi.duong_dan_anh, 'sort_order', vi.thu_tu_hien_thi) ORDER BY vi.thu_tu_hien_thi ASC, vi.hinh_anh_id ASC) FILTER (WHERE vi.hinh_anh_id IS NOT NULL), '[]') AS images,
                (SELECT row_to_json(d) FROM (
                    SELECT km.khuyen_mai_id AS voucher_id, km.tieu_de AS voucher_name, km.kieu_giam_gia AS type, km.gia_tri AS value
                    FROM khuyen_mai_san_pham kmsp
                    JOIN khuyen_mai km ON km.khuyen_mai_id = kmsp.khuyen_mai_id
                    WHERE (kmsp.bien_the_id = pv.bien_the_id OR kmsp.san_pham_id = pv.san_pham_id)
                      AND km.trang_thai = 'active'
                      AND (km.ngay_bat_dau IS NULL OR km.ngay_bat_dau <= CURRENT_TIMESTAMP)
                      AND (km.ngay_ket_thuc IS NULL OR km.ngay_ket_thuc >= CURRENT_TIMESTAMP)
                    ORDER BY (CASE WHEN kmsp.bien_the_id IS NOT NULL THEN 1 ELSE 2 END) ASC, km.khuyen_mai_id DESC
                    LIMIT 1
                ) d) AS discount
         FROM bien_the_san_pham pv
         LEFT JOIN ton_kho tk ON tk.bien_the_id = pv.bien_the_id
         LEFT JOIN hinh_anh_bien_the vi ON vi.bien_the_id = pv.bien_the_id
         WHERE pv.san_pham_id = ANY($1::int[])
         GROUP BY pv.san_pham_id, pv.bien_the_id, pv.sku, pv.slug, pv.gia, pv.mau_sac, pv.kich_co, tk.so_luong_ton
         ORDER BY pv.san_pham_id DESC, pv.bien_the_id ASC`,
        [productIds]
    );

    const variantsByProductId = new Map();
    for (const row of variantsResult.rows) {
        if (!variantsByProductId.has(row.product_id)) variantsByProductId.set(row.product_id, []);

        const price = Number(row.price);
        let finalPrice = price;
        let discount = row.discount || null;

        if (discount) {
            discount.value = Number(discount.value);
            if (discount.type === 'percent') {
                finalPrice = price - (price * discount.value / 100);
            } else if (discount.type === 'fixed') {
                finalPrice = price - discount.value;
            }
            if (finalPrice < 0) finalPrice = 0;
        }

        variantsByProductId.get(row.product_id).push({
            variant_id: row.variant_id, sku: row.sku, slug: row.slug, 
            price: price, discount: discount, final_price: finalPrice,
            color: row.color, size: row.size, stock_quantity: Number(row.stock_quantity), images: row.images || []
        });
    }

    return {
        products: productsResult.rows.map((product) => ({ ...product, variants: variantsByProductId.get(product.product_id) || [] })),
        pagination: { total_items: totalItems, total_pages: Math.max(1, Math.ceil(totalItems / limit)), current_page: page, limit },
    };
};

module.exports = {
    getAllProductTypes, getAllProducts, getProductDetail, createProduct, updateProduct, deleteProduct, parsePositiveInteger, filterProducts,
};