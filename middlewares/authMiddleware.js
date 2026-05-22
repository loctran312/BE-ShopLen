const jwt = require('jsonwebtoken');

const extractAndVerifyToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Invalid token format');
  }

  const token = authHeader.substring(7);

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token không hợp lệ hoặc hết hạn');
  }
};

const requireAuth = (req, res, next) => {
  try {
    const decoded = extractAndVerifyToken(req.headers.authorization);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc hết hạn' });
  }
};

const requireAdmin = (req, res, next) => {
  try {
    const decoded = extractAndVerifyToken(req.headers.authorization);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này' });
    }

    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc hết hạn' });
  }
};

module.exports = {
  extractAndVerifyToken,
  requireAuth,
  requireAdmin,
};