const pool = require('../config/db');

const normalizeText = (value) => (value || '').trim();
const normalizeSlug = (value) => normalizeText(value).toLowerCase();

const slugifyText = (value) => normalizeText(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

// Low-level insert helper that accepts either a `client` from `pool.connect()` or the `pool` itself
const insertCategoryClient = async (client, { categoryName, description = null, parentCategoryId = null, slug }) => {
  const result = await client.query(
    `INSERT INTO categories (category_name, description, parent_category_id, slug)
     VALUES ($1, $2, $3, $4)
     RETURNING category_id, category_name, description, parent_category_id, slug`,
    [categoryName, description, parentCategoryId, slug]
  );

  return result.rows[0];
};

// Allocate a slug using an in-memory set of used slugs (used by bulk/tree operations)
const allocateSlugFromUsed = (categoryName, usedSlugs) => {
  const base = slugifyText(categoryName);
  if (!base) throw new Error(`Không thể tạo slug từ category_name "${categoryName}"`);

  let candidate = base;
  let suffix = 2;
  while (usedSlugs.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  usedSlugs.add(candidate);
  return candidate;
};

const parseParentCategoryId = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return NaN;
  }

  return parsed;
};

const getCategoryById = async (categoryId) => pool.query(
  `SELECT c.category_id, c.category_name, c.description, c.parent_category_id, c.slug,
          p.category_name AS parent_category_name
   FROM categories c
   LEFT JOIN categories p ON p.category_id = c.parent_category_id
   WHERE c.category_id = $1`,
  [categoryId]
);

const hasChildCategories = async (categoryId) => pool.query(
  'SELECT 1 FROM categories WHERE parent_category_id = $1 LIMIT 1',
  [categoryId]
);

const hasProductsUsingCategory = async (categoryId) => pool.query(
  'SELECT 1 FROM products WHERE category_id = $1 LIMIT 1',
  [categoryId]
);

const isCategoryNameTaken = async (categoryName, ignoreCategoryId = null) => {
  const query = ignoreCategoryId
    ? `SELECT category_id
       FROM categories
       WHERE LOWER(TRIM(category_name)) = LOWER(TRIM($1))
         AND category_id <> $2
       LIMIT 1`
    : `SELECT category_id
       FROM categories
       WHERE LOWER(TRIM(category_name)) = LOWER(TRIM($1))
       LIMIT 1`;
  const params = ignoreCategoryId ? [categoryName, ignoreCategoryId] : [categoryName];

  const result = await pool.query(query, params);
  return result.rows.length > 0;
};

const isSlugTaken = async (slug, ignoreCategoryId = null) => {
  const query = ignoreCategoryId
    ? 'SELECT category_id FROM categories WHERE slug = $1 AND category_id <> $2 LIMIT 1'
    : 'SELECT category_id FROM categories WHERE slug = $1 LIMIT 1';
  const params = ignoreCategoryId ? [slug, ignoreCategoryId] : [slug];

  const result = await pool.query(query, params);
  return result.rows.length > 0;
};

const generateUniqueSlug = async (categoryName, ignoreCategoryId = null) => {
  const baseSlug = slugifyText(categoryName);

  if (!baseSlug) {
    return '';
  }

  const existingCategories = await pool.query(
    `SELECT slug
     FROM categories
     WHERE (slug = $1 OR slug LIKE $2)
       ${ignoreCategoryId ? 'AND category_id <> $3' : ''}`,
    ignoreCategoryId ? [baseSlug, `${baseSlug}-%`, ignoreCategoryId] : [baseSlug, `${baseSlug}-%`]
  );

  const usedSlugs = new Set(existingCategories.rows.map((row) => row.slug));

  if (!usedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (usedSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
};

const normalizeBulkCategoryItem = (item, index) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new Error(`Mục ở vị trí ${index + 1} không hợp lệ`);
  }

  const categoryName = normalizeText(item.category_name);
  const description = normalizeText(item.description) || null;
  const tempKey = normalizeText(item.temp_key);
  const parentTempKey = normalizeText(item.parent_temp_key) || null;
  const parentCategoryId = parseParentCategoryId(item.parent_category_id);

  if (!tempKey) {
    throw new Error(`temp_key là bắt buộc ở mục ${index + 1}`);
  }

  if (!categoryName) {
    throw new Error(`category_name không được để trống ở mục ${index + 1}`);
  }

  if (parentTempKey && parentCategoryId !== null) {
    throw new Error(`Mục ${index + 1} chỉ được dùng một trong parent_temp_key hoặc parent_category_id`);
  }

  if (Number.isNaN(parentCategoryId)) {
    throw new Error(`parent_category_id không hợp lệ ở mục ${index + 1}`);
  }

  return {
    tempKey,
    categoryName,
    description,
    parentTempKey,
    parentCategoryId,
    rawIndex: index,
  };
};

const createCategoriesBulk = async (req, res) => {
  const client = await pool.connect();

  try {
    const rawItems = req.body;

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({ message: 'Vui lòng gửi một mảng danh mục hợp lệ' });
    }

    const items = rawItems.map((item, index) => normalizeBulkCategoryItem(item, index));
    const tempKeySet = new Set();
    const normalizedNameSet = new Set();
    const normalizedNames = [];

    items.forEach((item, index) => {
      const normalizedTempKey = item.tempKey.toLowerCase();
      if (tempKeySet.has(normalizedTempKey)) {
        throw new Error(`temp_key bị trùng ở mục ${index + 1}`);
      }
      tempKeySet.add(normalizedTempKey);

      const normalizedName = item.categoryName.toLowerCase().trim();
      if (normalizedNameSet.has(normalizedName)) {
        throw new Error(`category_name bị trùng trong mảng ở mục ${index + 1}`);
      }
      normalizedNameSet.add(normalizedName);
      normalizedNames.push(normalizedName);
    });

    const [existingNamesResult, existingSlugsResult] = await Promise.all([
      client.query('SELECT LOWER(TRIM(category_name)) AS normalized_name FROM categories'),
      client.query('SELECT slug FROM categories'),
    ]);

    const existingNames = new Set(existingNamesResult.rows.map((row) => row.normalized_name));
    const usedSlugs = new Set(existingSlugsResult.rows.map((row) => row.slug));

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (existingNames.has(item.categoryName.toLowerCase().trim())) {
        return res.status(400).json({ message: `category_name đã tồn tại ở mục ${index + 1}` });
      }
    }

    const itemByTempKey = new Map(items.map((item) => [item.tempKey.toLowerCase(), item]));
    const createdByTempKey = new Map();
    const visiting = new Set();

    // use shared allocator that updates `usedSlugs`

    const createItem = async (tempKey) => {
      const normalizedTempKey = tempKey.toLowerCase();

      if (createdByTempKey.has(normalizedTempKey)) {
        return createdByTempKey.get(normalizedTempKey);
      }

      const item = itemByTempKey.get(normalizedTempKey);
      if (!item) {
        throw new Error(`Không tìm thấy temp_key ${tempKey}`);
      }

      if (visiting.has(normalizedTempKey)) {
        throw new Error(`Phát hiện vòng lặp tại temp_key ${tempKey}`);
      }

      visiting.add(normalizedTempKey);

      let parentCategoryId = null;

      if (item.parentTempKey) {
        const parentTempKey = item.parentTempKey.toLowerCase();

        if (!itemByTempKey.has(parentTempKey)) {
          throw new Error(`parent_temp_key "${item.parentTempKey}" không tồn tại ở mục ${item.rawIndex + 1}`);
        }

        if (parentTempKey === normalizedTempKey) {
          throw new Error(`parent_temp_key không được trỏ về chính nó ở mục ${item.rawIndex + 1}`);
        }

        const parentItem = await createItem(parentTempKey);
        parentCategoryId = parentItem.category_id;
      } else if (item.parentCategoryId !== null) {
        const parentResult = await client.query('SELECT category_id FROM categories WHERE category_id = $1', [item.parentCategoryId]);

        if (parentResult.rows.length === 0) {
          throw new Error(`Danh mục cha không tồn tại ở mục ${item.rawIndex + 1}`);
        }

        parentCategoryId = item.parentCategoryId;
      }

      const slug = allocateSlugFromUsed(item.categoryName, usedSlugs);

      const createdCategory = await insertCategoryClient(client, {
        categoryName: item.categoryName,
        description: item.description,
        parentCategoryId,
        slug,
      });
      createdByTempKey.set(normalizedTempKey, createdCategory);
      visiting.delete(normalizedTempKey);

      return createdCategory;
    };

    await client.query('BEGIN');

    for (const item of items) {
      await createItem(item.tempKey);
    }

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Tạo danh mục hàng loạt thành công',
      categories: Array.from(createdByTempKey.values()),
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});

    return res.status(400).json({
      message: error.message || 'Không thể tạo danh mục hàng loạt',
    });
  } finally {
    client.release();
  }
};

const isDescendantCategory = async (ancestorCategoryId, targetCategoryId) => {
  const result = await pool.query(
    `WITH RECURSIVE descendants AS ( 
       SELECT category_id
       FROM categories
       WHERE parent_category_id = $1
       UNION ALL
       SELECT c.category_id
       FROM categories c
       INNER JOIN descendants d ON c.parent_category_id = d.category_id
     )
     SELECT category_id
     FROM descendants
     WHERE category_id = $2
     LIMIT 1`,
    [ancestorCategoryId, targetCategoryId]
  );

  return result.rows.length > 0;
};

const getAllCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.category_id, c.category_name, c.description, c.parent_category_id, c.slug,
              p.category_name AS parent_category_name,
              COUNT(ch.category_id)::int AS children_count
       FROM categories c
       LEFT JOIN categories p ON p.category_id = c.parent_category_id
       LEFT JOIN categories ch ON ch.parent_category_id = c.category_id
       GROUP BY c.category_id, c.category_name, c.description, c.parent_category_id, c.slug, p.category_name
       ORDER BY c.parent_category_id NULLS FIRST, c.category_name ASC`
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const getCategoryDetail = async (req, res) => {
  try {
    const { category_id: categoryId } = req.params;
    const parsedCategoryId = Number(categoryId);

    if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
      return res.status(400).json({ message: 'category_id không hợp lệ' });
    }

    const result = await getCategoryById(parsedCategoryId);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Danh mục không tồn tại' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const createCategory = async (req, res) => {
  if (Array.isArray(req.body)) {
    const arr = req.body;
    const hasTempKey = arr.every((it) => it && typeof it === 'object' && Object.prototype.hasOwnProperty.call(it, 'temp_key'));
    if (hasTempKey) return createCategoriesBulk(req, res);
    return createCategoriesTree(req, res);
  }

  if (req.body && typeof req.body === 'object' && Array.isArray(req.body.children)) {
    return createCategoriesTree(req, res);
  }

  try {
    const categoryName = normalizeText(req.body.category_name);
    const description = normalizeText(req.body.description) || null;
    const parentCategoryId = parseParentCategoryId(req.body.parent_category_id);

    if (!categoryName) {
      return res.status(400).json({ message: 'category_name không được để trống' });
    }

    if (await isCategoryNameTaken(categoryName)) {
      return res.status(400).json({ message: 'category_name đã tồn tại' });
    }

    const slug = await generateUniqueSlug(categoryName);

    if (!slug) {
      return res.status(400).json({ message: 'category_name không hợp lệ để tạo slug' });
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return res.status(400).json({ message: 'slug tự sinh không hợp lệ' });
    }

    if (Number.isNaN(parentCategoryId)) {
      return res.status(400).json({ message: 'parent_category_id không hợp lệ' });
    }

    if (parentCategoryId !== null) {
      const parentResult = await getCategoryById(parentCategoryId);

      if (parentResult.rows.length === 0) {
        return res.status(400).json({ message: 'Danh mục cha không tồn tại' });
      }
    }

    const created = await insertCategoryClient(pool, {
      categoryName,
      description,
      parentCategoryId,
      slug,
    });

    return res.status(201).json({ message: 'Tạo danh mục thành công', category: created });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { category_id: categoryId } = req.params;
    const parsedCategoryId = Number(categoryId);

    if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
      return res.status(400).json({ message: 'category_id không hợp lệ' });
    }

    const currentResult = await getCategoryById(parsedCategoryId);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Danh mục không tồn tại' });
    }

    const currentCategory = currentResult.rows[0];
    const categoryName = req.body.category_name !== undefined
      ? normalizeText(req.body.category_name)
      : currentCategory.category_name;
    const description = req.body.description !== undefined
      ? (normalizeText(req.body.description) || null)
      : currentCategory.description;
    const parentCategoryIdRaw = req.body.parent_category_id !== undefined
      ? req.body.parent_category_id
      : currentCategory.parent_category_id;
    const parentCategoryId = parseParentCategoryId(parentCategoryIdRaw);

    if (!categoryName) {
      return res.status(400).json({ message: 'category_name không được để trống' });
    }

    if (await isCategoryNameTaken(categoryName, parsedCategoryId)) {
      return res.status(400).json({ message: 'category_name đã tồn tại' });
    }

    const slug = await generateUniqueSlug(categoryName, parsedCategoryId);

    if (!slug) {
      return res.status(400).json({ message: 'category_name không hợp lệ để tạo slug' });
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return res.status(400).json({ message: 'slug tự sinh không hợp lệ' });
    }

    if (Number.isNaN(parentCategoryId)) {
      return res.status(400).json({ message: 'parent_category_id không hợp lệ' });
    }

    if (parentCategoryId === parsedCategoryId) {
      return res.status(400).json({ message: 'Danh mục cha không được trỏ về chính nó' });
    }

    if (await isSlugTaken(slug, parsedCategoryId)) {
      return res.status(400).json({ message: 'slug đã tồn tại' });
    }

    if (parentCategoryId !== null) {
      const parentResult = await getCategoryById(parentCategoryId);

      if (parentResult.rows.length === 0) {
        return res.status(400).json({ message: 'Danh mục cha không tồn tại' });
      }

      if (await isDescendantCategory(parsedCategoryId, parentCategoryId)) {
        return res.status(400).json({ message: 'Danh mục cha không hợp lệ vì tạo ra vòng lặp' });
      }
    }

    const result = await pool.query(
      `UPDATE categories
       SET category_name = $1,
           description = $2,
           parent_category_id = $3,
           slug = $4
       WHERE category_id = $5
       RETURNING category_id, category_name, description, parent_category_id, slug`,
      [categoryName, description, parentCategoryId, slug, parsedCategoryId]
    );

    return res.json({
      message: 'Cập nhật danh mục thành công',
      category: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { category_id: categoryId } = req.params;
    const parsedCategoryId = Number(categoryId);

    if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
      return res.status(400).json({ message: 'category_id không hợp lệ' });
    }

    const currentResult = await getCategoryById(parsedCategoryId);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Danh mục không tồn tại' });
    }

    const childCategories = await hasChildCategories(parsedCategoryId);
    if (childCategories.rows.length > 0) {
      return res.status(400).json({ message: 'Không thể xóa danh mục đang có danh mục con' });
    }

    const usedByProducts = await hasProductsUsingCategory(parsedCategoryId);
    if (usedByProducts.rows.length > 0) {
      return res.status(400).json({ message: 'Không thể xóa danh mục đang được sử dụng bởi sản phẩm' });
    }

    await pool.query('DELETE FROM categories WHERE category_id = $1', [parsedCategoryId]);

    return res.json({ message: 'Xóa danh mục thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const createCategoriesTree = async (req, res) => {
  const client = await pool.connect();

  try {
    const rawBody = req.body;
    const roots = Array.isArray(rawBody) ? rawBody : [rawBody];

    if (roots.length === 0) {
      return res.status(400).json({ message: 'Payload trống' });
    }

    const [existingNamesResult, existingSlugsResult] = await Promise.all([
      client.query('SELECT LOWER(TRIM(category_name)) AS normalized_name FROM categories'),
      client.query('SELECT slug FROM categories'),
    ]);

    const existingNames = new Set(existingNamesResult.rows.map((r) => r.normalized_name));
    const usedSlugs = new Set(existingSlugsResult.rows.map((r) => r.slug));

    const created = [];

    const insertNode = async (node, parentId = null) => {
      if (!node || typeof node !== 'object') throw new Error('Node không hợp lệ');
      const categoryName = normalizeText(node.category_name);
      const description = normalizeText(node.description) || null;

      if (!categoryName) throw new Error('category_name là bắt buộc');

      const normalized = categoryName.toLowerCase().trim();
      if (existingNames.has(normalized)) {
        throw new Error(`category_name đã tồn tại: ${categoryName}`);
      }

      existingNames.add(normalized);

      const slug = allocateSlugFromUsed(categoryName, usedSlugs);

      const createdNode = await insertCategoryClient(client, {
        categoryName,
        description,
        parentCategoryId: parentId,
        slug,
      });

      created.push(createdNode);

      if (Array.isArray(node.children) && node.children.length > 0) {
        for (const child of node.children) {
          await insertNode(child, createdNode.category_id);
        }
      }

      return createdNode;
    };

    await client.query('BEGIN');

    for (const root of roots) {
      const parentId = root.parent_category_id ? parseParentCategoryId(root.parent_category_id) : null;
      await insertNode(root, parentId);
    }

    await client.query('COMMIT');

    return res.status(201).json({ message: 'Tạo cây danh mục thành công', categories: created });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    return res.status(400).json({ message: error.message || 'Không thể tạo cây danh mục' });
  } finally {
    client.release();
  }
};

module.exports = {
  getAllCategories,
  getCategoryDetail,
  createCategory,
  updateCategory,
  deleteCategory,
};