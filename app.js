var express = require('express');
var webot = require('weixin-robot');
var path = require('path');

var log = require('debug')('webot-example:log');
var verbose = require('debug')('webot-example:verbose');

var Poster = require('./rules/poster');
var RulesIndex = require('./rules/index');

// Webot.prototype.codeReplies = {
//   '204': 'OK, got that.',
//   '403': 'You have no permission to do this.',
//   '404': 'Don\'t know what you are saying.',
//   '500': 'Something is broken...'
// };

webot.codeReplies['404'] = null;

// 启动服务
var app = express();

app.use(express.compress());

// 通常用于加载静态资源
app.use('/static', express.static(path.resolve(__dirname, 'static')));

// 实际使用时，这里填写你在微信公共平台后台填写的 token
var wx_token = process.env.WX_TOKEN || 'keyboardcat123';
var wx_token2 = process.env.WX_TOKEN_2 || 'weixinToken2';


// 载入webot1的回复规则
webot.posterId = 3;
RulesIndex(webot);
webot.watch(app, {
    token: wx_token,
    path: '/wechat'
});




// 建立多个实例，并监听到不同 path ，
var webot2 = new webot.Webot();
// 为webot2也指定规则
webot2.set('hello', 'hi.');
// 若省略 path 参数，会监听到根目录
// webot.watch(app, { token: wx_token });
// 后面指定的 path 不可为前面实例的子目录
webot2.watch(app, {
    token: wx_token2,
    path: '/wechat_2'
});



// 建立多个实例，并监听到不同 path ，
var webot3 = new webot.Webot();
Poster.init(4).then(function (poster) {

    Poster.webotSet(webot3, poster);
    // 启动机器人, 接管 web 服务请求
    webot3.watch(app, {
        token: wx_token,
        path: `/${poster.ename}`
    });
}).catch(function (err) {
    console.log('初始化失败: ', err);
});



// 如果需要 session 支持，sessionStore 必须放在 watch 之后
app.use(express.cookieParser());
// 为了使用 waitRule 功能，需要增加 session 支持
app.use(express.session({
    secret: 'abced111',
    store: new express.session.MemoryStore()
}));
// 在生产环境，你应该将此处的 store 换为某种永久存储。
// 请参考 http://expressjs.com/2x/guide.html#session-support

// 在环境变量提供的 $PORT 或 3000 端口监听
var port = process.env.PORT || 3001;
app.listen(port, function() {
    log("Listening on %s", port);
});

// 微信接口地址只允许服务放在 80 端口
// 所以需要做一层 proxy
app.enable('trust proxy');

// 当然，如果你的服务器允许，你也可以直接用 node 来 serve 80 端口
// app.listen(80);

if (!process.env.DEBUG) {
    console.log("set env variable `DEBUG=webot-example:*` to display debug info.");
}