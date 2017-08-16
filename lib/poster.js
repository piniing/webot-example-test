const gm = require('gm').subClass({imageMagick: true});
const request = require('request');
const fs = require('fs');
const path = require('path');
const API = require('./wx_api');

const staticPath = path.resolve(__dirname, '../static');
const ttfPath = staticPath + '/simhei.ttf';
const posterPath = path.resolve(__dirname, '../../poster_pic');

const TEST_OPENID = 'oEL0iuBm5b6W585aJHQKSgtHR8S8';

const POSETR_API_URL = {
    baseUrl: 'http://localhost:3010/poster',
    score() {
        return `${this.baseUrl}/score`;
    },
    score_get(id) {
        return `${this.baseUrl}/score/${id}`;
    },
    score_save() {
        return `${this.baseUrl}/score/save`;
    },
    score_deposit() {
        return `${this.baseUrl}/score/deposit`;
    },
    detail(id) {
        if(!id) return null;
        return `${this.baseUrl}/detail/${id}`;
    }
};

const debug = process.argv[1].indexOf('poster.js') > 0;

const Poster = {
    pid: null,
    ename: null,
    config: null,

    showTimeDiff(tag, time) {
        if(!debug) return;

        this.diffTime = this.diffTime || 0;
        var diff = new Date().getTime() - time;
        console.log(tag, diff - this.diffTime, diff);
        this.diffTime = diff;
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

    // 帮助
    lend(openid, scoreId) {

        var ScoreData = null;

        this._get(POSETR_API_URL.score_get(scoreId))
            .then(result => result && result.result && result.result.data)
            .then(data => !data ? Promise.reject('数据不存在！') : Promise.resolve(data))
            .then(data => {

                ScoreData = data;

                //获取用户信息
                return API.getUserInfo(openid)
                    .then(info => info)
                    .catch(err => Promise.reject(err));
            })
            .then(info => {
                //更新积分
                return this._post(POSETR_API_URL.score_deposit(),{id: scoreId, userinfo: JSON.stringify(info)})
                    .then(result => {
                        if(result.error) Promise.reject(result.message);

                        API.kefu(`恭喜您，你的朋友【${info.nickname}】帮你放牛了，你的积分+1，当前积分为：${ScoreData.score + 1}`, ScoreData.openid);

                        return true;
                    });
                
            })
            .catch(err => {
                console.log('lend error:', err);
            });

        return '感谢您帮您的朋友放牛！你也要参加吗？请输入"放牛"或"fangniu"';
    },

    _get(url) {
        return new Promise((resolve, reject) => {
            request({url: url}, function (error, response, body) {
                if(error || response.statusCode!=200) {
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

    _post(url, data) {
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
        return this._get(POSETR_API_URL.detail(this.pid));
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

                debug && console.log( this );
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
            openid = TEST_OPENID;
        }

        var scoreId = 0;
        var userinfo = null;
        const time1 = new Date().getTime();
        
        // 获取用户信息并生成海报
        return API.getUserInfo(openid)

            // 查询数据库，并生成海报id
            .then((info) => {

                this.showTimeDiff('获取用户信息', time1);

                userinfo = info;
                return this._post(POSETR_API_URL.score(), {pid: this.pid, userinfo: JSON.stringify(info)})
                    .then(result => {
                        if (result.error) {
                            return Promise.reject('生成海报数据出错，原因【' + result.message + '】');
                        } else {
                            return result.result;
                        }
                    }).catch(err => Promise.reject(err));
            })

            // 对查询结果进行相应操作
            .then((result) => {

                this.showTimeDiff('创建海报数据-MYSQL', time1);

                var notOverdue = (t) => {
                    var t1 = new Date().getTime() / 1000;
                    return t1 - t < 3 * 86400; // 3天有效期
                }

                // 如果用户已经创建过海报并且没有过期，直接显示
                if(result.media && notOverdue(result.uptime)){
                    return result.media;
                }

                scoreId = result.score;
                console.log('===========', result);

                // 保存用户二维码
                return this.saveTempQRC(userinfo.openid, result.score)
                    .then(QRCPath => QRCPath)
                    // 保存用户微信头像
                    .then((QRCPath) => {

                        this.showTimeDiff('生成海报ID二维码', time1);

                        return this.saveHeadimg(QRCPath, userinfo)
                            .then(config => config)
                            .catch(err => Promise.reject(err));
                    })

                    // 合并、生成用户海报图片并保存
                    .then(config => {

                        this.showTimeDiff('保存用户头像', time1);

                        return this.createPoster(config)
                            .then(posterSavePath => posterSavePath)
                            .catch(err => Promise.reject(err));
                    })

                    //海报生成成功，上传到微信服务器
                    .then(posterSavePath => {

                        this.showTimeDiff('生成海报图片', time1);

                        return API.uploadMedia(posterSavePath, 'image')
                            .then(media => {

                                // 保存media到数据库 忽略结果
                                this._post(POSETR_API_URL.score_save(), {id: scoreId, media: media.media_id})
                                    .then(r => {
                                        console.log('media:', r);
                                    })
                                    .catch(err => {
                                        console.log(err);
                                    });

                                return media.media_id;
                            })
                            .catch(err => Promise.reject(err));
                    });
            })

            // 上传成功，返回信息
            .then((media_id) => {

                this.showTimeDiff('上传海报成功', time1);

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
    poster.pid = poster_argv.shift(1) || 1;
    poster.init().then(result => {


        // poster.lend('oEL0iuGAdSfJtWbh5cbvKK1ObJjU', 4);

        poster.create(TEST_OPENID).then(function (r) {
            console.log(r);
        }).catch(function (err) {
            console.log('catch2: ', err);
        });

    }).catch(function (err) {
        console.log('catch3: ', err);
    });;
}


