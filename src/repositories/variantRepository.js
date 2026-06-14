const pool = require("../config/db");

const getAllVariantsStock = async ({ page, limit }) => {
  const offset = (page - 1) * limit;

  const query = `
    SELECT 
        b.bien_the_id as variant_id, 
        b.sku, 
        b.mau_sac as color, 
        b.kich_co as size, 
        COALESCE(t.so_luong_ton, 0) AS stock
    FROM bien_the_san_pham b
    LEFT JOIN ton_kho t ON b.bien_the_id = t.bien_the_id
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

const updateVariantStock = async (variantId, newStock) => {
  const query = "UPDATE variants SET stock = ? WHERE id = ?";
  await pool.query(query, [newStock, variantId]);
};

const updateVariantStockChanges = async (variantId, payload) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Kiểm tra biến thể có tồn tại không
    const variantCheck = await client.query(
      "SELECT 1 FROM bien_the_san_pham WHERE bien_the_id = $1 LIMIT 1",
      [variantId],
    );

    if (variantCheck.rows.length === 0) {
      const error = new Error("Biến thể không tồn tại");
      error.statusCode = 404;
      throw error;
    }

    // Khóa dòng tồn kho của biến thể này để tránh Race Condition (FOR UPDATE)
    const stockResult = await client.query(
      "SELECT so_luong_ton FROM ton_kho WHERE bien_the_id = $1 FOR UPDATE",
      [variantId],
    );

    let currentStock = 0;
    let isInsert = false;

    if (stockResult.rows.length > 0) {
      currentStock = Number(stockResult.rows[0].so_luong_ton);
    } else {
      // Xử lý dự phòng nếu bảng ton_kho chưa có record cho biến thể này
      isInsert = true;
    }

    // Tính toán số lượng tồn kho mới
    let newStock;
    if (
      payload.stock_quantity !== undefined &&
      payload.stock_quantity !== null
    ) {
      const stockValue = String(payload.stock_quantity).trim();

      if (stockValue.startsWith("+") || stockValue.startsWith("-")) {
        newStock = currentStock + Number(stockValue);
      } else {
        newStock = Number(stockValue);
      }
    } else if (
      payload.quantity_change !== undefined &&
      payload.quantity_change !== null
    ) {
      // Cộng/trừ tương đối nếu truyền quantity_change
      newStock = currentStock + Number(payload.quantity_change);
    } else {
      const error = new Error(
        "Vui lòng cung cấp stock_quantity hoặc quantity_change",
      );
      error.statusCode = 400;
      throw error;
    }

    if (Number.isNaN(newStock) || newStock < 0) {
      const error = new Error(
        "Số lượng tồn kho không hợp lệ hoặc không đủ để trừ",
      );
      error.statusCode = 400;
      throw error;
    }

    // Cập nhật vào Database
    if (isInsert) {
      await client.query(
        "INSERT INTO ton_kho (bien_the_id, so_luong_ton) VALUES ($1, $2)",
        [variantId, newStock],
      );
    } else {
      await client.query(
        "UPDATE ton_kho SET so_luong_ton = $2 WHERE bien_the_id = $1",
        [variantId, newStock],
      );
    }

    await client.query("COMMIT");

    return newStock;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};

const deleteVariant = async (variantId) => {
  const query = "DELETE FROM variants WHERE id = ?";
  await pool.query(query, [variantId]);
};

module.exports = {
  getAllVariantsStock,
  updateVariantStock,
  updateVariantStockChanges,
  deleteVariant,
};

