const pool = require('../config/db');

const getNextUserId = async () => {
  const result = await pool.query('SELECT COALESCE(MAX(nguoi_dung_id), 0) + 1 AS next_id FROM nguoi_dung');
  return result.rows[0].next_id;
};

const isUsernameTaken = async (username, ignoreUserId = null) => {
  const query = ignoreUserId
    ? 'SELECT nguoi_dung_id FROM nguoi_dung WHERE LOWER(TRIM(ten_dang_nhap)) = LOWER(TRIM($1)) AND nguoi_dung_id <> $2 LIMIT 1'
    : 'SELECT nguoi_dung_id FROM nguoi_dung WHERE LOWER(TRIM(ten_dang_nhap)) = LOWER(TRIM($1)) LIMIT 1';
  const params = ignoreUserId ? [username, ignoreUserId] : [username];

  const result = await pool.query(query, params);
  return result.rows.length > 0;
};

const isEmailTaken = async (email, ignoreUserId = null) => {
  const query = ignoreUserId
    ? 'SELECT nguoi_dung_id FROM nguoi_dung WHERE LOWER(TRIM(thu_dien_tu)) = LOWER(TRIM($1)) AND nguoi_dung_id <> $2 LIMIT 1'
    : 'SELECT nguoi_dung_id FROM nguoi_dung WHERE LOWER(TRIM(thu_dien_tu)) = LOWER(TRIM($1)) LIMIT 1';
  const params = ignoreUserId ? [email, ignoreUserId] : [email];

  const result = await pool.query(query, params);
  return result.rows.length > 0;
};

const getAllUsers = async ({ page, limit }) => {
  const offset = (page - 1) * limit;

  const [countResult, usersResult] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS total_items FROM nguoi_dung WHERE vai_tro != 'shipper'"),
    pool.query(
      `SELECT nguoi_dung_id AS user_id,
              ten_dang_nhap AS username,
              ho AS first_name,
              ten AS last_name,
              thu_dien_tu AS email,
              so_dien_thoai AS phone_number,
              trang_thai AS status,
              vai_tro AS role
       FROM nguoi_dung
       WHERE vai_tro != 'shipper'
       ORDER BY nguoi_dung_id DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
  ]);

  const totalItems = countResult.rows[0].total_items;

  return {
    users: usersResult.rows,
    pagination: {
      total_items: totalItems,
      total_pages: Math.max(1, Math.ceil(totalItems / limit)),
      current_page: page,
      limit,
    },
  };
};

const getUserById = async (userId) => pool.query(
  `SELECT nguoi_dung_id AS user_id,
          ten_dang_nhap AS username,
          ho AS first_name,
          ten AS last_name,
          thu_dien_tu AS email,
          so_dien_thoai AS phone_number,
          vai_tro AS role,
          trang_thai AS status,
          mat_khau AS password,
          avatar
   FROM nguoi_dung
   WHERE nguoi_dung_id = $1`,
  [userId]
);

const createUser = async ({ username, email, password, firstName, lastName, phoneNumber, role }) => {
  const nextId = await getNextUserId();

  return pool.query(
    `INSERT INTO nguoi_dung (nguoi_dung_id, ten_dang_nhap, thu_dien_tu, mat_khau, ho, ten, so_dien_thoai, vai_tro)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING nguoi_dung_id AS user_id,
               ten_dang_nhap AS username,
               ho AS first_name,
               ten AS last_name,
               thu_dien_tu AS email,
               so_dien_thoai AS phone_number,
               trang_thai AS status,
               vai_tro AS role`,
    [nextId, username, email, password, firstName, lastName, phoneNumber, role]
  );
};

const updateUser = async (userId, {
  username, email, password, firstName, lastName, phoneNumber, status, role, avatar
}) => pool.query(
  `UPDATE nguoi_dung
     SET ten_dang_nhap = $1, thu_dien_tu = $2, mat_khau = $3,
         ho = $4, ten = $5, so_dien_thoai = $6,
         trang_thai = $7, vai_tro = $8, avatar = $9
   WHERE nguoi_dung_id = $10
   RETURNING nguoi_dung_id AS user_id, ten_dang_nhap AS username,
             ho AS first_name, ten AS last_name, thu_dien_tu AS email,
             so_dien_thoai AS phone_number, trang_thai AS status, vai_tro AS role, avatar`,
  [username, email, password, firstName, lastName, phoneNumber, status, role, avatar, userId]
);

const deleteUser = async (userId) => pool.query(
  'DELETE FROM nguoi_dung WHERE nguoi_dung_id = $1',
  [userId]
);

const getPasswordByUserId = async (userId) => pool.query(
  'SELECT mat_khau AS password FROM nguoi_dung WHERE nguoi_dung_id = $1',
  [userId]
);

const updateUserPassword = async (userId, hashedPassword) => pool.query(
  'UPDATE nguoi_dung SET mat_khau = $1 WHERE nguoi_dung_id = $2',
  [hashedPassword, userId]
);

const updateCurrentUser = async (userId, {
  username, email, firstName, lastName, phoneNumber, avatar
}) => pool.query(
  `UPDATE nguoi_dung
     SET ten_dang_nhap = $1, thu_dien_tu = $2,
          ho = $3, ten = $4, so_dien_thoai = $5, avatar = $6
   WHERE nguoi_dung_id = $7
    RETURNING nguoi_dung_id AS user_id, ten_dang_nhap AS username,
              ho AS first_name, ten AS last_name, thu_dien_tu AS email,
              so_dien_thoai AS phone_number, trang_thai AS status, vai_tro AS role, avatar`,
  [username, email, firstName, lastName, phoneNumber, avatar, userId]
);

const filterUsersAdmin = async (filters) => {
    const { page = 1, limit = 10, keyword, roles, statuses } = filters;
    const offset = (page - 1) * limit;
    const params = [];
    let paramIndex = 1;

    let whereClauses = ["vai_tro != 'shipper'"];

    if (keyword) {
        whereClauses.push(`(ten_dang_nhap ILIKE $${paramIndex} OR thu_dien_tu ILIKE $${paramIndex} OR so_dien_thoai ILIKE $${paramIndex} OR ho ILIKE $${paramIndex} OR ten ILIKE $${paramIndex})`);
        params.push(`%${keyword}%`);
        paramIndex++;
    }

    if (Array.isArray(roles) && roles.length > 0) {
        whereClauses.push(`vai_tro = ANY($${paramIndex}::text[])`);
        params.push(roles);
        paramIndex++;
    }

    if (Array.isArray(statuses) && statuses.length > 0) {
        whereClauses.push(`trang_thai = ANY($${paramIndex}::text[])`);
        params.push(statuses);
        paramIndex++;
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM nguoi_dung ${whereString}`, params);
    const totalItems = countRes.rows[0].total;

    const fetchParams = [...params, limit, offset];
    const usersRes = await pool.query(
        `SELECT nguoi_dung_id AS user_id, ten_dang_nhap AS username, ho AS first_name, ten AS last_name, 
                thu_dien_tu AS email, so_dien_thoai AS phone_number, trang_thai AS status, vai_tro AS role
         FROM nguoi_dung ${whereString}
         ORDER BY nguoi_dung_id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        fetchParams
    );

    return {
        users: usersRes.rows,
        pagination: { total_items: totalItems, total_pages: Math.max(1, Math.ceil(totalItems / limit)), current_page: page, limit },
    };
};

module.exports = {
  getNextUserId,
  isUsernameTaken,
  isEmailTaken,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateCurrentUser,
  deleteUser,
  getPasswordByUserId,
  updateUserPassword,
  filterUsersAdmin,
};
