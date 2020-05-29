const { checkPassword, parseToken, createToken } = require("./lib/auth");

function getEasy(props = {}) {
  var expires = props.expires || 30 * 24 * 60 * 60;
  var authPath = props.authPath || (() => true);
  var map = props.map || {};
  var key = props.key || "maoda";
  var error = props.error || { code: 2, msg: "登陆信息失效" };
  var tokenName = props.token || "token";
  var loginPath = props.loginPath;
  var autoRedirect = props.autoRedirect; // 跳转自动登陆
  var subDomain = props.subDomain; // 是否把 cookie 只限制到子域

  function getMap() {
    return typeof map === "function" ? map() : map;
  }

  function getCookieParams(host) {
    const param = {
      httpOnly: true,
      expires: new Date(Date.now() + expires * 1000),
    };
    // ip 形式的不处理根域名
    if (
      host.indexOf(":") !== -1 ||
      (!isNaN(host.split(".")[0]) && !isNaN(host.split(".")[1]))
    )
      return param;
    if (host && !subDomain) {
      var domainParts = host.split(".");
      var arr = [];
      arr.unshift(domainParts.pop());
      arr.unshift(domainParts.pop());
      param.domain = arr.join(".");
    }
    return param;
  }

  function midExpress(req, res, next) {
    if (!req.cookies) throw new Error("cookie中间件需先加载");
    // 如果是提交登陆信息的路由
    if (req.path === loginPath) {
      if (!req.body) throw new Error("body解析中间件需先加载");
      if (checkPassword(req.body.username, req.body.password, getMap())) {
        const newToken = createToken(req.body.username, key);
        res.cookie(tokenName, newToken, getCookieParams(req.headers["host"]));
        res.json({ code: 0, data: newToken });
      } else {
        res.json({ code: 1, msg: "用户名或密码错误" });
      }
      return;
    }

    if (!authPath(req.path) || req.path === autoRedirect) {
      next();
      return;
    }
    const token = req.query[tokenName] || req.cookies[tokenName];
    const { user, loginTime = 0 } = parseToken(token, key);
    const delay = Date.now() / 1000 - loginTime;
    if (!user || delay > expires) {
      autoRedirect ? res.redirect(autoRedirect) : res.json(error);
      return;
    }

    if (delay > expires / 2) {
      // 超过超时时间的一半则自动续期
      const newToken = createToken(user, key);
      res.cookie(tokenName, newToken, getCookieParams(req.headers["host"]));
    }
    next();
  }

  async function midKoa(ctx, next) {
    // 如果是提交登陆信息的路由
    if (ctx.path === loginPath) {
      if (!ctx.request.body) throw new Error("body解析中间件需先加载");
      if (
        checkPassword(
          ctx.request.body.username,
          ctx.request.body.password,
          getMap()
        )
      ) {
        const newToken = createToken(ctx.request.body.username, key);
        ctx.set(tokenName, newToken, getCookieParams(req.headers["host"]));
        ctx.body = { code: 0, data: newToken };
      } else {
        ctx.body = { code: 1, msg: "用户名或密码错误" };
      }
      return;
    }

    if (!authPath(ctx.path) || ctx.path === autoRedirect) {
      await next();
      return;
    }
    const token = ctx.query[tokenName] || ctx.cookies.get(tokenName);
    const { user, loginTime = 0 } = parseToken(token, key);
    const delay = Date.now() / 1000 - loginTime;
    if (!user || delay > expires) {
      autoRedirect ? ctx.redirect(autoRedirect) : (ctx.body = error);
      return;
    }
    if (delay > expires) {
      // 超时需要重新登录
      ctx.body = error;
      return;
    }

    if (delay > expires / 2) {
      // 超过超时时间的一半则自动续期
      const newToken = createToken(user, key);
      ctx.set(tokenName, newToken, getCookieParams(ctx.headers["host"]));
    }
    await next();
  }

  return function mid(...args) {
    if (args.length > 2) {
      // express
      midExpress(...args);
    } else {
      midKoa(...args);
    }
  };
}

module.exports = getEasy;
