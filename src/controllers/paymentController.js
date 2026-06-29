const momoService = require('../services/momoService');
const paymentRepository = require('../repositories/paymentRepository');
const orderRepository = require('../repositories/orderRepository');

const momoIpn = async (req, res) => {
    try {
        const ipnData = req.body;

        const isValidSignature = momoService.verifyIpnSignature(ipnData);
        if (!isValidSignature) {
            console.error('[MOMO IPN] Lỗi chữ ký không hợp lệ');
            return res.status(400).json({ message: 'Invalid Signature' });
        }

        const { orderId, resultCode, transId } = ipnData;

        const originalOrderId = orderId.substring(0, orderId.lastIndexOf('-'));

        if (resultCode === 0) {
            await paymentRepository.updatePaymentStatus(originalOrderId, 'paid', transId);
            console.log(`[MOMO IPN] Đơn hàng ${orderId} đã thanh toán thành công.`);
        } else {
            await paymentRepository.updatePaymentStatus(originalOrderId, 'failed');
            console.log(`[MOMO IPN] Đơn hàng ${orderId} thanh toán thất bại (Mã lỗi: ${resultCode}).`);
        }

        return res.status(204).send();

    } catch (error) {
        console.error('[MOMO IPN] Lỗi server:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const momoReturn = async (req, res) => {
    try {
        const queryData = req.query;

        const isValidSignature = momoService.verifyIpnSignature(queryData);
        if (!isValidSignature) {
            console.error('[MOMO RETURN] Lỗi chữ ký không hợp lệ');
            return res.status(400).json({ message: 'Invalid Signature' });
        }

        const { orderId, resultCode, transId } = queryData;

        const originalOrderId = orderId.substring(0, orderId.lastIndexOf('-'));

        const paymentInfo = await paymentRepository.getPaymentInfo(originalOrderId);

        if (paymentInfo && paymentInfo.trang_thai === 'pending') {
            if (Number(resultCode) === 0) {
                await paymentRepository.updatePaymentStatus(originalOrderId, 'paid', transId);
                console.log(`[MOMO RETURN] Đơn hàng ${originalOrderId} đã thanh toán thành công.`);
            } else {
                await paymentRepository.updatePaymentStatus(originalOrderId, 'failed');
                console.log(`[MOMO RETURN] Đơn hàng ${originalOrderId} thanh toán thất bại (Mã lỗi: ${resultCode}).`);
            }
        }

        if (Number(resultCode) === 0) {
            return res.redirect(process.env.MOMO_SUCCESS_REDIRECT_URI + `?orderId=${orderId}`);
        } else {
            return res.redirect(process.env.MOMO_FAILED_REDIRECT_URI + `?orderId=${orderId}`);
        }

    } catch (error) {
        console.error('[MOMO RETURN] Lỗi server:', error);
        return res.status(500).send('Đã xảy ra lỗi khi xử lý kết quả thanh toán');
    }
};

const processRefund = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        const paymentInfo = await paymentRepository.getPaymentInfo(orderId);

        if (!paymentInfo) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin thanh toán' });
        }

        if (paymentInfo.phuong_thuc !== 'MOMO') {
            return res.status(400).json({ success: false, message: 'Chỉ hỗ trợ hoàn tiền tự động qua MoMo' });
        }

        if (paymentInfo.trang_thai !== 'paid') {
            return res.status(400).json({ success: false, message: 'Đơn hàng này chưa thanh toán hoặc đã được hoàn tiền' });
        }

        const amountToRefund = Math.round(Number(paymentInfo.tong_tien));

        const refundResult = await momoService.refundPayment(
            orderId, 
            amountToRefund, 
            paymentInfo.ma_tham_chieu
        );

        if (refundResult.resultCode === 0) {
            await paymentRepository.updatePaymentStatus(orderId, 'refunded');

            await orderRepository.updateOrderStatus(orderId, 'cancelled');

            return res.json({
                success: true,
                message: 'Hoàn tiền thành công',
                data: refundResult
            });
        } else {
            return res.status(400).json({
                success: false,
                message: `MoMo từ chối hoàn tiền: ${refundResult.message}`,
            });
        }

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi hoàn tiền' });
    }
};

module.exports = {
    momoIpn,
    momoReturn,
    processRefund
};