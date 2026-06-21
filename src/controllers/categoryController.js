const pool = require('../config/db');
const categoryRepository = require('../repositories/categoryRepository');
const { parsePositiveInteger } = require('../utils/pagination');
const { uploadImageToImgBB } = require('../utils/imgbb');

const normalizeText = (value) => (value || '').trim();

const slugifyText = (value) => normalizeText(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const insertCategoryClient = async (client, { categoryName, description = null, parentCategoryId = null, slug, imageUrl = null }) => (
  categoryRepository.insertCategoryClient(client, { categoryName, description, parentCategoryId, slug, imageUrl })
);

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

const getCategoryById = async (categoryId) => categoryRepository.getCategoryById(categoryId);

const hasChildCategories = async (categoryId) => categoryRepository.hasChildCategories(categoryId);

const hasProductsUsingCategory = async (categoryId) => categoryRepository.hasProductsUsingCategory(categoryId);

const isCategoryNameTaken = async (categoryName, ignoreCategoryId = null) => categoryRepository.isCategoryNameTaken(categoryName, ignoreCategoryId);

const isSlugTaken = async (slug, ignoreCategoryId = null) => categoryRepository.isSlugTaken(slug, ignoreCategoryId);

const generateUniqueSlug = async (categoryName, ignoreCategoryId = null) => {
  const baseSlug = slugifyText(categoryName);

  if (!baseSlug) {
    return '';
  }

  const existingCategories = await pool.query(
    `SELECT slug
     FROM danh_muc
     WHERE (slug = $1 OR slug LIKE $2)
       ${ignoreCategoryId ? 'AND danh_muc_id <> $3' : ''}`,
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

  const imageUrl = normalizeText(item.image_url) || null;

  return {
    tempKey,
    categoryName,
    description,
    parentTempKey,
    parentCategoryId,
    imageUrl,
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
    });

    const [existingNamesResult, existingSlugsResult] = await Promise.all([
      categoryRepository.getAllCategoryNormalizedNames(),
      categoryRepository.getAllCategorySlugs(),
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
        const parentResult = await categoryRepository.getCategoryById(item.parentCategoryId);

        if (parentResult.rows.length === 0) {
          throw new Error(`Danh mục cha không tồn tại ở mục ${item.rawIndex + 1}`);
        }

        parentCategoryId = item.parentCategoryId;
      }

      const slug = allocateSlugFromUsed(item.categoryName, usedSlugs);
      const resolvedImageUrl = item.imageUrl ? await uploadImageToImgBB(item.imageUrl, item.categoryName) : null;

      const createdCategory = await insertCategoryClient(client, {
        categoryName: item.categoryName,
        description: item.description,
        parentCategoryId,
        slug,
        imageUrl: resolvedImageUrl,
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
       SELECT danh_muc_id
       FROM danh_muc
       WHERE danh_muc_cha_id = $1
       UNION ALL
       SELECT c.danh_muc_id
       FROM danh_muc c
       INNER JOIN descendants d ON c.danh_muc_cha_id = d.danh_muc_id
     )
     SELECT danh_muc_id AS category_id
     FROM descendants
     WHERE danh_muc_id = $2
     LIMIT 1`,
    [ancestorCategoryId, targetCategoryId]
  );

  return result.rows.length > 0;
};

const formatCategoryTreeNode = (node) => {
  const out = {
    id: node.category_id,
    category_name: node.category_name,
    description: node.description || '',
    image_url: node.image_url || null,
    slug: node.slug || '',
    parent_category_id: node.parent_category_id || null,
    children: [],
  };

  if (Array.isArray(node.children) && node.children.length > 0) {
    out.children = node.children.map(formatCategoryTreeNode);
  }

  return out;
};

const getAllCategories = async (req, res) => {
  try {
    const rawPage = req.query.page !== undefined
      ? req.query.page
      : (req.body && req.body.page !== undefined ? req.body.page : 1);

    const rawLimit = req.query.limit !== undefined
      ? req.query.limit
      : (req.body && req.body.limit !== undefined ? req.body.limit : 10);

    const page = parsePositiveInteger(rawPage, 'page');
    const limit = parsePositiveInteger(rawLimit, 'limit');

    const { categories, pagination } = await categoryRepository.getCategoriesTreePage({ page, limit });

    return res.json({
      success: true,
      message: 'Lấy danh sách danh mục thành công',
      data: {
        categories,
        pagination,
      },
    });
  } catch (error) {
    if (error.message && (error.message === 'page không hợp lệ' || error.message === 'limit không hợp lệ')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ message: error.message || 'Lỗi máy chủ' });
  }
};

const getCategoryDetail = async (req, res) => {
  try {
    const { category_id: categoryId } = req.params;
    const parsedCategoryId = Number(categoryId);

    if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
      return res.status(400).json({ message: 'category_id không hợp lệ' });
    }


    const result = await categoryRepository.getCategorySubtree(parsedCategoryId);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Danh mục không tồn tại' });
    }


    const nodesById = Object.create(null);
    for (const row of result.rows) {
      nodesById[row.category_id] = {
        category_id: row.category_id,
        category_name: row.category_name,
        description: row.description === null ? null : row.description,
        image_url: row.image_url || null,
        slug: row.slug,
        parent_category_id: row.parent_category_id,
        children: [],
      };
    }

    let root = null;

    for (const id in nodesById) {
      const node = nodesById[id];
      if (node.category_id === parsedCategoryId) {
        root = node;
      }

      if (node.parent_category_id && nodesById[node.parent_category_id]) {
        nodesById[node.parent_category_id].children.push(node);
      }
    }

    return res.json(formatCategoryTreeNode(root));
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
    const imageUrl = normalizeText(req.body.image_url) || null;
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

    const resolvedImageUrl = imageUrl ? await uploadImageToImgBB(imageUrl, categoryName) : null;

    const created = await insertCategoryClient(pool, {
      categoryName,
      description,
      parentCategoryId,
      slug,
      imageUrl: resolvedImageUrl,
    });

    return res.status(201).json({ message: 'Tạo danh mục thành công', category: created });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const getPayloadNodeId = (item) => {
  if (item === null || item === undefined) {
    return null;
  }

  const rawId = item.id ?? item.category_id;
  if (rawId === undefined || rawId === null || rawId === '') {
    return null;
  }

  const parsed = Number(rawId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : NaN;
};

const normalizeTreeItem = (item, path, existingMap) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new Error(`${path} không hợp lệ`);
  }

  const categoryId = getPayloadNodeId(item);

  if ((item.id !== undefined || item.category_id !== undefined) && Number.isNaN(categoryId)) {
    throw new Error(`${path}: id không hợp lệ`);
  }

  const hasCategoryName = Object.prototype.hasOwnProperty.call(item, 'category_name');
  const categoryName = hasCategoryName ? normalizeText(item.category_name) : undefined;

  if (categoryId === null && (!categoryName || categoryName === '')) {
    throw new Error(`${path}: category_name không được để trống đối với danh mục mới`);
  }

  const hasDescription = Object.prototype.hasOwnProperty.call(item, 'description');
  const description = hasDescription ? (normalizeText(item.description) || null) : undefined;
  
  const hasImageUrl = Object.prototype.hasOwnProperty.call(item, 'image_url');
  const imageUrl = hasImageUrl ? (normalizeText(item.image_url) || null) : undefined;

  const rawChildren = Array.isArray(item.children) ? item.children : [];
  const children = rawChildren.map((child, index) => 
    normalizeTreeItem(child, `${path}.children[${index}]`, existingMap)
  );

  return {
    ...item,
    categoryId,
    categoryName,
    description,
    imageUrl,
    children,
    path,
  };
};

const collectTreeNodeNames = (node, existingMap, nameSet, path = 'gốc') => {
  const effectiveName = node.categoryName !== undefined
    ? node.categoryName
    : (node.categoryId ? existingMap.get(node.categoryId)?.category_name : undefined);

  if (!effectiveName) {
    throw new Error(`${path}: category_name không được để trống`);
  }

  const normalized = effectiveName.toLowerCase().trim();
  if (nameSet.has(normalized)) {
    throw new Error(`category_name bị trùng trong payload tại ${path}`);
  }

  nameSet.add(normalized);

  node.children.forEach((child, index) => {
    collectTreeNodeNames(child, existingMap, nameSet, `${path}.children[${index}]`);
  });
};

const collectTreeNodeIds = (node, ids) => {
  if (node.categoryId !== null) {
    ids.add(node.categoryId);
  }

  node.children.forEach((child) => collectTreeNodeIds(child, ids));
};

const getSortedDeleteIds = (ids, existingMap) => {
  const depthMap = new Map();

  const computeDepth = (categoryId) => {
    if (depthMap.has(categoryId)) {
      return depthMap.get(categoryId);
    }

    const node = existingMap.get(categoryId);
    if (!node || !node.parent_category_id) {
      depthMap.set(categoryId, 0);
      return 0;
    }

    const depth = computeDepth(node.parent_category_id) + 1;
    depthMap.set(categoryId, depth);
    return depth;
  };

  return Array.from(ids).sort((a, b) => computeDepth(b) - computeDepth(a));
};

const updateCategoryTree = async (req, res, parsedCategoryId, currentCategory) => {
  const client = await pool.connect();

  try {
    const rawPayload = req.body;
    const subtreeResult = await categoryRepository.getCategorySubtree(parsedCategoryId);
    const existingMap = new Map(subtreeResult.rows.map((row) => [row.category_id, row]));

    const rootNode = normalizeTreeItem(rawPayload, 'gốc', existingMap);
    rootNode.categoryId = parsedCategoryId;
    rootNode.categoryName = rootNode.categoryName !== undefined ? rootNode.categoryName : currentCategory.category_name;
    rootNode.description = rootNode.description !== undefined ? rootNode.description : currentCategory.description;
    rootNode.imageUrl = rootNode.imageUrl !== undefined ? rootNode.imageUrl : currentCategory.image_url;

    const [existingNamesResult, existingSlugsResult] = await Promise.all([
      categoryRepository.getAllCategoryNormalizedNames(),
      categoryRepository.getAllCategorySlugs(),
    ]);

    const existingNames = new Set(existingNamesResult.rows.map((row) => row.normalized_name));
    const usedSlugs = new Set(existingSlugsResult.rows.map((row) => row.slug));

    collectTreeNodeNames(rootNode, existingMap, new Set());

    const payloadIds = new Set();
    collectTreeNodeIds(rootNode, payloadIds);
    payloadIds.add(parsedCategoryId);

    const matchingIds = Array.from(payloadIds).filter((id) => !existingMap.has(id));
    if (matchingIds.length > 0) {
      throw new Error(`Danh mục con không tồn tại trong cây hiện tại: ${matchingIds.join(', ')}`);
    }

    const processNode = async (node, parentCategoryId) => {
      const existing = node.categoryId !== null ? existingMap.get(node.categoryId) : null;
      
      const categoryName = node.categoryName !== undefined
        ? node.categoryName
        : (existing ? existing.category_name : undefined);
        
      const description = node.description !== undefined
        ? node.description
        : (existing ? existing.description : null);
        
      const imageUrl = node.imageUrl !== undefined 
        ? node.imageUrl 
        : (existing ? existing.image_url : null);

      if (!categoryName) {
        throw new Error(`${node.path}: category_name không được để trống`);
      }

      if (node.categoryId !== null) {
        if (parentCategoryId === node.categoryId) {
          throw new Error(`${node.path}: Parent category không được trỏ về chính nó`);
        }

        if (parentCategoryId !== null && await isDescendantCategory(node.categoryId, parentCategoryId)) {
          throw new Error(`${node.path}: Parent category không hợp lệ vì tạo ra vòng lặp`);
        }

        if (await isCategoryNameTaken(categoryName, node.categoryId)) {
          throw new Error(`${node.path}: category_name đã tồn tại`);
        }

        const slug = await generateUniqueSlug(categoryName, node.categoryId);
        const finalImageUrl = node.imageUrl !== undefined
          ? (imageUrl ? await uploadImageToImgBB(imageUrl, categoryName) : null)
          : (existing ? existing.image_url : null);

        await categoryRepository.updateCategoryClient(client, {
          categoryId: node.categoryId,
          categoryName,
          description,
          parentCategoryId,
          slug,
          imageUrl: finalImageUrl,
        });
      } else {
        const normalized = categoryName.toLowerCase().trim();
        if (existingNames.has(normalized)) {
          throw new Error(`${node.path}: category_name đã tồn tại`);
        }

        existingNames.add(normalized);
        const slug = allocateSlugFromUsed(categoryName, usedSlugs);
        const finalImageUrl = imageUrl ? await uploadImageToImgBB(imageUrl, categoryName) : null;

        const created = await insertCategoryClient(client, {
          categoryName,
          description,
          parentCategoryId,
          slug,
          imageUrl: finalImageUrl,
        });

        node.categoryId = created.category_id;
      }

      for (const child of node.children) {
        await processNode(child, node.categoryId);
      }
    };

    await client.query('BEGIN');
    await processNode(rootNode, rootNode.categoryId ? (currentCategory.parent_category_id || null) : null);

    const existingIds = new Set(subtreeResult.rows.map((row) => row.category_id));
    const deleteIds = Array.from(existingIds).filter((id) => id !== parsedCategoryId && !payloadIds.has(id));

    if (deleteIds.length > 0) {
      const usedProducts = await categoryRepository.getProductsUsingCategories(deleteIds);
      if (usedProducts.rows.length > 0) {
        throw new Error('Không thể xóa danh mục con đang được sử dụng bởi sản phẩm');
      }

      const deleteOrder = getSortedDeleteIds(deleteIds, existingMap);
      for (const id of deleteOrder) {
        await client.query('DELETE FROM danh_muc WHERE danh_muc_id = $1', [id]);
      }
    }

    await client.query('COMMIT');

    const updatedResult = await categoryRepository.getCategoryById(parsedCategoryId);
    return res.json({
      message: 'Cập nhật danh mục thành công',
      category: updatedResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    return res.status(400).json({ message: error.message || 'Không thể cập nhật cây danh mục' });
  } finally {
    client.release();
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
    const imageUrl = req.body.image_url !== undefined
      ? (normalizeText(req.body.image_url) || null)
      : currentCategory.image_url || null;
    const resolvedImageUrl = req.body.image_url !== undefined
      ? (imageUrl ? await uploadImageToImgBB(imageUrl, categoryName) : null)
      : currentCategory.image_url || null;
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

    if (req.body && typeof req.body === 'object' && Array.isArray(req.body.children)) {
      return updateCategoryTree(req, res, parsedCategoryId, currentCategory);
    }

    const result = await pool.query(
      `UPDATE danh_muc
        SET ten_danh_muc = $1,
          mo_ta = $2,
          hinh_anh = $3,
          danh_muc_cha_id = $4,
          slug = $5
          WHERE danh_muc_id = $6
          RETURNING danh_muc_id, ten_danh_muc, mo_ta, hinh_anh, danh_muc_cha_id, slug`,
      [categoryName, description, resolvedImageUrl, parentCategoryId, slug, parsedCategoryId]
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

    await pool.query('DELETE FROM danh_muc WHERE danh_muc_id = $1', [parsedCategoryId]);

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
      categoryRepository.getAllCategoryNormalizedNames(),
      categoryRepository.getAllCategorySlugs(),
    ]);

    const existingNames = new Set(existingNamesResult.rows.map((r) => r.normalized_name));
    const usedSlugs = new Set(existingSlugsResult.rows.map((r) => r.slug));

    const created = [];

    const insertNode = async (node, parentId = null) => {
      if (!node || typeof node !== 'object') throw new Error('Node không hợp lệ');
      const categoryName = normalizeText(node.category_name);
      const description = normalizeText(node.description) || null;
      const imageUrl = normalizeText(node.image_url) || null;

      if (!categoryName) throw new Error('category_name là bắt buộc');

      const normalized = categoryName.toLowerCase().trim();
      if (existingNames.has(normalized)) {
        throw new Error(`category_name đã tồn tại: ${categoryName}`);
      }

      existingNames.add(normalized);

      const slug = allocateSlugFromUsed(categoryName, usedSlugs);
      const resolvedImageUrl = imageUrl ? await uploadImageToImgBB(imageUrl, categoryName) : null;

      const createdNode = await insertCategoryClient(client, {
        categoryName,
        description,
        parentCategoryId: parentId,
        slug,
        imageUrl: resolvedImageUrl,
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

const filterCategoriesAdmin = async (req, res) => {
    try {
        const page = parsePositiveInteger(req.body.page || 1, 'page');
        const limit = parsePositiveInteger(req.body.limit || 10, 'limit');
        
        let parentCategoryId = req.body.parent_category_id;
        if (parentCategoryId !== undefined && parentCategoryId !== null) {
            parentCategoryId = Number(parentCategoryId);
        }

        const result = await categoryRepository.filterCategoriesAdmin({
            page, limit,
            keyword: req.body.keyword,
            parent_category_id: parentCategoryId
        });

        const flatCategories = result.categories;
        const categoryMap = {};
        const tree = [];

        flatCategories.forEach(cat => {
            categoryMap[cat.category_id] = {
                id: cat.category_id,
                category_name: cat.category_name,
                description: cat.description || '',
                image_url: cat.image_url || null,
                slug: cat.slug || '',
                parent_category_id: cat.parent_category_id,
                children: []
            };
        });

        flatCategories.forEach(cat => {
            if (cat.parent_category_id && !categoryMap[cat.parent_category_id]) {
                categoryMap[cat.parent_category_id] = {
                    id: cat.parent_category_id,
                    category_name: cat.parent_category_name || 'Danh mục cha',
                    description: '',
                    image_url: null,
                    slug: '',
                    parent_category_id: null,
                    children: []
                };
            }
        });

        Object.values(categoryMap).forEach(node => {
            if (node.parent_category_id && categoryMap[node.parent_category_id]) {
                categoryMap[node.parent_category_id].children.push(node);
            } else {
                tree.push(node);
            }
        });

        result.categories = tree;

        return res.json({ success: true, message: 'Lọc danh mục thành công', data: result });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Lỗi máy chủ' });
    }
};

module.exports = {
  getAllCategories,
  getCategoryDetail,
  createCategory,
  updateCategory,
  deleteCategory,
  filterCategoriesAdmin,
};