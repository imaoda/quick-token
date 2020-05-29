## introduction

一个中间件

- 自动帮你创建 token + 校验 token
- 支持 express koa
- 支持 cookie 形式，也支持 query 形式的 token

```js
const quickToken = require("quick-token");

// 中间件
app.use(quickToken({ key: "xyz" }));
```

## 参数

| 参数名       | 缺省值                       | 用意                                                                          |
| ------------ | ---------------------------- | ----------------------------------------------------------------------------- |
| key          | 'maoda'                      | 加密算子                                                                      |
| authPath     | ()=>true                     | 需要校验登陆信息的路由                                                        |
| tokenName    | 'token'                      | 种植/读取 cookie 的字段名称                                                   |
| autoRedirect | undefined                    | token 失败跳转的登陆 url，缺省不跳转                                          |
| subDomain    | false                        | cookie 是否只种在子域下                                                       |
| error        | {code:2, msg:'登陆信息失效'} | 无 token/token 无效/token 过期的返回内容                                      |
| loginPath    | undefined                    | 提供登陆的路由 post 账密接口                                                  |
| map          | {}                           | 如需跳转登录，则给出账密字典 {maoda:'1024', tuzi: '1024'}，或者返回字典的函数 |

> 登陆接口 post 的格式必须为 json username password

## 常规使用

```js
const quickToken = require("quick-token");
// 在 cookie body 在静态资源中间件 之后引入，
const authIgnorePath = [];
app.use(
  quickToken({
    key: "maoda",
    authPath(path) {
      if (authIgnorePath.includes(path)) return false;
      return true;
    },
    map() {
      return { maoda: "mypassword" };
    },
    autoRedirect: "/login.html", // 登陆页面，需定义路由，指定页面
    loginPath: "/auth/login", // 提交账密的 接口，无需定义路由，直接 post 就好，
  })
);
```
