// Unit tests for authController — mocks repository and services.

jest.mock('../../src/repositories/authRepository', () => ({
  getUserByUsernameOrEmail: jest.fn(),
  getUserWithPassword: jest.fn(),
  getUserByEmail: jest.fn(),
  getUserById: jest.fn(),
  getUserByRefreshToken: jest.fn(),
  getNextUserId: jest.fn(),
  createUser: jest.fn(),
  updateUserStatus: jest.fn(),
  updateRefreshToken: jest.fn(),
  clearRefreshToken: jest.fn(),
  getUserByGoogleProviderId: jest.fn(),
  getGoogleProviderByUserId: jest.fn(),
  createGoogleProvider: jest.fn(),
  markActiveResetTokensUsed: jest.fn(),
  createPasswordResetToken: jest.fn(),
  getLatestResetToken: jest.fn(),
  getPasswordResetToken: jest.fn(),
  updateUserPassword: jest.fn(),
  markPasswordResetTokenUsed: jest.fn(),
  incrementResetTokenAttempts: jest.fn(),
}));

jest.mock('../../src/services/otpService', () => ({
  sendOtpNotification: jest.fn(),
}));

jest.mock('../../src/config/db', () => ({
  connect: jest.fn(),
  query: jest.fn(),
}));

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authRepository = require('../../src/repositories/authRepository');
const { sendOtpNotification } = require('../../src/services/otpService');
const pool = require('../../src/config/db');
const authController = require('../../src/controllers/authController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const SECRET = process.env.JWT_SECRET;

describe('controllers/authController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.query.mockImplementation(() => Promise.resolve({ rows: [] }));
    mockClient.query.mockResolvedValue({ rows: [] });
    pool.connect.mockResolvedValue(mockClient);
  });

  describe('register', () => {
    const validBody = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password@123',
      phone_number: '0901234567',
      role: 'customer',
    };

    it('registers a new user successfully', async () => {
      authRepository.getUserByUsernameOrEmail.mockResolvedValue({ rows: [] });
      authRepository.getNextUserId.mockResolvedValue(10);
      authRepository.createUser.mockResolvedValue({ rows: [] });

      const req = { body: validBody };
      const res = mockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Đăng ký thành công' });
      expect(authRepository.createUser).toHaveBeenCalled();
    });

    it('returns 400 when username already exists', async () => {
      authRepository.getUserByUsernameOrEmail.mockResolvedValue({ rows: [{ user_id: 1 }] });

      const req = { body: validBody };
      const res = mockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Username hoặc email đã tồn tại' });
    });

    it('returns 400 for an invalid email', async () => {
      authRepository.getUserByUsernameOrEmail.mockResolvedValue({ rows: [] });
      const req = { body: { ...validBody, email: 'not-an-email' } };
      const res = mockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email không hợp lệ' });
    });

    it('returns 400 for a short username', async () => {
      authRepository.getUserByUsernameOrEmail.mockResolvedValue({ rows: [] });
      const req = { body: { ...validBody, username: 'ab' } };
      const res = mockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Username phải có ít nhất 3 ký tự, nhỏ hơn 20 ký tự' });
    });

    it('returns 400 for an invalid phone number', async () => {
      authRepository.getUserByUsernameOrEmail.mockResolvedValue({ rows: [] });
      const req = { body: { ...validBody, phone_number: '12345' } };
      const res = mockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Số điện thoại không hợp lệ' });
    });

    it('returns 400 for a weak password', async () => {
      authRepository.getUserByUsernameOrEmail.mockResolvedValue({ rows: [] });
      const req = { body: { ...validBody, password: 'weakpass' } };
      const res = mockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt' });
    });
  });

  describe('login', () => {
    it('logs in with valid credentials and returns tokens', async () => {
      const hashedPassword = await bcrypt.hash('Password@123', 10);
      authRepository.getUserWithPassword.mockResolvedValue({
        rows: [{ user_id: 1, username: 'admin', email: 'admin@test.com', password: hashedPassword, role: 'admin' }],
      });
      authRepository.updateUserStatus.mockResolvedValue();
      authRepository.updateRefreshToken.mockResolvedValue();

      const req = { body: { email: 'admin@test.com', password: 'Password@123' } };
      const res = mockRes();

      await authController.login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          access_token: expect.any(String),
          refresh_token: expect.any(String),
          user: { user_id: 1, role: 'admin' },
        })
      );
    });

    it('returns 400 when email does not exist', async () => {
      authRepository.getUserWithPassword.mockResolvedValue({ rows: [] });

      const req = { body: { email: 'nobody@test.com', password: 'Password@123' } };
      const res = mockRes();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email hoặc mật khẩu không đúng' });
    });

    it('returns 400 when password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('Password@123', 10);
      authRepository.getUserWithPassword.mockResolvedValue({
        rows: [{ user_id: 1, password: hashedPassword, role: 'customer' }],
      });

      const req = { body: { email: 'admin@test.com', password: 'WrongPass@1' } };
      const res = mockRes();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email hoặc mật khẩu không đúng' });
    });
  });

  describe('refreshToken', () => {
    it('issues new tokens with a valid refresh token', async () => {
      const refreshToken = jwt.sign({ user_id: 1, role: 'customer' }, SECRET, { expiresIn: '7d' });
      authRepository.getUserByRefreshToken.mockResolvedValue({
        rows: [{ user_id: 1, role: 'customer' }],
      });
      authRepository.updateRefreshToken.mockResolvedValue();

      const req = { body: { refresh_token: refreshToken } };
      const res = mockRes();

      await authController.refreshToken(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          access_token: expect.any(String),
          refresh_token: expect.any(String),
        })
      );
    });

    it('returns 400 when refresh_token is missing', async () => {
      const req = { body: {} };
      const res = mockRes();

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Thiếu refresh_token' });
    });

    it('returns 401 for an invalid refresh token', async () => {
      const req = { body: { refresh_token: 'invalid.token.here' } };
      const res = mockRes();

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Refresh token không hợp lệ hoặc hết hạn' });
    });

    it('returns 401 when refresh token is not found in DB (revoked)', async () => {
      const refreshToken = jwt.sign({ user_id: 1, role: 'customer' }, SECRET, { expiresIn: '7d' });
      authRepository.getUserByRefreshToken.mockResolvedValue({ rows: [] });

      const req = { body: { refresh_token: refreshToken } };
      const res = mockRes();

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Refresh token không hợp lệ hoặc đã bị thu hồi' });
    });
  });

  describe('logout', () => {
    it('logs out and clears refresh token', async () => {
      const token = jwt.sign({ user_id: 1, role: 'customer' }, SECRET, { expiresIn: '1h' });
      authRepository.updateUserStatus.mockResolvedValue();
      authRepository.clearRefreshToken.mockResolvedValue();

      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();

      await authController.logout(req, res);

      expect(authRepository.updateUserStatus).toHaveBeenCalledWith(1, 'inactive');
      expect(authRepository.clearRefreshToken).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ message: 'Đăng xuất thành công' });
    });

    it('returns 401 when no token is provided', async () => {
      const req = { headers: {} };
      const res = mockRes();

      await authController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('forgotPassword', () => {
    it('sends OTP for an existing user', async () => {
      authRepository.getUserByEmail.mockResolvedValue({
        rows: [{ user_id: 1, email: 'user@test.com', username: 'user1' }],
      });
      authRepository.markActiveResetTokensUsed.mockResolvedValue();
      authRepository.createPasswordResetToken.mockResolvedValue({
        id: 42,
        expires_at: new Date(Date.now() + 600000).toISOString(),
      });
      sendOtpNotification.mockResolvedValue();

      const req = { body: { email: 'user@test.com' } };
      const res = mockRes();

      await authController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Mã OTP đã được gửi', reset_token_id: 42 })
      );
      expect(sendOtpNotification).toHaveBeenCalled();
    });

    it('returns 400 when identifier is empty', async () => {
      const req = { body: { email: '' } };
      const res = mockRes();

      await authController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when user does not exist', async () => {
      authRepository.getUserByEmail.mockResolvedValue({ rows: [] });

      const req = { body: { email: 'nobody@test.com' } };
      const res = mockRes();

      await authController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('verifyResetOtp', () => {
    it('verifies a correct OTP and returns a reset session token', async () => {
      const otp = '123456';
      const otpHash = await bcrypt.hash(otp, 10);
      authRepository.getUserByEmail.mockResolvedValue({
        rows: [{ user_id: 1, email: 'user@test.com' }],
      });
      authRepository.getLatestResetToken.mockResolvedValue({
        rows: [{ id: 42, otp_hash: otpHash, used_at: null, not_expired: true }],
      });
      authRepository.incrementResetTokenAttempts.mockResolvedValue();

      const req = { body: { email: 'user@test.com', otp } };
      const res = mockRes();

      await authController.verifyResetOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'OTP hợp lệ', reset_session_token: expect.any(String) })
      );
    });

    it('returns 400 when OTP is wrong', async () => {
      const otpHash = await bcrypt.hash('123456', 10);
      authRepository.getUserByEmail.mockResolvedValue({
        rows: [{ user_id: 1, email: 'user@test.com' }],
      });
      authRepository.getLatestResetToken.mockResolvedValue({
        rows: [{ id: 42, otp_hash: otpHash, used_at: null, not_expired: true }],
      });
      authRepository.incrementResetTokenAttempts.mockResolvedValue();

      const req = { body: { email: 'user@test.com', otp: '999999' } };
      const res = mockRes();

      await authController.verifyResetOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'OTP không đúng' });
    });

    it('returns 400 when identifier or OTP is missing', async () => {
      const req = { body: { email: 'user@test.com' } };
      const res = mockRes();

      await authController.verifyResetOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Thiếu email hoặc OTP' });
    });

    it('returns 404 when user does not exist', async () => {
      authRepository.getUserByEmail.mockResolvedValue({ rows: [] });

      const req = { body: { email: 'nobody@test.com', otp: '123456' } };
      const res = mockRes();

      await authController.verifyResetOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('resetPassword', () => {
    it('resets the password with valid session token', async () => {
      const resetSessionToken = jwt.sign(
        { purpose: 'password_reset', user_id: 1, reset_token_id: 42, channel: 'email', destination: 'user@test.com' },
        SECRET,
        { expiresIn: '15m' }
      );

      authRepository.getUserByEmail.mockResolvedValue({
        rows: [{ user_id: 1, email: 'user@test.com' }],
      });
      authRepository.getPasswordResetToken.mockResolvedValue({
        rows: [{ id: 42, used_at: null, not_expired: true }],
      });
      authRepository.updateUserPassword.mockResolvedValue();
      authRepository.markPasswordResetTokenUsed.mockResolvedValue();

      const req = {
        body: {
          email: 'user@test.com',
          new_password: 'NewPassword@123',
          reset_session_token: resetSessionToken,
        },
      };
      const res = mockRes();

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Đặt lại mật khẩu thành công' });
    });

    it('returns 400 when new password is weak', async () => {
      const resetSessionToken = jwt.sign(
        { purpose: 'password_reset', user_id: 1, reset_token_id: 42, channel: 'email', destination: 'user@test.com' },
        SECRET,
        { expiresIn: '15m' }
      );

      authRepository.getUserByEmail.mockResolvedValue({
        rows: [{ user_id: 1, email: 'user@test.com' }],
      });

      const req = {
        body: {
          email: 'user@test.com',
          new_password: 'weakpass',
          reset_session_token: resetSessionToken,
        },
      };
      const res = mockRes();

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 401 when reset session token is invalid', async () => {
      authRepository.getUserByEmail.mockResolvedValue({
        rows: [{ user_id: 1, email: 'user@test.com' }],
      });

      const req = {
        body: {
          email: 'user@test.com',
          new_password: 'NewPassword@123',
          reset_session_token: 'invalid.token',
        },
      };
      const res = mockRes();

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
