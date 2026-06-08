const { Resend } = require('resend');

const sanitizeFrom = (value) => (value || '').trim().replace(/^['"]|['"]$/g, '');

const sanitizeKey = (value) => (value || '').trim().split(/\s+/)[0];

const getResendApiKeys = () => {
  const primary = sanitizeKey(process.env.RESEND_API_KEY);
  const secondary = sanitizeKey(process.env.RESEND_API_KEY_1);

  return [primary, secondary].filter(Boolean);
};

const isValidFromFormat = (value) => {
  const from = sanitizeFrom(value);
  const plainEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const namedEmail = /^[^<>]+\s<[^\s@]+@[^\s@]+\.[^\s@]+>$/;

  return plainEmail.test(from) || namedEmail.test(from);
};

const isPlaceholderResendConfig = () => {
  const apiKeys = getResendApiKeys();
  const from = sanitizeFrom(process.env.RESEND_FROM || '');
  const hasRealKey = apiKeys.some((key) => key !== 'your-resend-api-key' && key !== 'your-resend-api-key-1');

  return !hasRealKey || !from || from === 'Your Name <your-email@domain.com>' || from === 'your-email@domain.com';
};

const sendEmailOtp = async ({ destination, otp, username }) => {
  if (isPlaceholderResendConfig()) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[OTP][EMAIL][DEV] To: ${destination} | User: ${username} | OTP: ${otp}`);
      return;
    }

    throw new Error('Missing Resend configuration');
  }

  const apiKeys = getResendApiKeys();
  const from = sanitizeFrom(process.env.RESEND_FROM);

  if (!isValidFromFormat(from)) {
    throw new Error('RESEND_FROM has invalid format. Use email@example.com or Name <email@example.com>');
  }

  const message = `Xin chào ${username || ''}, OTP đặt lại mật khẩu của bạn là: ${otp}. Mã có hiệu lực trong ${process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES || 10} phút.`;

  let lastError;

  for (let index = 0; index < apiKeys.length; index += 1) {
    const resend = new Resend(apiKeys[index]);

    try {
      const { data, error } = await resend.emails.send({
        from,
        to: destination,
        subject: 'ShopLen password reset OTP',
        text: message,
        html: `<p>${message}</p>`,
      });

      if (error) {
        throw new Error(error.message || 'Resend returned an error');
      }

      if (data?.id) {
        console.log(`[OTP][EMAIL] Sent via Resend key ${index + 1}: ${data.id}`);
      }

      return;
    } catch (error) {
      lastError = error;
      console.error(`[OTP][EMAIL] Send failed with key ${index + 1}:`, error.message);
    }
  }

  throw lastError || new Error('Unable to send OTP email with configured Resend keys');
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