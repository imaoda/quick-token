const crypto = require("crypto");

function cipher(keyword, token = "maoda") {
  let machine = crypto.createCipher("aes256", token); // aes128 会减轻cpu负荷
  let encrypted = "";
  encrypted = machine.update(keyword, "utf8", "hex");
  encrypted += machine.final("hex");
  return encrypted;
}
function deCipher(str, token = "maoda") {
  let decipher = crypto.createDecipher("aes256", token);
  let decrypted = "";
  try {
    decrypted = decipher.update(str, "hex", "utf8");
    decrypted += decipher.final("utf8");
  } catch (error) {}
  // 如果解密错误，返回的还是空字符串
  return decrypted;
}

module.exports = { cipher, deCipher };
