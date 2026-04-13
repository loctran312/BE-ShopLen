const nodemailer = require('nodemailer');

const isPlaceholderSmtpConfig = () => {
  const host = (process.env.SMTP_HOST || '').trim();
  const user = (process.env.SMTP_USER || '').trim();
  const password = (process.env.SMTP_PASS || '').trim();

  return !host || !user || !password || host === 'smtp.example.com' || user === 'your-smtp-username' || password === 'your-smtp-password';
};

const createSmtpTransport = () => {
  if (isPlaceholderSmtpConfig()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 10000,
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS) || 10000,
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 15000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmailOtp = async ({ destination, otp, username }) => {
  const transport = createSmtpTransport();

  if (!transport) {
    console.log(`[OTP][EMAIL][DEV] To: ${destination} | User: ${username} | OTP: ${otp}`);
    return;
  }

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: destination,
      subject: 'ShopLen password reset OTP',
      text: `Xin chào ${username || ''}, OTP đặt lại mật khẩu của bạn là: ${otp}. Mã có hiệu lực trong ${process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES || 10} phút.`,
    });
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