const { Resend } = require('resend');

const sanitizeFrom = (value) => (value || '').trim().replace(/^['"]|['"]$/g, '');

const isValidFromFormat = (value) => {
  const from = sanitizeFrom(value);
  const plainEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const namedEmail = /^[^<>]+\s<[^\s@]+@[^\s@]+\.[^\s@]+>$/;

  return plainEmail.test(from) || namedEmail.test(from);
};

const isPlaceholderResendConfig = () => {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const from = sanitizeFrom(process.env.RESEND_FROM || '');

  return !apiKey || !from || apiKey === 'your-resend-api-key' || from === 'Your Name <your-email@domain.com>' || from === 'your-email@domain.com';
};

const sendEmailOtp = async ({ destination, otp, username }) => {
  if (isPlaceholderResendConfig()) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[OTP][EMAIL][DEV] To: ${destination} | User: ${username} | OTP: ${otp}`);
      return;
    }

    throw new Error('Missing Resend configuration');
  }

  const resend = new Resend(process.env.RESEND_API_KEY.trim());
  const from = sanitizeFrom(process.env.RESEND_FROM);

  if (!isValidFromFormat(from)) {
    throw new Error('RESEND_FROM has invalid format. Use email@example.com or Name <email@example.com>');
  }

  const message = `Xin chào ${username || ''}, OTP đặt lại mật khẩu của bạn là: ${otp}. Mã có hiệu lực trong ${process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES || 10} phút.`;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: destination,
      subject: 'ShopLen password reset OTP',
      text: message,
      html: `<p>${message}</p>`,
    });

    if (error) {
      throw error;
    }

    if (data?.id) {
      console.log(`[OTP][EMAIL] Sent via Resend: ${data.id}`);
    }
  } catch (error) {
    console.error('[OTP][EMAIL] Send failed:', error.message);
    throw error;
  }
};

const sendOtpNotification = async ({ channel, destination, otp, username }) => {
  if (channel !== 'email') {
    throw new Error('Only email OTP is supported');
  }

  return sendEmailOtp({ destination, otp, username });
};

module.exports = {
  sendOtpNotification,
};