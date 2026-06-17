const momoService = require('../services/momoService');
const paymentRepository = require('../repositories/paymentRepository');
const orderRepository = require('../repositories/orderRepository'); // Dùng lại orderRepository để đổi trạng thái đơn nếu hoàn tiền

const momoIpn = async (req, res) => {
    try {
        const ipnData = req.body;

        // Xác thực chữ ký để đảm bảo request này thực sự từ MoMo gửi tới
        const isValidSignature = momoService.verifyIpnSignature(ipnData);
        if (!isValidSignature) {
            console.error('[MOMO IPN] Lỗi chữ ký không hợp lệ');
            return res.status(400).json({ message: 'Invalid Signature' });
        }

        const { orderId, resultCode, transId } = ipnData;

        const originalOrderId = orderId.substring(0, orderId.lastIndexOf('-'));

        // Xử lý kết quả giao dịch
        if (resultCode === 0) {
            // resultCode = 0 nghĩa là Thanh toán thành công
            await paymentRepository.updatePaymentStatus(originalOrderId, 'paid', transId);
            console.log(`[MOMO IPN] Đơn hàng ${orderId} đã thanh toán thành công.`);
        } else {
            // Các mã khác là thất bại/hủy
            await paymentRepository.updatePaymentStatus(originalOderId, 'failed');
            console.log(`[MOMO IPN] Đơn hàng ${orderId} thanh toán thất bại (Mã lỗi: ${resultCode}).`);
        }

        // Trả về 204 No Content cho MoMo biết là Server đã nhận và xử lý xong
        return res.status(204).send();

    } catch (error) {
        console.error('[MOMO IPN] Lỗi server:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const momoReturn = async (req, res) => {
    try {
        // Với Redirect, dữ liệu MoMo gửi sẽ nằm ở req.query (trên thanh URL)
        const queryData = req.query;

        // Xác thực chữ ký (Signature)
        const isValidSignature = momoService.verifyIpnSignature(queryData);
        if (!isValidSignature) {
            console.error('[MOMO RETURN] Lỗi chữ ký không hợp lệ');
            return res.status(400).json({ message: 'Invalid Signature' });
        }

        const { orderId, resultCode, transId } = queryData;

        const originalOrderId = orderId.substring(0, orderId.lastIndexOf('-'));

        // Lấy thông tin thanh toán hiện tại từ DB để check tránh cập nhật trùng lặp
        const paymentInfo = await paymentRepository.getPaymentInfo(originalOrderId);
        
        // Chỉ cập nhật nếu đơn hàng chưa được xử lý (trạng thái vẫn là pending)
        if (paymentInfo && paymentInfo.trang_thai === 'pending') {
            if (Number(resultCode) === 0) {
                await paymentRepository.updatePaymentStatus(originalOrderId, 'paid', transId);
                console.log(`[MOMO RETURN] Đơn hàng ${originalOrderId} đã thanh toán thành công.`);
            } else {
                await paymentRepository.updatePaymentStatus(originalOrderId, 'failed');
                console.log(`[MOMO RETURN] Đơn hàng ${originalOrderId} thanh toán thất bại (Mã lỗi: ${resultCode}).`);
            }
        }

        // Sau khi xử lý DB xong, điều hướng (Redirect) người dùng về giao diện Frontend
        if (Number(resultCode) === 0) {
            return res.redirect(`http://localhost:5173/payment/success?orderId=${orderId}`);
        } else {
            return res.redirect(`http://localhost:5173/payment/failed?orderId=${orderId}`);
        }

    } catch (error) {
        console.error('[MOMO RETURN] Lỗi server:', error);
        return res.status(500).send('Đã xảy ra lỗi khi xử lý kết quả thanh toán');
    }
};

const processRefund = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        // Lấy thông tin thanh toán của đơn hàng
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

        // Ép kiểu tổng tiền thành số trước khi gửi qua Service
        const amountToRefund = Math.round(Number(paymentInfo.tong_tien));

        // Gọi API MoMo để thực hiện hoàn tiền
        const refundResult = await momoService.refundPayment(
            orderId, 
            amountToRefund, 
            paymentInfo.ma_tham_chieu
        );

        console.log('--- [MOMO REFUND RESPONSE] ---', refundResult);

        if (refundResult.resultCode === 0) {
            // Đổi trạng thái thanh toán thành 'refunded'
            await paymentRepository.updatePaymentStatus(orderId, 'refunded');
            
            // Đổi trạng thái đơn hàng thành 'cancelled'
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
        console.error('[PAYMENT][REFUND] Error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi hoàn tiền' });
    }
};

module.exports = {
    momoIpn,
    momoReturn,
    processRefund
};