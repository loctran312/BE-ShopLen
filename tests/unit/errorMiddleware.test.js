const errorMiddleware = require('../../src/middlewares/errorMiddleware');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('middlewares/errorMiddleware', () => {
  beforeEach(() => mockNext.mockReset());

  it('returns the error status code when present', () => {
    const err = new Error('Bad request');
    err.status = 400;
    const req = {};
    const res = mockRes();

    errorMiddleware(err, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'Bad request' });
  });

  it('defaults to 500 when no status is set', () => {
    const err = new Error('Something broke');
    const req = {};
    const res = mockRes();

    errorMiddleware(err, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'Something broke' });
  });

  it('uses default message when err.message is empty', () => {
    const err = new Error('');
    err.status = 500;
    const req = {};
    const res = mockRes();

    errorMiddleware(err, req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'Internal Server Error' });
  });
});
