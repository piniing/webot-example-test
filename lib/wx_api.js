var config = require('../wx_config');
var log = require('debug')('webot-example:log');
var API = require('wechat-api');
var fs = require('fs');
var path = require('path');

console.log(config);

var token_cache_file = path.resolve(__dirname, 'access_token.txt');
console.log(token_cache_file);

var api = new API(config['appid'], config['secret'], function(callback) {
    // 传入一个获取全局token的方法
    fs.readFile(token_cache_file, 'utf8', function(err, txt) {
        if (err) {
            return callback(err);
        }
        callback(null, JSON.parse(txt));
    });
}, function(token, callback) {
    // 请将token存储到全局，跨进程、跨机器级别的全局，比如写到数据库、redis等
    // 这样才能在cluster模式及多机情况下使用，以下为写入到文件的示例
    fs.writeFile(token_cache_file, JSON.stringify(token), callback);
});

var kefu = [
    {name: '客服1号', id: 'oEL0iuGAdSfJtWbh5cbvKK1ObJjU'}
];

var test_openid = kefu[0]['id'];

exports.createQRCode = function (key, callback) {

    api.createLimitQRCode(key, function (err, result) {
        //返回一个promise
        callback( 
            new Promise((resolve, reject) => {
                if(result && result.ticket) {
                    return resolve(result.ticket);
                } else {
                    return reject();
                }
            }).then(function (ticket) {
                return api.showQRCodeURL(ticket);
            }) 
        );
    });
};

exports.kefu = function (message) {
    log(message);
    api.sendText(test_openid, message, function (err, result) {
        if(err) log(err);
        log(result);
    });
};
