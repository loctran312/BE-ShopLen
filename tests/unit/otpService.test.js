// Unit tests for the OTP service — focuses on dev-mode logging and validation logic
// without hitting the Resend API.

jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({ data: { id: 'mock-email-id' }, error: null }),
      },
    })),
  };
});

describe('services/otpService', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it('logs OTP in dev mode when Resend is placeholder config', async () => {
    // Force dev mode with placeholder keys
    process.env.NODE_ENV = 'test';
    process.env.RESEND_API_KEY = 'your-resend-api-key';
    process.env.RESEND_API_KEY_1 = 'your-resend-api-key-1';
    process.env.RESEND_FROM = 'your-email@domain.com';

    const { sendOtpNotification } = require('../../src/services/otpService');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await sendOtpNotification({
      channel: 'email',
      destination: 'user@example.com',
      otp: '123456',
      username: 'testuser',
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[OTP][EMAIL][DEV]')
    );

    consoleSpy.mockRestore();
  });

  it('throws when channel is not email', async () => {
    const { sendOtpNotification } = require('../../src/services/otpService');

    await expect(
      sendOtpNotification({ channel: 'sms', destination: '0901234567', otp: '123456', username: 'test' })
    ).rejects.toThrow('Only email OTP is supported');
  });

  it('sends via Resend when real API key is configured', async () => {
    process.env.NODE_ENV = 'production';
    process.env.RESEND_API_KEY = 're_test_key_12345';
    process.env.RESEND_API_KEY_1 = '';
    process.env.RESEND_FROM = 'ShopLen <onboarding@resend.dev>';

    const { sendOtpNotification } = require('../../src/services/otpService');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await sendOtpNotification({
      channel: 'email',
      destination: 'user@example.com',
      otp: '654321',
      username: 'testuser',
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[OTP][EMAIL] Sent via Resend')
    );

    consoleSpy.mockRestore();
  });
});
