// Unit tests for spinController — mocks the repository.

jest.mock('../../src/repositories/spinRepository', () => ({
  getSpinInfo: jest.fn(),
  playSpin: jest.fn(),
  getSpinHistory: jest.fn(),
  getAdminConfigs: jest.fn(),
  createAdminConfig: jest.fn(),
  addTurnsToAllUsers: jest.fn(),
  updateAdminConfig: jest.fn(),
  deleteAdminConfig: jest.fn(),
}));

const spinRepository = require('../../src/repositories/spinRepository');
const spinController = require('../../src/controllers/spinController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const USER_ID = 1;

describe('controllers/spinController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getSpinInfo', () => {
    it('returns spin info for the authenticated user', async () => {
      spinRepository.getSpinInfo.mockResolvedValue({ turns_remaining: 3, rewards: [] });
      const req = { user: { user_id: USER_ID } };
      const res = mockRes();

      await spinController.getSpinInfo(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: { turns_remaining: 3, rewards: [] } });
    });

    it('returns 500 on repository error', async () => {
      spinRepository.getSpinInfo.mockRejectedValue(new Error('DB error'));
      const req = { user: { user_id: USER_ID } };
      const res = mockRes();

      await spinController.getSpinInfo(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('playSpin', () => {
    it('returns spin result on success', async () => {
      spinRepository.playSpin.mockResolvedValue({ prize: 'voucher', value: 'WELCOME10' });
      const req = { user: { user_id: USER_ID } };
      const res = mockRes();

      await spinController.playSpin(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { prize: 'voucher', value: 'WELCOME10' },
      });
    });

    it('returns statusCode from error when out of turns', async () => {
      const err = new Error('Bạn đã hết lượt quay');
      err.statusCode = 400;
      spinRepository.playSpin.mockRejectedValue(err);

      const req = { user: { user_id: USER_ID } };
      const res = mockRes();

      await spinController.playSpin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Bạn đã hết lượt quay' });
    });
  });

  describe('getSpinHistory', () => {
    it('returns paginated history', async () => {
      spinRepository.getSpinHistory.mockResolvedValue({
        history: [{ id: 1, prize: 'points' }],
        pagination: { total_items: 1, total_pages: 1, current_page: 1, limit: 10 },
      });

      const req = { user: { user_id: USER_ID }, query: { page: '1', limit: '10' } };
      const res = mockRes();

      await spinController.getSpinHistory(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          history: [{ id: 1, prize: 'points' }],
          pagination: { total_items: 1, total_pages: 1, current_page: 1, limit: 10 },
        },
      });
    });
  });

  describe('createAdminConfig', () => {
    it('creates a new reward config', async () => {
      spinRepository.createAdminConfig.mockResolvedValue();
      const req = { body: { loai_qua: 'voucher', ty_le_thang: 10, so_luong_con_lai: 50, trang_thai: 'active' } };
      const res = mockRes();

      await spinController.createAdminConfig(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Thêm phần thưởng thành công' });
    });

    it('returns error statusCode when total win rate exceeds 100%', async () => {
      const err = new Error('Tổng tỷ lệ thắng không được vượt quá 100%');
      err.statusCode = 400;
      spinRepository.createAdminConfig.mockRejectedValue(err);

      const req = { body: { ty_le_thang: 150 } };
      const res = mockRes();

      await spinController.createAdminConfig(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteAdminConfig', () => {
    it('deletes a config that has no history', async () => {
      spinRepository.deleteAdminConfig.mockResolvedValue();
      const req = { params: { id: '5' } };
      const res = mockRes();

      await spinController.deleteAdminConfig(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Xóa phần thưởng thành công' });
    });

    it('returns 400 when config has spin history', async () => {
      const err = new Error('Không thể xóa phần thưởng đã có người quay trúng');
      err.statusCode = 400;
      spinRepository.deleteAdminConfig.mockRejectedValue(err);

      const req = { params: { id: '3' } };
      const res = mockRes();

      await spinController.deleteAdminConfig(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
