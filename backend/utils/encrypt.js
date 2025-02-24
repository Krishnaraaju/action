const crypto = require('crypto');

const encryptBid = (amount) => {
  // TODO: Implement proper encryption
  // For now, just convert to string
  return amount.toString();
};

const decryptBid = (encryptedAmount) => {
  // TODO: Implement proper decryption
  // For now, just parse float
  return parseFloat(encryptedAmount);
};

module.exports = {
  encryptBid,
  decryptBid
}; 