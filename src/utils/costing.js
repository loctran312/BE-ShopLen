const WORKSHOP_TYPE_ID = 3;

const applyDiscount = (price, discount) => {
    let finalPrice = Number(price);
    if (discount) {
        const discountValue = Number(discount.value);
        if (discount.type === 'percent') {
            finalPrice = finalPrice - (finalPrice * discountValue / 100);
        } else if (discount.type === 'fixed') {
            finalPrice = finalPrice - discountValue;
        }
        if (finalPrice < 0) finalPrice = 0;
    }
    return finalPrice;
};

const getActiveDiscountForProduct = async (client, sanPhamId) => {
    const res = await client.query(
        `SELECT km.kieu_giam_gia AS type, km.gia_tri AS value
         FROM khuyen_mai_san_pham kmsp
         JOIN khuyen_mai km ON km.khuyen_mai_id = kmsp.khuyen_mai_id
         WHERE kmsp.san_pham_id = $1
           AND km.trang_thai = 'active'
           AND (km.ngay_bat_dau IS NULL OR km.ngay_bat_dau <= CURRENT_TIMESTAMP)
           AND (km.ngay_ket_thuc IS NULL OR km.ngay_ket_thuc >= CURRENT_TIMESTAMP)
         ORDER BY km.khuyen_mai_id DESC
         LIMIT 1`,
        [sanPhamId]
    );
    return res.rows.length > 0 ? res.rows[0] : null;
};

const resolveCost = ({ loaiSanPhamId, price, averageCost }) => {
    if (Number(loaiSanPhamId) === WORKSHOP_TYPE_ID) {
        return Number(price);
    }
    return averageCost === null || averageCost === undefined ? null : Number(averageCost);
};

const computeProfitAndMargin = (finalPrice, cost) => {
    if (cost === null || cost === undefined) {
        return { profit: null, margin: null };
    }
    const profit = Number(finalPrice) - Number(cost);
    const margin = Number(finalPrice) === 0 ? null : Number(((profit / Number(finalPrice)) * 100).toFixed(2));
    return { profit, margin };
};

const computeOrderProfitSnapshot = async (client, orderId) => {
    const itemsRes = await client.query(
        `SELECT ct.gia AS sold_price, ct.so_luong AS quantity,
                bt.gia_von_binh_quan AS average_cost, bt.gia AS variant_price,
                sp.loai_san_pham_id
         FROM chi_tiet_don_hang ct
         LEFT JOIN bien_the_san_pham bt ON ct.bien_the_id = bt.bien_the_id
         LEFT JOIN san_pham sp ON bt.san_pham_id = sp.san_pham_id
         WHERE ct.don_hang_id = $1`,
        [orderId]
    );

    let totalRevenue = 0;
    let revenueWithKnownCost = 0;

    for (const row of itemsRes.rows) {
        const quantity = Number(row.quantity);
        const revenue = Number(row.sold_price) * quantity;
        totalRevenue += revenue;

        const cost = resolveCost({
            loaiSanPhamId: row.loai_san_pham_id,
            price: row.variant_price,
            averageCost: row.average_cost !== null ? Number(row.average_cost) : null,
        });

        if (cost === null) {
            // Không đủ dữ liệu giá vốn cho dòng này (variant đã xóa hoặc chưa từng nhập kho)
            // -> loại khỏi phần tính lợi nhuận, không coi cost = 0 để tránh phồng lợi nhuận ảo.
            continue;
        }

        revenueWithKnownCost += revenue;
        totalProfit += revenue - cost * quantity;
    }

    const profitMargin = revenueWithKnownCost === 0 ? null : Number(((totalProfit / revenueWithKnownCost) * 100).toFixed(2));

    return {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalProfit: Number(totalProfit.toFixed(2)),
        profitMargin,
    };
};

module.exports = {
    WORKSHOP_TYPE_ID,
    applyDiscount,
    getActiveDiscountForProduct,
    resolveCost,
    computeProfitAndMargin,
    computeOrderProfitSnapshot,
};
