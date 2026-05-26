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
        throw new Error(`${fieldName} không hợp lệ`);
    }

    return parsed;
};

const parsePositiveInteger = (value, fieldName) => {
    const parsed = parseInteger(value, fieldName);

    if (parsed <= 0) {
        throw new Error(`${fieldName} không hợp lệ`);
    }

    return parsed;
};

const parsePrice = (value) => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error('price không hợp lệ');
    }

    return parsed;
};

const getImgbbApiKey = () => process.env.IMGBB_API_KEY;

const isImgBBUrl = (value) => /^https?:\/\/(i\.ibb\.co|ibb\.co|api\.imgbb\.com)\//i.test(value);

const sourceToBase64 = async (source) => {
    const normalizedSource = normalizeText(source);

    if (!normalizedSource) {
        throw new Error('image_url không được để trống');
    }

    if (normalizedSource.startsWith('data:')) {
        const match = normalizedSource.match(/^data:[^;]+;base64,(.+)$/i);

        if (!match) {
            throw new Error('image_url dạng data URL không hợp lệ');
        }

        return match[1];
    }

    if (/^https?:\/\//i.test(normalizedSource)) {
        const response = await fetch(normalizedSource);

        if (!response.ok) {
            throw new Error(`Không thể tải ảnh từ ${normalizedSource}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        return buffer.toString('base64');
    }

    return normalizedSource;
};

const uploadImageToImgBB = async (source, name) => {
    const normalizedSource = normalizeText(source);

    if (!normalizedSource) {
        throw new Error('image_url không được để trống');
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
        throw new Error(rawError ? `Không thể tải ảnh lên imgBB: ${rawError}` : 'Không thể tải ảnh lên imgBB');
    }

    const result = await response.json();

    if (!result?.success || !result?.data?.url) {
        throw new Error(result?.error?.message || 'Không thể tải ảnh lên imgBB');
    }

    return result.data.display_url || result.data.url;
};

const normalizeCategoryOrTypeId = (value, fieldName) => {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`${fieldName} không hợp lệ`);
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
        throw new Error('Không thể tạo slug cho biến thể');
    }

    return slug;
};

const generateUniqueVariantSlug = async (baseSlug, ignoreVariantId = null) => {
    if (!baseSlug) {
        throw new Error('slug không hợp lệ');
    }

    const params = ignoreVariantId
        ? [baseSlug, `${baseSlug}-%`, ignoreVariantId]
        : [baseSlug, `${baseSlug}-%`];

    const query = ignoreVariantId
        ? `SELECT slug
             FROM product_variants
             WHERE (slug = $1 OR slug LIKE $2)
                 AND variant_id <> $3`
        : `SELECT slug
             FROM product_variants
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
        throw new Error(`images ở biến thể ${variantIndex + 1} phải là mảng`);
    }

    return images.map((image, imageIndex) => {
        if (!isObject(image)) {
            throw new Error(`Ảnh ở biến thể ${variantIndex + 1}, vị trí ${imageIndex + 1} không hợp lệ`);
        }

        const imageUrl = normalizeText(image.image_url);

        if (!imageUrl) {
            throw new Error(`image_url ở biến thể ${variantIndex + 1}, vị trí ${imageIndex + 1} không được để trống`);
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
        throw new Error(`Biến thể ở vị trí ${index + 1} không hợp lệ`);
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
        throw new Error(`sku ở biến thể ${index + 1} không được để trống`);
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

const getCategoryById = (categoryId) => pool.query(
    'SELECT category_id FROM categories WHERE category_id = $1 LIMIT 1',
    [categoryId]
);

const getProductTypeById = (typeId) => pool.query(
    'SELECT type_id FROM product_types WHERE type_id = $1 LIMIT 1',
    [typeId]
);

const buildProductsList = async ({ page, limit }) => {
    const offset = (page - 1) * limit;

    const [countResult, productsResult] = await Promise.all([
        pool.query('SELECT COUNT(*)::int AS total_items FROM products'),
        pool.query(
            `SELECT p.product_id,
                    p.product_name,
                    p.product_status,
                    c.category_name,
                    pt.type_name
             FROM products p
             LEFT JOIN categories c ON c.category_id = p.category_id
             LEFT JOIN product_types pt ON pt.type_id = p.type_id
             ORDER BY p.product_id DESC
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
        `SELECT pv.product_id,
                pv.variant_id,
                pv.sku,
                pv.slug,
                pv.price,
                pv.color,
                pv.size,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'image_url', vi.image_url,
                            'sort_order', vi.sort_order
                        )
                        ORDER BY vi.sort_order ASC, vi.image_id ASC
                    ) FILTER (WHERE vi.image_id IS NOT NULL),
                    '[]'
                ) AS images
         FROM product_variants pv
         LEFT JOIN variant_images vi ON vi.variant_id = pv.variant_id
         WHERE pv.product_id = ANY($1::int[])
         GROUP BY pv.product_id, pv.variant_id, pv.sku, pv.slug, pv.price, pv.color, pv.size
         ORDER BY pv.product_id DESC, pv.variant_id ASC`,
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
        `SELECT p.product_id,
                        p.type_id,
                        p.category_id,
                        p.product_name,
                        p.description,
                        p.product_status,
                        c.category_name,
                        pt.type_name
         FROM products p
         LEFT JOIN categories c ON c.category_id = p.category_id
         LEFT JOIN product_types pt ON pt.type_id = p.type_id
         WHERE p.product_id = $1`,
        [productId]
    );

    if (productResult.rows.length === 0) {
        return null;
    }

    const variantResult = await pool.query(
        `SELECT pv.variant_id,
                        pv.sku,
                        pv.slug,
                        pv.price,
                        pv.color,
                        pv.size,
                        COALESCE(i.stock_quantity, 0) AS stock_quantity,
                        vi.image_id,
                        vi.image_url,
                        vi.sort_order
         FROM product_variants pv
         LEFT JOIN inventory i ON i.variant_id = pv.variant_id
         LEFT JOIN variant_images vi ON vi.variant_id = pv.variant_id
         WHERE pv.product_id = $1
         ORDER BY pv.variant_id ASC, vi.sort_order ASC, vi.image_id ASC`,
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
        client.query('SELECT 1 FROM workshops WHERE product_id = $1 LIMIT 1', [productId]),
        client.query(
            `SELECT 1
             FROM cart c
             INNER JOIN product_variants pv ON pv.variant_id = c.variant_id
             WHERE pv.product_id = $1
             LIMIT 1`,
            [productId]
        ),
        client.query(
            `SELECT 1
             FROM wishlist w
             INNER JOIN product_variants pv ON pv.variant_id = w.variant_id
             WHERE pv.product_id = $1
             LIMIT 1`,
            [productId]
        ),
        client.query(
            `SELECT 1
             FROM workshop_variants wv
             INNER JOIN workshops ws ON ws.workshop_id = wv.workshop_id
             WHERE ws.product_id = $1
             LIMIT 1`,
            [productId]
        ),
    ]);

    return workshops.rows.length > 0
        || cartItems.rows.length > 0
        || wishlistItems.rows.length > 0
        || workshopVariants.rows.length > 0;
};

const getAllProductTypes = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM product_types ORDER BY type_id ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi máy chủ' });
    }
};

const getAllProducts = async (req, res) => {
    try {
        const page = req.query.page === undefined ? 1 : parsePositiveInteger(req.query.page, 'page');
        const limit = req.query.limit === undefined ? 10 : parsePositiveInteger(req.query.limit, 'limit');
        const { products, pagination } = await buildProductsList({ page, limit });

        return res.json({
            success: true,
            message: 'Lấy danh sách sản phẩm thành công',
            data: {
                products,
                pagination,
            },
        });
    } catch (error) {
        if (error.message && (error.message === 'page không hợp lệ' || error.message === 'limit không hợp lệ')) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ',
        });
    }
};

const getProductDetail = async (req, res) => {
    try {
        const productId = parseInteger(req.params.product_id, 'product_id');
        const product = await buildProductDetail(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Sản phẩm không tồn tại',
            });
        }

        return res.json({
            success: true,
            message: 'Lấy chi tiết sản phẩm thành công',
            data: {
                product,
            },
        });
    } catch (error) {
        if (error.message && error.message.endsWith('không hợp lệ')) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi máy chủ',
        });
    }
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
        `INSERT INTO inventory (variant_id, stock_quantity)
         VALUES ($1, $2)
         ON CONFLICT (variant_id)
         DO UPDATE SET stock_quantity = EXCLUDED.stock_quantity`,
        [variantId, stockQuantity]
    );
};

const replaceVariantImages = async (client, variantId, images) => {
    await client.query('DELETE FROM variant_images WHERE variant_id = $1', [variantId]);

    if (!Array.isArray(images) || images.length === 0) {
        return;
    }

    for (const image of images) {
        await client.query(
            `INSERT INTO variant_images (variant_id, image_url, sort_order)
             VALUES ($1, $2, $3)`,
            [variantId, image.image_url, image.sort_order]
        );
    }
};

const createProduct = async (req, res) => {
    const client = await pool.connect();

    try {
        const typeId = normalizeCategoryOrTypeId(req.body.type_id, 'type_id');
        const categoryId = normalizeCategoryOrTypeId(req.body.category_id, 'category_id');
        const productName = normalizeText(req.body.product_name);
        const description = normalizeText(req.body.description) || null;
        const productStatus = validateProductStatus(req.body.product_status);

        if (!productName) {
            return res.status(400).json({
                success: false,
                message: 'product_name không được để trống',
            });
        }

        if (!Array.isArray(req.body.variants) || req.body.variants.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'variants phải là một mảng không rỗng',
            });
        }

        const [typeExists, categoryExists] = await Promise.all([
            getProductTypeById(typeId),
            getCategoryById(categoryId),
        ]);

        if (typeExists.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'type_id không tồn tại',
            });
        }

        if (categoryExists.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'category_id không tồn tại',
            });
        }

        const seenSkus = new Set();
        const normalizedVariants = req.body.variants.map((variant, index) => {
            const normalized = normalizeVariantPayload(variant, index);
            const skuKey = normalized.sku.toLowerCase();

            if (seenSkus.has(skuKey)) {
                throw new Error(`sku bị trùng trong variants ở vị trí ${index + 1}`);
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
            `INSERT INTO products (type_id, category_id, product_name, description, product_status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING product_id, type_id, category_id, product_name, description, product_status`,
            [typeId, categoryId, productName, description, productStatus]
        );

        const createdProduct = productResult.rows[0];

        for (const variant of preparedVariants) {
            const variantResult = await client.query(
                `INSERT INTO product_variants (product_id, sku, slug, price, color, size)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING variant_id, product_id, sku, slug, price, color, size`,
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

        return res.status(201).json({
            success: true,
            message: 'Tạo sản phẩm thành công',
            data: {
                product,
            },
        });
    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});

        return res.status(400).json({
            success: false,
            message: error.code === '23505'
                ? 'SKU hoặc slug đã tồn tại'
                : error.message || 'Không thể tạo sản phẩm',
        });
    } finally {
        client.release();
    }
};

const updateProduct = async (req, res) => {
    const client = await pool.connect();

    try {
        const productId = parseInteger(req.params.product_id, 'product_id');
        const currentProductResult = await client.query(
            `SELECT product_id, type_id, category_id, product_name, description, product_status
             FROM products
             WHERE product_id = $1`,
            [productId]
        );

        if (currentProductResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sản phẩm không tồn tại',
            });
        }

        const currentProduct = currentProductResult.rows[0];
        const typeId = req.body.type_id === undefined
            ? currentProduct.type_id
            : normalizeCategoryOrTypeId(req.body.type_id, 'type_id');
        const categoryId = req.body.category_id === undefined
            ? currentProduct.category_id
            : normalizeCategoryOrTypeId(req.body.category_id, 'category_id');
        const productName = req.body.product_name === undefined
            ? currentProduct.product_name
            : normalizeText(req.body.product_name);
        const description = req.body.description === undefined
            ? currentProduct.description
            : (normalizeText(req.body.description) || null);
        const productStatus = req.body.product_status === undefined
            ? currentProduct.product_status
            : validateProductStatus(req.body.product_status);

        if (!productName) {
            return res.status(400).json({
                success: false,
                message: 'product_name không được để trống',
            });
        }

        const [typeExists, categoryExists] = await Promise.all([
            getProductTypeById(typeId),
            getCategoryById(categoryId),
        ]);

        if (typeExists.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'type_id không tồn tại',
            });
        }

        if (categoryExists.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'category_id không tồn tại',
            });
        }

        const hasVariantsPayload = Array.isArray(req.body.variants);
        let normalizedVariants = [];

        if (hasVariantsPayload) {
            if (req.body.variants.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'variants không được để trống khi gửi cập nhật',
                });
            }

            const seenSkus = new Set();
            normalizedVariants = req.body.variants.map((variant, index) => {
                const normalized = normalizeVariantPayload(variant, index);
                const skuKey = normalized.sku.toLowerCase();

                if (seenSkus.has(skuKey)) {
                    throw new Error(`sku bị trùng trong variants ở vị trí ${index + 1}`);
                }

                seenSkus.add(skuKey);
                return normalized;
            });
        }

        const preparedVariants = [];

        for (let index = 0; index < normalizedVariants.length; index += 1) {
            const variant = normalizedVariants[index];

            preparedVariants.push({
                ...variant,
                _uploadIndex: index,
            });
        }

        await client.query('BEGIN');

        const updatedProductResult = await client.query(
            `UPDATE products
             SET type_id = $1,
                     category_id = $2,
                     product_name = $3,
                     description = $4,
                     product_status = $5
             WHERE product_id = $6
             RETURNING product_id, type_id, category_id, product_name, description, product_status`,
            [typeId, categoryId, productName, description, productStatus, productId]
        );

        if (hasVariantsPayload) {
            for (const variant of preparedVariants) {
                if (variant.variant_id) {
                    const currentVariantResult = await client.query(
                        `SELECT variant_id, product_id, sku, slug, price, color, size
                         FROM product_variants
                         WHERE variant_id = $1 AND product_id = $2`,
                        [variant.variant_id, productId]
                    );

                    if (currentVariantResult.rows.length === 0) {
                        throw new Error(`variant_id ${variant.variant_id} không tồn tại trong sản phẩm này`);
                    }

                const nextSlug = variant.slug
                    ? await generateUniqueVariantSlug(variant.slug, variant.variant_id)
                    : currentVariantResult.rows[0].slug;
                const uploadedImages = variant.images !== null
                    ? await uploadVariantImages(variant.images, nextSlug, variant._uploadIndex)
                    : null;

                    await client.query(
                        `UPDATE product_variants
                         SET slug = $1,
                                 sku = $2,
                                 price = $3,
                                 color = $4,
                                 size = $5
                         WHERE variant_id = $6`,
                        [nextSlug, variant.sku, variant.price, variant.color, variant.size, variant.variant_id]
                    );

                    const currentStockResult = await client.query(
                        'SELECT stock_quantity FROM inventory WHERE variant_id = $1 LIMIT 1',
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
                        `INSERT INTO product_variants (product_id, sku, slug, price, color, size)
                         VALUES ($1, $2, $3, $4, $5, $6)
                         RETURNING variant_id, product_id, sku, slug, price, color, size`,
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

        const product = await buildProductDetail(updatedProductResult.rows[0].product_id);

        return res.json({
            success: true,
            message: 'Cập nhật sản phẩm thành công',
            data: {
                product,
            },
        });
    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});

        return res.status(400).json({
            success: false,
            message: error.code === '23505'
                ? 'SKU hoặc slug đã tồn tại'
                : error.message || 'Không thể cập nhật sản phẩm',
        });
    } finally {
        client.release();
    }
};

const deleteProduct = async (req, res) => {
    const client = await pool.connect();

    try {
        const productId = parseInteger(req.params.product_id, 'product_id');

        const currentProductResult = await client.query(
            'SELECT product_id FROM products WHERE product_id = $1',
            [productId]
        );

        if (currentProductResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sản phẩm không tồn tại',
            });
        }

        const blocked = await ensureProductDependenciesAreClear(client, productId);

        if (blocked) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa sản phẩm đang được sử dụng',
            });
        }

        await client.query('BEGIN');

        const variantResult = await client.query(
            'SELECT variant_id FROM product_variants WHERE product_id = $1',
            [productId]
        );
        const variantIds = variantResult.rows.map((row) => row.variant_id);

        if (variantIds.length > 0) {
            await client.query('DELETE FROM variant_images WHERE variant_id = ANY($1::int[])', [variantIds]);
            await client.query('DELETE FROM inventory WHERE variant_id = ANY($1::int[])', [variantIds]);
            await client.query('DELETE FROM voucher_products WHERE product_id = $1 OR variant_id = ANY($2::int[])', [productId, variantIds]);
            await client.query('DELETE FROM promotion_products WHERE product_id = $1 OR variant_id = ANY($2::int[])', [productId, variantIds]);
        } else {
            await client.query('DELETE FROM voucher_products WHERE product_id = $1', [productId]);
            await client.query('DELETE FROM promotion_products WHERE product_id = $1', [productId]);
        }

        await client.query('DELETE FROM wishlist_notifications WHERE product_id = $1', [productId]);
        await client.query('DELETE FROM product_variants WHERE product_id = $1', [productId]);
        await client.query('DELETE FROM products WHERE product_id = $1', [productId]);

        await client.query('COMMIT');

        return res.json({
            success: true,
            message: 'Xóa sản phẩm thành công',
        });
    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});

        return res.status(400).json({
            success: false,
            message: error.message || 'Không thể xóa sản phẩm',
        });
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
};