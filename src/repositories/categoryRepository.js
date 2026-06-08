const pool = require('../config/db');

const insertCategoryClient = async (client, { categoryName, description = null, parentCategoryId = null, slug }) => {
  const result = await client.query(
    `INSERT INTO danh_muc (ten_danh_muc, mo_ta, danh_muc_cha_id, slug)
     VALUES ($1, $2, $3, $4)
     RETURNING danh_muc_id AS category_id,
               ten_danh_muc AS category_name,
               mo_ta AS description,
               danh_muc_cha_id AS parent_category_id,
               slug`,
    [categoryName, description, parentCategoryId, slug]
  );

  return result.rows[0];
};

const getCategoryById = async (categoryId) => pool.query(
  `SELECT c.danh_muc_id AS category_id,
          c.ten_danh_muc AS category_name,
          c.mo_ta AS description,
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

const getAllCategoryNormalizedNames = async () => pool.query(
  'SELECT LOWER(TRIM(ten_danh_muc)) AS normalized_name FROM danh_muc'
);

const getAllCategorySlugs = async () => pool.query('SELECT slug FROM danh_muc');

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
          danh_muc_cha_id AS parent_category_id,
          slug
   FROM danh_muc
   ORDER BY ten_danh_muc ASC`
);

const getCategorySubtree = async (categoryId) => pool.query(
  `WITH RECURSIVE subtree AS (
     SELECT danh_muc_id AS category_id,
            ten_danh_muc AS category_name,
            mo_ta AS description,
            danh_muc_cha_id AS parent_category_id,
            slug
     FROM danh_muc
     WHERE danh_muc_id = $1
   UNION ALL
     SELECT c.danh_muc_id AS category_id,
            c.ten_danh_muc AS category_name,
            c.mo_ta AS description,
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
  getCategoryById,
  hasChildCategories,
  hasProductsUsingCategory,
  isCategoryNameTaken,
  isSlugTaken,
  getAllCategoryNormalizedNames,
  getAllCategorySlugs,
  isDescendantCategory,
  getAllCategories,
  getCategorySubtree,
};
