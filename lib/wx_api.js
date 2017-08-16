var config = require('./wx_config');
var log = require('debug')('webot-example:log');
var API = require('wechat-api');
var fs = require('fs');
var path = require('path');

console.log(config);

const _promise = function (func) {
    return new Promise((resolve, reject) => {
        func(resolve, reject);
    });
}

const token_cache_file = path.resolve(__dirname, 'access_token.txt');
console.log(token_cache_file);

const api = new API(config['appid'], config['secret'], function(callback) {
    // 传入一个获取全局token的方法
    fs.readFile(token_cache_file, 'utf8', function(err, txt) {
        if (err) {
            return callback(err);
        }
        callback(null, JSON.parse(txt));
    });
}, function(token, callback) {
    // console.log(token);
    // 请将token存储到全局，跨进程、跨机器级别的全局，比如写到数据库、redis等
    // 这样才能在cluster模式及多机情况下使用，以下为写入到文件的示例
    fs.writeFile(token_cache_file, JSON.stringify(token), callback);
});

var kefu = [
    {name: '客服1号', id: 'oEL0iuGAdSfJtWbh5cbvKK1ObJjU'}
];

var test_openid = kefu[0]['id'];

exports.createQRCode = function (key) {
    return _promise((resolve, reject) => {

        api.createLimitQRCode(key, (err, result) => {

            return result && result.ticket ? resolve(result.ticket) : reject('创建二维码失败了！');

        });

    }).then((ticket) => api.showQRCodeURL(ticket));
}

exports.createTmpQRCode = function (key, time) {
    return _promise((resolve, reject) => {

        api.createTmpQRCode(key, time, (err, result) => {

            return result && result.ticket ? resolve(result.ticket) : reject('创建临时二维码失败了！');

        });

    }).then((ticket) => api.showQRCodeURL(ticket));
};

var getUserInfo = function (openid) {
    openid = !openid || openid=='client' ? test_openid : openid;
    
    return _promise((resolve, reject) => {
        api.getUser(openid, (err, result) => {
            err && console.log(`获取用户信息失败！【${openid}】：`, err);
            return !err ? resolve(result) : reject(err);
        });
    });
}

function _kefu(message, openid) {
    log(message);
    
    openid = !openid || openid=='client' ? test_openid : openid;
    api.sendText(openid, message, function (err, result) {
        if(err) log(err);
        console.log(result);
    });
}

exports.uploadMedia = function (filePath, type) {
    type = type || 'image';

    return _promise((resolve, reject) => {
        api.uploadMedia(filePath, type, (err, result) => !err ? resolve(result) : reject(err));
    });
};

function semantic (openid, query) {
    var opts = {
        'query': query,
        'city': '福州',
        'category': 'cookbook',
    };

    console.log(openid, opts);

    return _promise((resolve, reject) => {

        api.semantic(openid, opts, (err, result) => !err ? resolve(result) : reject(err));
    });
}

exports.kefu = _kefu;
exports.getUserInfo = getUserInfo;
exports.semantic = semantic;

// getUserInfo(test_openid)
//     .then(r => console.log(JSON.stringify(r)))
//     .catch(r => console.log(JSON.stringify(r)));

// semantic(test_openid, '西红柿炒蛋？').then(result => {
//     console.log('result', result);
// }).catch(err => {
//     console.log('ERROR: ', err);
// })
