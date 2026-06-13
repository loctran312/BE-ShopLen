const pool = require('../config/db');

const insertCategoryClient = async (client, { categoryName, description = null, parentCategoryId = null, slug, imageUrl = null }) => {
  const result = await client.query(
    `INSERT INTO danh_muc (ten_danh_muc, mo_ta, danh_muc_cha_id, slug, hinh_anh)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING danh_muc_id AS category_id,
               ten_danh_muc AS category_name,
               mo_ta AS description,
               hinh_anh AS image_url,
               danh_muc_cha_id AS parent_category_id,
               slug`,
    [categoryName, description, parentCategoryId, slug, imageUrl]
  );

  return result.rows[0];
};

const updateCategoryClient = async (client, { categoryId, categoryName, description = null, parentCategoryId = null, slug, imageUrl = null }) => {
  const result = await client.query(
    `UPDATE danh_muc
     SET ten_danh_muc = $1,
         mo_ta = $2,
         danh_muc_cha_id = $3,
         slug = $4,
         hinh_anh = $5
     WHERE danh_muc_id = $6
     RETURNING danh_muc_id AS category_id,
               ten_danh_muc AS category_name,
               mo_ta AS description,
               hinh_anh AS image_url,
               danh_muc_cha_id AS parent_category_id,
               slug`,
    [categoryName, description, parentCategoryId, slug, imageUrl, categoryId]
  );

  return result.rows[0];
};

const deleteCategoriesByIdsClient = async (client, categoryIds) => client.query(
  'DELETE FROM danh_muc WHERE danh_muc_id = ANY($1)',
  [categoryIds]
);

const getCategoryById = async (categoryId) => pool.query(
  `SELECT c.danh_muc_id AS category_id,
          c.ten_danh_muc AS category_name,
          c.mo_ta AS description,
          c.hinh_anh AS image_url,
          c.danh_muc_cha_id AS parent_category_id,
          c.slug,
          p.ten_danh_muc AS parent_category_name
   FROM danh_muc c
   LEFT JOIN danh_muc p ON p.danh_muc_id = c.danh_muc_cha_id
   WHERE c.danh_muc_id = $1`,
  [categoryId]
);

const hasChildCategories = async (categoryId) => pool.query(
  'SELECT 1 FROM danh_muc WHERE danh_muc_cha_id = $1 LIMIT 1',
  [categoryId]
);

const hasProductsUsingCategory = async (categoryId) => pool.query(
  'SELECT 1 FROM san_pham WHERE danh_muc_id = $1 LIMIT 1',
  [categoryId]
);

const isCategoryNameTaken = async (categoryName, ignoreCategoryId = null) => {
  const query = ignoreCategoryId
     ? `SELECT danh_muc_id
       FROM danh_muc
       WHERE LOWER(TRIM(ten_danh_muc)) = LOWER(TRIM($1))
         AND danh_muc_id <> $2
       LIMIT 1`
     : `SELECT danh_muc_id
       FROM danh_muc
       WHERE LOWER(TRIM(ten_danh_muc)) = LOWER(TRIM($1))
       LIMIT 1`;
  const params = ignoreCategoryId ? [categoryName, ignoreCategoryId] : [categoryName];

  const result = await pool.query(query, params);
  return result.rows.length > 0;
};

const isSlugTaken = async (slug, ignoreCategoryId = null) => {
  const query = ignoreCategoryId
    ? 'SELECT danh_muc_id FROM danh_muc WHERE slug = $1 AND danh_muc_id <> $2 LIMIT 1'
    : 'SELECT danh_muc_id FROM danh_muc WHERE slug = $1 LIMIT 1';
  const params = ignoreCategoryId ? [slug, ignoreCategoryId] : [slug];

  const result = await pool.query(query, params);
  return result.rows.length > 0;
};

const getCategoryChildrenByParentId = async (parentCategoryId) => pool.query(
  `SELECT danh_muc_id AS category_id,
          ten_danh_muc AS category_name,
          mo_ta AS description,
          hinh_anh AS image_url,
          danh_muc_cha_id AS parent_category_id,
          slug
   FROM danh_muc
   WHERE danh_muc_cha_id = $1
   ORDER BY danh_muc_id ASC`,
  [parentCategoryId]
);

const getProductsUsingCategories = async (categoryIds) => pool.query(
  'SELECT DISTINCT danh_muc_id FROM san_pham WHERE danh_muc_id = ANY($1)',
  [categoryIds]
);

const getAllCategoryNormalizedNames = async () => pool.query(
  'SELECT LOWER(TRIM(ten_danh_muc)) AS normalized_name FROM danh_muc'
);

const getAllCategorySlugs = async () => pool.query('SELECT slug FROM danh_muc');

const getCategoryChildrenByParentId = async (parentCategoryId) => pool.query(
  `SELECT danh_muc_id AS category_id,
          ten_danh_muc AS category_name,
          mo_ta AS description,
          hinh_anh AS image_url,
          danh_muc_cha_id AS parent_category_id,
          slug
   FROM danh_muc
   WHERE danh_muc_cha_id = $1
   ORDER BY danh_muc_id ASC`,
  [parentCategoryId]
);

const getProductsUsingCategories = async (categoryIds) => pool.query(
  'SELECT DISTINCT danh_muc_id FROM san_pham WHERE danh_muc_id = ANY($1)',
  [categoryIds]
);

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

const getAllCategories = async () => pool.query(
  `SELECT danh_muc_id AS category_id,
          ten_danh_muc AS category_name,
          mo_ta AS description,
          hinh_anh AS image_url,
          danh_muc_cha_id AS parent_category_id,
          slug
   FROM danh_muc
   ORDER BY ten_danh_muc ASC`
);

const getCategoriesList = async ({ page, limit }) => {
  const offset = (page - 1) * limit;

  const [countResult, categoriesResult] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS total_items FROM danh_muc'),
    pool.query(
      `SELECT danh_muc_id AS category_id,
              ten_danh_muc AS category_name,
              mo_ta AS description,
              hinh_anh AS image_url,
              danh_muc_cha_id AS parent_category_id,
              slug
       FROM danh_muc
       ORDER BY ten_danh_muc ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
  ]);

  const totalItems = countResult.rows[0].total_items;

  return {
    categories: categoriesResult.rows,
    pagination: {
      total_items: totalItems,
      total_pages: Math.max(1, Math.ceil(totalItems / limit)),
      current_page: page,
      limit,
    },
  };
};

const getCategoriesTreePage = async ({ page, limit }) => {
  const offset = (page - 1) * limit;

  const [countResult, rootsResult] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS total_items FROM danh_muc WHERE danh_muc_cha_id IS NULL'),
    pool.query(
      `SELECT danh_muc_id AS category_id,
              ten_danh_muc AS category_name,
              mo_ta AS description,
              hinh_anh AS image_url,
              slug
       FROM danh_muc
       WHERE danh_muc_cha_id IS NULL
       ORDER BY ten_danh_muc ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
  ]);

  const totalItems = countResult.rows[0].total_items;

  const trees = [];

  for (const rootRow of rootsResult.rows) {
    const subtreeResult = await getCategorySubtree(rootRow.category_id);

    const nodesById = Object.create(null);

    for (const row of subtreeResult.rows) {
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

    // ensure root exists
    if (!nodesById[rootRow.category_id]) {
      nodesById[rootRow.category_id] = {
        category_id: rootRow.category_id,
        category_name: rootRow.category_name,
        description: rootRow.description === null ? null : rootRow.description,
        image_url: rootRow.image_url || null,
        slug: rootRow.slug,
        parent_category_id: null,
        children: [],
      };
    }

    for (const id in nodesById) {
      const node = nodesById[id];
      if (node.parent_category_id && nodesById[node.parent_category_id]) {
        nodesById[node.parent_category_id].children.push(node);
      }
    }

    const buildOutputNode = (n) => ({
      id: n.category_id,
      category_name: n.category_name,
      description: n.description === null ? '' : n.description,
      image_url: n.image_url || null,
      slug: n.slug || '',
      children: n.children.map(buildOutputNode),
    });

    trees.push(buildOutputNode(nodesById[rootRow.category_id]));
  }

  return {
    categories: trees,
    pagination: {
      total_items: totalItems,
      total_pages: Math.max(1, Math.ceil(totalItems / limit)),
      current_page: page,
      limit,
    },
  };
};

const getCategorySubtree = async (categoryId) => pool.query(
  `WITH RECURSIVE subtree AS (
     SELECT danh_muc_id AS category_id,
            ten_danh_muc AS category_name,
            mo_ta AS description,
            hinh_anh AS image_url,
            danh_muc_cha_id AS parent_category_id,
            slug
     FROM danh_muc
     WHERE danh_muc_id = $1
   UNION ALL
     SELECT c.danh_muc_id AS category_id,
            c.ten_danh_muc AS category_name,
            c.mo_ta AS description,
            c.hinh_anh AS image_url,
            c.danh_muc_cha_id AS parent_category_id,
            c.slug
     FROM danh_muc c
     INNER JOIN subtree s ON c.danh_muc_cha_id = s.category_id
   )
   SELECT * FROM subtree`,
  [categoryId]
);

module.exports = {
  insertCategoryClient,
  updateCategoryClient,
  deleteCategoriesByIdsClient,
  getCategoryById,
  getCategoryChildrenByParentId,
  getProductsUsingCategories,
  hasChildCategories,
  hasProductsUsingCategory,
  isCategoryNameTaken,
  isSlugTaken,
  getAllCategoryNormalizedNames,
  getAllCategorySlugs,
  isDescendantCategory,
  getCategoriesTreePage,
  getAllCategories,
  getCategoriesList,
  getCategorySubtree,
};
