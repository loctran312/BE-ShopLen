const parseInteger = (value, fieldName) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    const error = new Error(`${fieldName} không hợp lệ`);
    error.statusCode = 400;
    throw error;
  }

  return parsed;
};

const parsePositiveInteger = (value, fieldName) => {
  const parsed = parseInteger(value, fieldName);

  if (parsed <= 0) {
    const error = new Error(`${fieldName} không hợp lệ`);
    error.statusCode = 400;
    throw error;
  }

  return parsed;
};

module.exports = {
  parseInteger,
  parsePositiveInteger,
};
