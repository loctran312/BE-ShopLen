const pool = require("../config/db");

const getAllVariantsStock = async ({ page, limit }) => {
  const offset = (page - 1) * limit;

  const query = `
    SELECT 
        b.bien_the_id as variant_id, 
        b.sku, 
        b.mau_sac as color, 
        b.kich_co as size, 
        COALESCE(t.so_luong_ton, 0) AS available_stock, 
        COALESCE(d.reserved_stock, 0)::int AS reserved_stock, 
        (COALESCE(t.so_luong_ton, 0) + COALESCE(d.reserved_stock, 0))::int AS physical_stock 
    FROM bien_the_san_pham b
    LEFT JOIN ton_kho t ON b.bien_the_id = t.bien_the_id
    LEFT JOIN (
        SELECT ct.bien_the_id, SUM(ct.so_luong) AS reserved_stock
        FROM chi_tiet_don_hang ct
        JOIN don_hang dh ON ct.don_hang_id = dh.don_hang_id
        -- Chỉ tính những đơn chưa rời khỏi kho (chưa giao cho đơn vị vận chuyển)
        WHERE dh.trang_thai IN ('pending', 'processing') 
        GROUP BY ct.bien_the_id
    ) d ON b.bien_the_id = d.bien_the_id
    ORDER BY b.bien_the_id
    LIMIT $1 OFFSET $2
  `;
  
  const { rows } = await pool.query(query, [limit, offset]);

  // Đếm tổng số biến thể để phân trang
  const countQuery = "SELECT COUNT(*) AS total FROM bien_the_san_pham";
  const { rows: countRows } = await pool.query(countQuery);
  const total = Number(countRows[0].total);
  const totalPages = Math.ceil(total / limit);

  return {
    variantsStock: rows,
    pagination: {
      total,
      totalPages,
      page,
      limit
    }
  };
};

const deleteVariant = async (variantId) => {
  const query = "DELETE FROM variants WHERE id = ?";
  await pool.query(query, [variantId]);
};

module.exports = {
  getAllVariantsStock,
  deleteVariant,
};

