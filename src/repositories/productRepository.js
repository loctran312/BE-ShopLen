const pool = require('../config/db');

const IMGBB_UPLOAD_ENDPOINT = 'https://api.imgbb.com/1/upload';

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

const getImgbbApiKey = () => process.env.IMGBB_API_KEY;

const isImgBBUrl = (value) => /^https?:\/\/(i\.ibb\.co|ibb\.co|api\.imgbb\.com)\//i.test(value);

const sourceToBase64 = async (source) => {
    const normalizedSource = normalizeText(source);

    if (!normalizedSource) {
        const error = new Error('image_url không được để trống');
        error.statusCode = 400;
        throw error;
    }

    if (normalizedSource.startsWith('data:')) {
        const match = normalizedSource.match(/^data:[^;]+;base64,(.+)$/i);

        if (!match) {
            const error = new Error('image_url dạng data URL không hợp lệ');
            error.statusCode = 400;
            throw error;
        }

        return match[1];
    }

    if (/^https?:\/\//i.test(normalizedSource)) {
        const response = await fetch(normalizedSource);

        if (!response.ok) {
            const error = new Error(`Không thể tải ảnh từ ${normalizedSource}`);
            error.statusCode = 400;
            throw error;
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        return buffer.toString('base64');
    }

    return normalizedSource;
};

const uploadImageToImgBB = async (source, name) => {
    const normalizedSource = normalizeText(source);

    if (!normalizedSource) {
        const error = new Error('image_url không được để trống');
        error.statusCode = 400;
        throw error;
    }

    if (isImgBBUrl(normalizedSource)) {
        return normalizedSource;
    }

    const base64 = await sourceToBase64(normalizedSource);
    const payload = new URLSearchParams({
        key: getImgbbApiKey(),
        image: base64,
    });

    if (name) {
        payload.set('name', name);
    }

    const response = await fetch(IMGBB_UPLOAD_ENDPOINT, {
        method: 'POST',
        body: payload,
    });

    if (!response.ok) {
        const rawError = await response.text().catch(() => '');
        const error = new Error(rawError ? `Không thể tải ảnh lên imgBB: ${rawError}` : 'Không thể tải ảnh lên imgBB');
        error.statusCode = 400;
        throw error;
    }

    const result = await response.json();

    if (!result?.success || !result?.data?.url) {
        const error = new Error(result?.error?.message || 'Không thể tải ảnh lên imgBB');
        error.statusCode = 400;
        throw error;
    }

    return result.data.display_url || result.data.url;
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
        ? `SELECT slug
               FROM bien_the_san_pham
               WHERE (slug = $1 OR slug LIKE $2)
                  AND bien_the_id <> $3`
        : `SELECT slug
               FROM bien_the_san_pham
               WHERE slug = $1 OR slug LIKE $2`;

    const result = await pool.query(query, params);
    const usedSlugs = new Set(result.rows.map((row) => row.slug));

    if (!usedSlugs.has(baseSlug)) {
        return baseSlug;
    }

    let suffix = 2;
    let candidate = `${baseSlug}-${suffix}`;

    while (usedSlugs.has(candidate)) {
        suffix += 1;
        candidate = `${baseSlug}-${suffix}`;
    }

    return candidate;
};

const normalizeImageItems = (images, variantIndex) => {
    if (images === undefined || images === null) {
        return null;
    }

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

        return {
            image_url: imageUrl,
            sort_order: sortOrder,
        };
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
    const stockQuantity = variant.stock_quantity === undefined || variant.stock_quantity === null || variant.stock_quantity === ''
        ? null
        : parseInteger(variant.stock_quantity, 'stock_quantity');
    const slug = normalizeText(variant.slug) || null;
    const images = normalizeImageItems(variant.images, index);

    if (!sku) {
        const error = new Error(`sku ở biến thể ${index + 1} không được để trống`);
        error.statusCode = 400;
        throw error;
    }

    return {
        variant_id: variantId,
        sku,
        price,
        color,
        size,
        stock_quantity: stockQuantity,
        slug,
        images,
    };
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
            `SELECT p.san_pham_id AS product_id,
                    p.ten_san_pham AS product_name,
                    p.trang_thai_san_pham AS product_status,
                    c.ten_danh_muc AS category_name,
                    pt.ten_loai AS type_name
             FROM san_pham p
             LEFT JOIN danh_muc c ON c.danh_muc_id = p.danh_muc_id
             LEFT JOIN loai_san_pham pt ON pt.loai_san_pham_id = p.loai_san_pham_id
             ORDER BY p.san_pham_id DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        ),
    ]);

    const products = productsResult.rows;

    if (products.length === 0) {
        return {
            products: [],
            pagination: {
                total_items: countResult.rows[0].total_items,
                total_pages: Math.max(1, Math.ceil(countResult.rows[0].total_items / limit)),
                current_page: page,
                limit,
            },
        };
    }

    const productIds = products.map((product) => product.product_id);

    const variantsResult = await pool.query(
        `SELECT pv.san_pham_id AS product_id,
                pv.bien_the_id AS variant_id,
                pv.sku,
                pv.slug,
                pv.gia AS price,
                pv.mau_sac AS color,
                pv.kich_co AS size,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'image_url', vi.duong_dan_anh,
                            'sort_order', vi.thu_tu_hien_thi
                        )
                        ORDER BY vi.thu_tu_hien_thi ASC, vi.hinh_anh_id ASC
                    ) FILTER (WHERE vi.hinh_anh_id IS NOT NULL),
                    '[]'
                ) AS images
         FROM bien_the_san_pham pv
         LEFT JOIN hinh_anh_bien_the vi ON vi.bien_the_id = pv.bien_the_id
         WHERE pv.san_pham_id = ANY($1::int[])
         GROUP BY pv.san_pham_id, pv.bien_the_id, pv.sku, pv.slug, pv.gia, pv.mau_sac, pv.kich_co
         ORDER BY pv.san_pham_id DESC, pv.bien_the_id ASC`,
        [productIds]
    );

    const variantsByProductId = new Map();

    for (const row of variantsResult.rows) {
        if (!variantsByProductId.has(row.product_id)) {
            variantsByProductId.set(row.product_id, []);
        }

        variantsByProductId.get(row.product_id).push({
            variant_id: row.variant_id,
            sku: row.sku,
            slug: row.slug,
            price: row.price,
            color: row.color,
            size: row.size,
            images: row.images || [],
        });
    }

    return {
        products: products.map((product) => ({
            product_id: product.product_id,
            product_name: product.product_name,
            category_name: product.category_name,
            type_name: product.type_name,
            product_status: product.product_status,
            variants: variantsByProductId.get(product.product_id) || [],
        })),
        pagination: {
            total_items: countResult.rows[0].total_items,
            total_pages: Math.max(1, Math.ceil(countResult.rows[0].total_items / limit)),
            current_page: page,
            limit,
        },
    };
};

const buildProductDetail = async (productId) => {
    const productResult = await pool.query(
        `SELECT p.san_pham_id AS product_id,
                        p.loai_san_pham_id AS type_id,
                        p.danh_muc_id AS category_id,
                        p.ten_san_pham AS product_name,
                        p.mo_ta AS description,
                        p.trang_thai_san_pham AS product_status,
                        c.ten_danh_muc AS category_name,
                        pt.ten_loai AS type_name
         FROM san_pham p
         LEFT JOIN danh_muc c ON c.danh_muc_id = p.danh_muc_id
         LEFT JOIN loai_san_pham pt ON pt.loai_san_pham_id = p.loai_san_pham_id
         WHERE p.san_pham_id = $1`,
        [productId]
    );

    if (productResult.rows.length === 0) {
        return null;
    }

    const variantResult = await pool.query(
        `SELECT pv.bien_the_id AS variant_id,
                        pv.sku,
                        pv.slug,
                        pv.gia AS price,
                        pv.mau_sac AS color,
                        pv.kich_co AS size,
                        COALESCE(i.so_luong_ton, 0) AS stock_quantity,
                        vi.hinh_anh_id AS image_id,
                        vi.duong_dan_anh AS image_url,
                        vi.thu_tu_hien_thi AS sort_order
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
            variantMap.set(row.variant_id, {
                variant_id: row.variant_id,
                sku: row.sku,
                slug: row.slug,
                price: row.price,
                color: row.color,
                size: row.size,
                stock_quantity: Number(row.stock_quantity || 0),
                images: [],
            });
        }

        if (row.image_id) {
            variantMap.get(row.variant_id).images.push({
                image_id: row.image_id,
                image_url: row.image_url,
                sort_order: row.sort_order,
            });
        }
    }

    const product = productResult.rows[0];

    return {
        product_id: product.product_id,
        type_id: product.type_id,
        category_id: product.category_id,
        product_name: product.product_name,
        description: product.description,
        product_status: product.product_status,
        category_name: product.category_name,
        type_name: product.type_name,
        variants: Array.from(variantMap.values()),
    };
};

const ensureProductDependenciesAreClear = async (client, productId) => {
    const [workshops, cartItems, wishlistItems, workshopVariants] = await Promise.all([
        client.query('SELECT 1 FROM hoi_thao WHERE san_pham_id = $1 LIMIT 1', [productId]),
        client.query(
            `SELECT 1
             FROM gio_hang c
             INNER JOIN bien_the_san_pham pv ON pv.bien_the_id = c.bien_the_id
             WHERE pv.san_pham_id = $1
             LIMIT 1`,
            [productId]
        ),
        client.query(
            `SELECT 1
             FROM danh_sach_yeu_thich w
             INNER JOIN bien_the_san_pham pv ON pv.bien_the_id = w.bien_the_id
             WHERE pv.san_pham_id = $1
             LIMIT 1`,
            [productId]
        ),
        client.query(
            `SELECT 1
             FROM hoi_thao_bien_the wv
             INNER JOIN hoi_thao ws ON ws.hoi_thao_id = wv.hoi_thao_id
             WHERE ws.san_pham_id = $1
             LIMIT 1`,
            [productId]
        ),
    ]);

    return workshops.rows.length > 0
        || cartItems.rows.length > 0
        || wishlistItems.rows.length > 0
        || workshopVariants.rows.length > 0;
};

const uploadVariantImages = async (images, slugPrefix, variantIndex) => {
    if (images === null) {
        return [];
    }

    if (!Array.isArray(images)) {
        return null;
    }

    const uploadedImages = [];

    for (let imageIndex = 0; imageIndex < images.length; imageIndex += 1) {
        const image = images[imageIndex];
        const imageUrl = await uploadImageToImgBB(
            image.image_url,
            `${slugPrefix}-${variantIndex + 1}-${imageIndex + 1}`
        );

        uploadedImages.push({
            image_url: imageUrl,
            sort_order: image.sort_order,
        });
    }

    return uploadedImages;
};

const upsertVariantInventory = async (client, variantId, stockQuantity) => {
    await client.query(
        `INSERT INTO ton_kho (bien_the_id, so_luong_ton)
         VALUES ($1, $2)
         ON CONFLICT (bien_the_id)
         DO UPDATE SET so_luong_ton = EXCLUDED.so_luong_ton`,
        [variantId, stockQuantity]
    );
};

const replaceVariantImages = async (client, variantId, images) => {
    await client.query('DELETE FROM hinh_anh_bien_the WHERE bien_the_id = $1', [variantId]);

    if (!Array.isArray(images) || images.length === 0) {
        return;
    }

    for (const image of images) {
        await client.query(
            `INSERT INTO hinh_anh_bien_the (bien_the_id, duong_dan_anh, thu_tu_hien_thi)
             VALUES ($1, $2, $3)`,
            [variantId, image.image_url, image.sort_order]
        );
    }
};

const getAllProductTypes = async () => pool.query(
    'SELECT loai_san_pham_id AS type_id, ten_loai AS type_name, mo_ta AS description FROM loai_san_pham ORDER BY loai_san_pham_id ASC'
);

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

        const [typeExists, categoryExists] = await Promise.all([
            getProductTypeById(typeId),
            getCategoryById(categoryId),
        ]);

        if (typeExists.rows.length === 0) {
            const error = new Error('type_id không tồn tại');
            error.statusCode = 400;
            throw error;
        }

        if (categoryExists.rows.length === 0) {
            const error = new Error('category_id không tồn tại');
            error.statusCode = 400;
            throw error;
        }

        const seenSkus = new Set();
        const normalizedVariants = payload.variants.map((variant, index) => {
            const normalized = normalizeVariantPayload(variant, index);
            const skuKey = normalized.sku.toLowerCase();

            if (seenSkus.has(skuKey)) {
                const error = new Error(`sku bị trùng trong variants ở vị trí ${index + 1}`);
                error.statusCode = 400;
                throw error;
            }

            seenSkus.add(skuKey);
            return normalized;
        });

        const preparedVariants = [];

        for (let index = 0; index < normalizedVariants.length; index += 1) {
            const variant = normalizedVariants[index];
            const baseSlug = variant.slug || buildVariantBaseSlug(productName, variant);
            const resolvedSlug = await generateUniqueVariantSlug(baseSlug);
            const uploadedImages = await uploadVariantImages(variant.images, resolvedSlug, index);

            preparedVariants.push({
                ...variant,
                slug: resolvedSlug,
                images: uploadedImages,
                stock_quantity: variant.stock_quantity === null ? 0 : variant.stock_quantity,
            });
        }

        await client.query('BEGIN');

        const productResult = await client.query(
            `INSERT INTO san_pham (loai_san_pham_id, danh_muc_id, ten_san_pham, mo_ta, trang_thai_san_pham)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING san_pham_id AS product_id, loai_san_pham_id AS type_id, danh_muc_id AS category_id, ten_san_pham AS product_name, mo_ta AS description, trang_thai_san_pham AS product_status`,
            [typeId, categoryId, productName, description, productStatus]
        );

        const createdProduct = productResult.rows[0];

        for (const variant of preparedVariants) {
            const variantResult = await client.query(
                `INSERT INTO bien_the_san_pham (san_pham_id, sku, slug, gia, mau_sac, kich_co)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING bien_the_id AS variant_id, san_pham_id AS product_id, sku, slug, gia AS price, mau_sac AS color, kich_co AS size`,
                [createdProduct.product_id, variant.sku, variant.slug, variant.price, variant.color, variant.size]
            );

            const createdVariant = variantResult.rows[0];
            await upsertVariantInventory(client, createdVariant.variant_id, variant.stock_quantity);

            if (Array.isArray(variant.images) && variant.images.length > 0) {
                await replaceVariantImages(client, createdVariant.variant_id, variant.images);
            }
        }

        await client.query('COMMIT');

        const product = await buildProductDetail(createdProduct.product_id);
        return product;
    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});

        if (!error.statusCode) {
            error.statusCode = error.code === '23505' ? 400 : 400;
        }

        if (error.code === '23505') {
            error.message = 'SKU hoặc slug đã tồn tại';
        }

        throw error;
    } finally {
        client.release();
    }
};

const updateProduct = async (productId, payload) => {
    const client = await pool.connect();

    try {
        const currentProductResult = await client.query(
            `SELECT san_pham_id AS product_id, loai_san_pham_id AS type_id, danh_muc_id AS category_id, ten_san_pham AS product_name, mo_ta AS description, trang_thai_san_pham AS product_status
             FROM san_pham
             WHERE san_pham_id = $1`,
            [productId]
        );

        if (currentProductResult.rows.length === 0) {
            const error = new Error('Sản phẩm không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        const currentProduct = currentProductResult.rows[0];
        const typeId = payload.type_id === undefined
            ? currentProduct.type_id
            : normalizeCategoryOrTypeId(payload.type_id, 'type_id');
        const categoryId = payload.category_id === undefined
            ? currentProduct.category_id
            : normalizeCategoryOrTypeId(payload.category_id, 'category_id');
        const productName = payload.product_name === undefined
            ? currentProduct.product_name
            : normalizeText(payload.product_name);
        const description = payload.description === undefined
            ? currentProduct.description
            : (normalizeText(payload.description) || null);
        const productStatus = payload.product_status === undefined
            ? currentProduct.product_status
            : validateProductStatus(payload.product_status);

        if (!productName) {
            const error = new Error('product_name không được để trống');
            error.statusCode = 400;
            throw error;
        }

        const [typeExists, categoryExists] = await Promise.all([
            getProductTypeById(typeId),
            getCategoryById(categoryId),
        ]);

        if (typeExists.rows.length === 0) {
            const error = new Error('type_id không tồn tại');
            error.statusCode = 400;
            throw error;
        }

        if (categoryExists.rows.length === 0) {
            const error = new Error('category_id không tồn tại');
            error.statusCode = 400;
            throw error;
        }

        const hasVariantsPayload = Array.isArray(payload.variants);
        let normalizedVariants = [];

        if (hasVariantsPayload) {
            if (payload.variants.length === 0) {
                const error = new Error('variants không được để trống khi gửi cập nhật');
                error.statusCode = 400;
                throw error;
            }

            const seenSkus = new Set();
            normalizedVariants = payload.variants.map((variant, index) => {
                const normalized = normalizeVariantPayload(variant, index);
                const skuKey = normalized.sku.toLowerCase();

                if (seenSkus.has(skuKey)) {
                    const error = new Error(`sku bị trùng trong variants ở vị trí ${index + 1}`);
                    error.statusCode = 400;
                    throw error;
                }

                seenSkus.add(skuKey);
                return normalized;
            });
        }

        const preparedVariants = normalizedVariants.map((variant, index) => ({
            ...variant,
            _uploadIndex: index,
        }));

        await client.query('BEGIN');

        const updatedProductResult = await client.query(
            `UPDATE san_pham
             SET loai_san_pham_id = $1,
                 danh_muc_id = $2,
                 ten_san_pham = $3,
                 mo_ta = $4,
                 trang_thai_san_pham = $5
             WHERE san_pham_id = $6
             RETURNING san_pham_id AS product_id, loai_san_pham_id AS type_id, danh_muc_id AS category_id, ten_san_pham AS product_name, mo_ta AS description, trang_thai_san_pham AS product_status`,
            [typeId, categoryId, productName, description, productStatus, productId]
        );

        if (hasVariantsPayload) {
            for (const variant of preparedVariants) {
                if (variant.variant_id) {
                    const currentVariantResult = await client.query(
                        `SELECT bien_the_id AS variant_id, san_pham_id AS product_id, sku, slug, gia AS price, mau_sac AS color, kich_co AS size
                         FROM bien_the_san_pham
                         WHERE bien_the_id = $1 AND san_pham_id = $2`,
                        [variant.variant_id, productId]
                    );

                    if (currentVariantResult.rows.length === 0) {
                        const error = new Error(`variant_id ${variant.variant_id} không tồn tại trong sản phẩm này`);
                        error.statusCode = 400;
                        throw error;
                    }

                    const nextSlug = variant.slug
                        ? await generateUniqueVariantSlug(variant.slug, variant.variant_id)
                        : currentVariantResult.rows[0].slug;
                    const uploadedImages = variant.images !== null
                        ? await uploadVariantImages(variant.images, nextSlug, variant._uploadIndex)
                        : null;

                    await client.query(
                        `UPDATE bien_the_san_pham
                         SET slug = $1,
                             sku = $2,
                             gia = $3,
                             mau_sac = $4,
                             kich_co = $5
                         WHERE bien_the_id = $6`,
                        [nextSlug, variant.sku, variant.price, variant.color, variant.size, variant.variant_id]
                    );

                    const currentStockResult = await client.query(
                        'SELECT so_luong_ton AS stock_quantity FROM ton_kho WHERE bien_the_id = $1 LIMIT 1',
                        [variant.variant_id]
                    );

                    const nextStockQuantity = variant.stock_quantity === null
                        ? Number(currentStockResult.rows[0]?.stock_quantity || 0)
                        : variant.stock_quantity;

                    await upsertVariantInventory(client, variant.variant_id, nextStockQuantity);

                    if (uploadedImages !== null) {
                        await replaceVariantImages(client, variant.variant_id, uploadedImages);
                    }
                } else {
                    const baseSlug = variant.slug || buildVariantBaseSlug(productName, variant);
                    const nextSlug = await generateUniqueVariantSlug(baseSlug);
                    const uploadedImages = variant.images !== null
                        ? await uploadVariantImages(variant.images, nextSlug, variant._uploadIndex)
                        : null;

                    const insertedVariantResult = await client.query(
                        `INSERT INTO bien_the_san_pham (san_pham_id, sku, slug, gia, mau_sac, kich_co)
                         VALUES ($1, $2, $3, $4, $5, $6)
                         RETURNING bien_the_id AS variant_id, san_pham_id AS product_id, sku, slug, gia AS price, mau_sac AS color, kich_co AS size`,
                        [productId, variant.sku, nextSlug, variant.price, variant.color, variant.size]
                    );

                    const newVariantId = insertedVariantResult.rows[0].variant_id;
                    await upsertVariantInventory(client, newVariantId, variant.stock_quantity === null ? 0 : variant.stock_quantity);

                    if (uploadedImages !== null && uploadedImages.length > 0) {
                        await replaceVariantImages(client, newVariantId, uploadedImages);
                    }
                }
            }
        }

        await client.query('COMMIT');

        return buildProductDetail(updatedProductResult.rows[0].product_id);
    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});

        if (!error.statusCode) {
            error.statusCode = error.code === '23505' ? 400 : 400;
        }

        if (error.code === '23505') {
            error.message = 'SKU hoặc slug đã tồn tại';
        }

        throw error;
    } finally {
        client.release();
    }
};

const deleteProduct = async (productId) => {
    const client = await pool.connect();

    try {
        const currentProductResult = await client.query(
            'SELECT san_pham_id AS product_id FROM san_pham WHERE san_pham_id = $1',
            [productId]
        );

        if (currentProductResult.rows.length === 0) {
            const error = new Error('Sản phẩm không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        const blocked = await ensureProductDependenciesAreClear(client, productId);

        if (blocked) {
            const error = new Error('Không thể xóa sản phẩm đang được sử dụng');
            error.statusCode = 400;
            throw error;
        }

        await client.query('BEGIN');

        const variantResult = await client.query(
            'SELECT bien_the_id AS variant_id FROM bien_the_san_pham WHERE san_pham_id = $1',
            [productId]
        );
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

        if (!error.statusCode) {
            error.statusCode = 400;
        }

        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    getAllProductTypes,
    getAllProducts,
    getProductDetail,
    createProduct,
    updateProduct,
    deleteProduct,
    parsePositiveInteger,
};