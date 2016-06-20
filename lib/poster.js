const gm = require('gm').subClass({imageMagick: true});
const request = require('request');
const fs = require('fs');
const path = require('path');
const API = require('./wx_api');

const staticPath = path.resolve(__dirname, '../static');
const ttfPath = staticPath + '/simhei.ttf';
const posterPath = '/webs/javascript/webot/poster/';

const POSETR_API_URL = {
    'root': 'http://localhost:3000/poster',
    score() {
        return `${this.root}/score`;
    },
    detail(id) {
        if(!id) return null;
        return `${this.root}/detail/${id}`;
    }
};

const debug = process.argv[1].indexOf('poster.js') > 0;

console.log(debug);

const Poster = {
    pid: null,
    ename: null,
    config: null,
    diffTime: 0,

    showTimeDiff(tag, time) {
        var time = new Date().getTime();
        debug && console.log(tag, time - this.diffTime);
        this.diffTime = time;
    },

    fileExists(path) {
        return fs.existsSync(path);
    },

    checkDirectory(path) {
        path = this.getDirectory(path);
        if(!this.fileExists(path)) {
            return fs.mkdirSync(path);
        }

        return true;
    },

    getDirectory(posterId) {
        return staticPath + '/poster_' + posterId + '/';
    },

    helpMessage() {
        return '感谢您帮您的朋友放牛！你也要参加吗？请输入"放牛"或"fangniu"';
    },

    post(url, data) {
        return new Promise((resolve, reject) => {
            request.post(url, {
                form: data
            }, function(error, response, body) {
                if(error || response.statusCode!=200) {
                    return reject(error);
                }else{
                    try { body = JSON.parse(body); } catch ($e) {}

                    return resolve(body);
                }
            });

        });
    },

    getConfig(callback) {
        return new Promise((resolve, reject) => {
            request({url: POSETR_API_URL.detail(this.pid)}, function (error, response, body) {
                if(error || response.statusCode!=200) {
                    console.log('getConfigError:', error);
                    return reject(error);
                }else{
                    try{
                        var result = JSON.parse(body);
                    }catch(err) {
                        return reject(err);
                    }
                    return resolve(result);
                }
            });
        })
    },

    init() {
        return this.getConfig().then((result) => {
            if(!result || typeof(result.error)=='number'){
                var message = result.message || '活动数据不存在！';
                return Promise.reject(new Error(this.pid + '，' + message));
            }else{
                result = result.result.data;
                this.checkDirectory( this.pid );
                this.ename = result.ename;
                this.config = {
                    poster: posterPath + result.source_pic,
                    headimgSize: 64,
                    QRCSize: 130,
                    headimgLocation: {x: result.loc1x, y: result.loc1y},
                    nicknameLocation: {x: result.loc2x, y: result.loc2y},
                    QRCLocation: {x: result.loc3x, y: result.loc3y},
                    fontSize: 16,
                };

                console.log( this );
                return Promise.resolve(this);
            }
        });
    },

    createPoster(config) {

        const poster = config.poster;
        const QRCPath = config.QRCPath;
        const savePath = config.savePath;
        const nickname = config.nickname;
        const headimgurlPath = config.headimgurlPath;

        const QRCSize = config.QRCSize;
        const headimgSize = config.headimgSize;
        const fontSize = config.fontSize;
        const loc1 = config.headimgLocation;
        const loc2 = config.nicknameLocation;
        const loc3 = config.QRCLocation;

        return new Promise((resolve, reject) => {
            gm(poster)
                .draw(`image Over ${loc1.x},${loc1.y} ${headimgSize},${headimgSize} "${headimgurlPath}"`)
                .draw(`image Over ${loc3.x},${loc3.y} ${QRCSize},${QRCSize} "${QRCPath}"`)
                .font(ttfPath)
                .fontSize(fontSize)
                // .fill("blue")
                // .stroke("blue", 1)
                .drawText(loc2.x, loc2.y, nickname)
                .quality(85)
                .write(savePath, (err) => {
                    return !err ? resolve(savePath) : reject();
                });
        });

        
    },

    saveHeadimg(QRCPath, info) {
        var openid = info.openid;
        var dir = this.getDirectory(this.pid);
        var savePath = dir + openid + '_1.jpg';
        var headimgurlPath = dir + openid + '_0.png';

        return new Promise((resolve, reject) => {

            var headimgurl = info.headimgurl.substr(0, info.headimgurl.lastIndexOf('/') + 1) + this.config.headimgSize;
            var stream = request(headimgurl).pipe(fs.createWriteStream(headimgurlPath));

            stream.on('finish', () => {
                return resolve(Object.assign({}, this.config, {
                    savePath: savePath,
                    nickname: info.nickname,
                    headimgurlPath: headimgurlPath,
                    QRCPath: QRCPath
                }));
            });

            stream.on('error', (err) => {
                return resolve(err);
            });
        });
    },

    saveTempQRC(openid, score) {
        var QRCPath = this.getDirectory(this.pid) + openid + '_qrc.png';

        return API.createTmpQRCode(score, 30*86400).then(url => new Promise((resolve, reject) => {

            // return resolve(url);
            var stream = request(url).pipe(fs.createWriteStream(QRCPath));

            stream.on('finish', () => {
                return resolve(QRCPath);
            });

            stream.on('error', (err) => {
                return resolve(err);
            });
        }));


    },

    create(openid) {
        if (openid == 'client') {
            openid = 'oEL0iuBm5b6W585aJHQKSgtHR8S8';
        }

        this.diffTime = new Date().getTime();
        var userinfo = null;
        
        // 获取用户信息并生成海报
        return API.getUserInfo(openid)

            // 提交用户信息保存到数据库，并生成海报id
            // TODO::提交数据到mysql => poster_score表
            .then((info) => {

                this.showTimeDiff('获取用户信息');

                userinfo = info;
                return this.post(POSETR_API_URL.score(), {pid: this.pid, userinfo: JSON.stringify(info)})
                    .then(result => {
                        if (result.error) {
                            return Promise.reject('生成海报数据出错，原因【' + result.message + '】');
                        } else {
                            return result.result;
                        }
                    });
            })

            // 保存用户二维码
            .then((result) => {

                this.showTimeDiff('创建海报数据-MYSQL');

                return this.saveTempQRC(userinfo.openid, result.score)
                    .then(QRCPath => QRCPath)
                    .catch(err => Promise.reject(err));
            })

            // 保存用户微信头像
            .then((QRCPath) => {

                this.showTimeDiff('生成海报ID二维码');

                return this.saveHeadimg(QRCPath, userinfo)
                    .then(config => config)
                    .catch(err => Promise.reject(err));
            })

            // 合并、生成用户海报图片并保存
            .then(config => {

                this.showTimeDiff('保存用户头像');

                return this.createPoster(config)
                    .then(posterSavePath => posterSavePath)
                    .catch(err => Promise.reject(err));
            })

            //海报生成成功，上传到微信服务器
            .then(posterSavePath => {

                this.showTimeDiff('生成海报图片');

                return API.uploadMedia(posterSavePath, 'image')
                    .then(media => media.media_id)
                    .catch(err => Promise.reject(err));
            })

            // 上传成功，返回信息
            .then((media_id) => {

                this.showTimeDiff('上传成功');

                return {
                    type: "image",
                    content: {
                        mediaId: media_id
                    }
                };
            })

            .catch(err => {
                console.log(`生成海报失败了，[${this.ename}_${this.pid}] - [${openid}]: `, err);
                return Promise.reject(err);
            })
    }

};

module.exports = function (posterId) {
    const poster = Object.create(Poster);
    poster.pid = posterId;
    return poster;
}

var poster_argv = process.argv.splice(2);

if (poster_argv.length > 0 || debug) {
    const poster = Object.create(Poster);
    poster.pid = poster_argv.shift(1) || 4;
    poster.init().then(result => {

        poster.create('oEL0iuBm5b6W585aJHQKSgtHR8S8').then(function (r) {
            console.log(r);
        }).catch(function (err) {
            console.log('catch2: ', err);
        });

    });
}


