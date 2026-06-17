const crypto = require('crypto');
const axios = require('axios');

const MOMO_CONFIG = {
    partnerCode: process.env.MOMO_PARTNER_CODE,
    accessKey: process.env.MOMO_ACCESS_KEY,
    secretKey: process.env.MOMO_SECRET_KEY,
    redirectUrl: process.env.MOMO_REDIRECT_URL,
    ipnUrl: process.env.MOMO_IPN_URL,
    apiEndpoint: process.env.MOMO_API_ENDPOINT,
    refundEndpoint: process.env.MOMO_REFUND_ENDPOINT,
};

// Hàm hỗ trợ: Tạo chữ ký (Signature) bảo mật của MoMo
const createSignature = (rawSignature) => {
    return crypto.createHmac('sha256', MOMO_CONFIG.secretKey).update(rawSignature).digest('hex');
};

// TẠO YÊU CẦU THANH TOÁN (CREATE PAYMENT)
const createPaymentUrl = async (orderId, amount, orderInfo = 'Thanh toan don hang') => {
    const timestamp = Date.now().toString();
    const requestId = `${orderId}-${timestamp}`;

    const momoOrderId = `${orderId}-${timestamp}`; 
    
    const requestType = "payWithMethod";
    const extraData = "";

    // Dùng momoOrderId thay vì orderId cũ
    const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${MOMO_CONFIG.ipnUrl}&orderId=${momoOrderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_CONFIG.partnerCode}&redirectUrl=${MOMO_CONFIG.redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    
    const signature = createSignature(rawSignature);

    const requestBody = {
        partnerCode: MOMO_CONFIG.partnerCode,
        requestId: requestId,
        amount: amount,
        orderId: momoOrderId,
        orderInfo: orderInfo,
        redirectUrl: MOMO_CONFIG.redirectUrl,
        ipnUrl: MOMO_CONFIG.ipnUrl,
        requestType: requestType,
        extraData: extraData,
        lang: "vi",
        signature: signature
    };

    try {
        const response = await axios.post(MOMO_CONFIG.apiEndpoint, requestBody);
        return response.data;
    } catch (error) {
        console.error('[MOMO][CREATE] Error:', error.response ? error.response.data : error.message);
        throw new Error('Không thể khởi tạo thanh toán MoMo');
    }
};

// TẠO YÊU CẦU HOÀN TIỀN (REFUND)
const refundPayment = async (orderId, amount, transId) => {
    // 1. Ép kiểu số tiền về số nguyên (tránh lỗi chuỗi hoặc số thập phân)
    const cleanAmount = Math.round(Number(amount));

    // 2. Tạo ID DUY NHẤT cho riêng giao dịch hoàn tiền này (MoMo bắt buộc)
    const refundOrderId = `RF-${orderId}-${Date.now()}`;
    const requestId = `REQ-${refundOrderId}`;
    const description = `Hoan tien don hang ${orderId}`;

    // Format rawSignature (Dùng refundOrderId đã chế)
    const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${cleanAmount}&description=${description}&orderId=${refundOrderId}&partnerCode=${MOMO_CONFIG.partnerCode}&requestId=${requestId}&transId=${transId}`;
    
    const signature = createSignature(rawSignature);

    const requestBody = {
        partnerCode: MOMO_CONFIG.partnerCode,
        orderId: refundOrderId, // Phải dùng mã hoàn tiền duy nhất
        requestId: requestId,
        amount: cleanAmount,    // Phải là số nguyên
        transId: Number(transId),
        lang: "vi",
        description: description,
        signature: signature
    };

    try {
        const response = await axios.post(MOMO_CONFIG.refundEndpoint, requestBody);
        return response.data;
    } catch (error) {
        console.error('[MOMO][REFUND] Error:', error.response ? error.response.data : error.message);
        throw new Error('Lỗi khi gọi API Hoàn tiền MoMo');
    }
};

// KIỂM TRA CHỮ KÝ TỪ IPN (WEBHOOK)
const verifyIpnSignature = (ipnData) => {
    const { amount, extraData, message, orderId, orderInfo, orderType, partnerCode, payType, requestId, responseTime, resultCode, transId, signature } = ipnData;
    
    const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    
    const expectedSignature = createSignature(rawSignature);
    return signature === expectedSignature;
};

module.exports = {
    createPaymentUrl,
    refundPayment,
    verifyIpnSignature
};