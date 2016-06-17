var debug = require('debug');
var log = debug('webot-example:log');
var verbose = debug('webot-example:verbose');
var error = debug('webot-example:error');

var API = require('../lib/wx_api');

//初始化poster插件
const init = function(posterId, callback) {
    const poster = require('../lib/poster')(posterId);

    return poster.init().then(result => result);
};

/**
 * 初始化路由规则
 */
const webotSet = function(webot, poster) {

    var reg_help = /^(help|\?)$/i
    webot.set({
        // name 和 description 都不是必须的
        name: 'hello help',
        description: '获取使用帮助，发送 help',
        pattern: function(info) {
            //首次关注时,会收到subscribe event
            return info.is('event') && info.param.event === 'subscribe' || reg_help.test(info.text);
        },
        handler: function(info) {

            if (info.param.eventKey && info.param.eventKey == 'qrscene_999') {
                API.kefu(poster.helpMessage(), info.uid);
            }

            // var reply = '让我们一起，到广阔的天地中，去聆听大自然的教诲！感谢您收听放牛娃。';

            var reply = {
                title: '让我们一起，到广阔的天地中，去聆听大自然的教诲！',
                pic: 'http://webot.tjaja.com/static/subscribe.jpg',
                url: 'http://webot.tjaja.com/static/subscribe.jpg',
                description: [
                    'hi，我是牛小二，感谢您收听放牛娃亲子圈，目前公众号正在开发中……',
                ].join('\n')
            };
            // 返回值如果是list，则回复图文消息列表
            return reply;
        }
    });

    // 回复图文消息
    webot.set('reply_news', {
        description: '发送news,我将回复图文消息你',
        pattern: /^news\s*(\d*)$/,
        handler: function(info) {
            var reply = [{
                title: '微信机器人',
                description: '微信机器人测试帐号：webot',
                pic: 'https://raw.github.com/node-webot/webot-example/master/qrcode.jpg',
                url: 'https://github.com/node-webot/webot-example'
            }, {
                title: '豆瓣同城微信帐号',
                description: '豆瓣同城微信帐号二维码：douban-event',
                pic: 'http://i.imgur.com/ijE19.jpg',
                url: 'https://github.com/node-webot/weixin-robot'
            }, {
                title: '图文消息3',
                description: '图文消息描述3',
                pic: 'https://raw.github.com/node-webot/webot-example/master/qrcode.jpg',
                url: 'http://www.baidu.com'
            }];
            // 发送 "news 1" 时只回复一条图文消息
            return Number(info.param[1]) == 1 ? reply[0] : reply;
        }
    });

    // 可以指定图文消息的映射关系
    webot.config.mapping = function(item, index, info) {
        //item.title = (index+1) + '> ' + item.title;
        return item;
    };


    // 定义一个 wait rule
    webot.waitRule('customer_service', function(info) {
        var r = info.text;

        // 用户不想玩了...
        if (r === '退出') {
            info.resolve();
            return '感谢您的支持，再见！';
        }

        var openid = info.session.kefu_answer;

        var rewaitCount = info.session.rewait_count || 0;
        if (rewaitCount >= 10) {
            return '结束对话！';
        }

        //重试
        info.rewait();
        API.kefu(openid + ' : ' + r);
        return '嗯，收到！';
        // return (r > num ? '大了': '小了') +',还有' + (2 - rewaitCount) + '次机会,再猜.';
    });

    webot.set('kefu', {
        description: '发送客服消息',
        pattern: /(?:kefu|客服)\s*(\d*)/,
        handler: function(info) {

            var openid = info.uid;

            info.session.kefu_answer = openid;

            info.wait('customer_service');
            return '等待客服接入，您可以先提问，如果要结束服务，请回复：退出';
        }
    });


    webot.set({
        // name 和 description 都不是必须的
        name: 'create_qrc',
        description: '创建二维码',
        pattern: /^ewm(\d+)$/i,
        handler: function(info, next) {

            var num = Number(info.param[1]);
            API.createQRCode(num).then((url) => next(null, {
                title: '亲，二维码[' + num + ']已帮您生成！',
                url: url,
                picUrl: url,
                description: '亲，二维码[' + num + ']已帮您生成！',
            })).catch((errMsg) => {
                console.log(errMsg);
                return next(null, errMsg);
            });
        }
    });

    webot.set({
        // name 和 description 都不是必须的
        name: 'EVENT_SCAN_KEY',
        description: '场景二维码扫描事件，特定值',
        pattern: function(info) {
            //场景二维码扫描事件
            return info.is('event') && info.param.event === 'SCAN' && info.param.eventKey == 10000;
        },
        handler: function(info) {
            return '一万';
        }
    });

    webot.set({
        // name 和 description 都不是必须的
        name: 'EVENT_SCAN_KEY2',
        description: '场景二维码扫描事件，特定值999',
        pattern: function(info) {
            //场景二维码扫描事件
            return info.is('event') && info.param.event === 'SCAN' && info.param.eventKey == 999;
        },
        handler: function(info) {
            return poster.helpMessage();
        }
    });

    webot.set({
        // name 和 description 都不是必须的
        name: 'EVENT_SCAN',
        description: '场景二维码扫描事件',
        pattern: function(info) {
            //场景二维码扫描事件
            return info.is('event') && info.param.event === 'SCAN';
        },
        handler: function(info) {
            return info.param.eventKey;
        }
    });

    webot.set('meme', {
        description: '获取用户信息',
        pattern: /(?:my|me|user|我的|我的信息)\s*(\d*)/,
        handler: function(info, next) {

            var openid = info.uid;

            API.getUserInfo(openid).then((result) => {
                // console.log('userinfo: ', result);
                var reply = {
                    title: 'hi,' + result.nickname,
                    url: result.headimgurl,
                    picUrl: result.headimgurl,
                    description: JSON.stringify(result),
                };

                return next(null, reply);

            }).catch(() => next(null, '抱歉，我们暂时无法处理您的请求！'));
        }
    });

    webot.set('fangniu', {
        description: 'fangniu',
        pattern: /(?:放牛|fangniu)\s*(\d*)/,
        handler: function(info, next) {

            var openid = info.uid;

            poster.create(openid).then(function(reply) {
                console.log('reply: ', reply);
                return next(null, reply);

            }).catch((err) => {
                console.log(`生成海报失败了，[${pid}] - [${openid}]: `, err);
                return next(null, '抱歉，海报生成失败了，请再试一次！');
            });
            // .catch(function() {
            //     return next(null, '生成失败了！');
            // })
        }
    });


    //所有消息都无法匹配时的fallback
    webot.set(/.*/, function(info) {
        // 利用 error log 收集听不懂的消息，以利于接下来完善规则
        // 你也可以将这些 message 存入数据库
        log('unhandled message: %s', info.text);
        info.flag = true;
        return '你发送了「' + info.text + '」,可惜我太笨了,听不懂. 发送: help 查看可用的指令';
    });
};

module.exports = {
    init: init,
    webotSet: webotSet
};
