// Additional validation helpers

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateMobile = (mobile) => {
  // Indian mobile number validation
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
};

const validatePassword = (password) => {
  // Password must be at least 6 characters
  // For stronger validation, can add more rules
  return password && password.length >= 6;
};

const validateGST = (gstNumber) => {
  // GST number format: 22AAAAA0000A1Z5
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gstNumber);
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

module.exports = {
  validateEmail,
  validateMobile,
  validatePassword,
  validateGST,
  sanitizeInput,
};

