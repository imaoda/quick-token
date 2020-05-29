const { cipher, deCipher } = require("./crypto");

// 判断用户名密码是否正确
function checkPassword(user, psw, map) {
  if (!user || !psw) return false;
  return map[user] === psw;
}

// 判断 token 是否有效，并返回token对应的用户
function parseToken(token, key) {
  let parsed = deCipher(token, key);
  if (!parsed) return {};
  const [user, loginTime] = parsed.split("|");
  return { loginTime, user };
}

function createToken(user, key) {
  return cipher(user + "|" + (new Date() / 1000).toFixed(0), key);
}

module.exports = { checkPassword, parseToken, createToken };
