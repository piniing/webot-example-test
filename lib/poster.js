const gm = require('gm').subClass({imageMagick: true});
const request = require('request');
const fs = require('fs');
const path = require('path');
const API = require('./wx_api');

const staticPath = path.resolve(__dirname, '../static');
const ttfPath = staticPath + '/simhei.ttf';
const posterPath = '/webs/javascript/webot/poster/';
const getConfigUrl = 'http://localhost:3000/api/poster/';


const Poster = {
    pid: null,
    ename: null,
    config: null,

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
            }, function(err, req, res) {
                try {
                    res = JSON.parse(res);
                } catch ($e) {}

                resolve(res);

            });

        });
    },

    getConfig(callback) {
        return new Promise((resolve, reject) => {
            request({url: getConfigUrl + this.pid}, function (error, response, body) {
                if(error) {
                    console.log('getConfigError:', error);
                    return reject(error);
                }else{
                    return resolve(JSON.parse(body));
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
                    headimg: 64,
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

    createPoster(config, callback) {

        const poster = config.poster;
        const savePath = config.savePath;
        const nickname = config.nickname;
        const headimgurlPath = config.headimgurlPath;

        const headimg = config.headimg;
        const fontSize = config.fontSize;
        const loc1 = config.headimgLocation;
        const loc2 = config.nicknameLocation;

        gm(poster)
            .draw(`image Over ${loc1.x},${loc1.y} ${headimg},${headimg} "${headimgurlPath}"`)
            .font(ttfPath)
            .fontSize(fontSize)
            // .fill("blue")
            // .stroke("blue", 1)
            .drawText(loc2.x, loc2.y, nickname)
            .quality(85)
            .write(savePath, callback);
    },

    saveHeadimg(info) {
        var openid = info.openid;
        var dir = this.getDirectory(this.pid);
        var savePath = dir + openid + '_1.jpg';
        var headimgurlPath = dir + openid + '_0.png';

        return new Promise((resolve, reject) => {

            var headimgurl = info.headimgurl.substr(0, info.headimgurl.lastIndexOf('/') + 1) + this.config.headimg;
            var stream = request(headimgurl).pipe(fs.createWriteStream(headimgurlPath));

            stream.on('finish', () => {
                return resolve(Object.assign({}, this.config, {
                    savePath: savePath,
                    nickname: info.nickname,
                    headimgurlPath: headimgurlPath
                }));
            });

            stream.on('error', (err) => {
                return resolve(err);
            });
        });
    },

    create(openid) {
        if (openid == 'client') {
            openid = 'oEL0iuL7_YskvbfiPOa3aR4kbeFs';
        }

        var t1 = new Date().getTime();
        
        // 获取用户信息并生成海报
        return API.getUserInfo(openid)

            // 保存用户微信头像
            .then((info) => this.saveHeadimg(info))

            // 创建并保存用户海报图片
            .then(createConfig => new Promise((resolve, reject) => {
                this.createPoster(createConfig, (err) => {
                    console.log('finish', new Date().getTime() - t1);
                    // 返回海报图片文件路径
                    return !err ? resolve( createConfig.savePath ) : reject(err);
                });  
            }))

            //海报生成成功，上传到微信服务器
            .then(posterSavePath => API.uploadMedia(posterSavePath, 'image'))

            // 上传成功，返回信息
            .then((media) => {
                console.log('uploaded', new Date().getTime() - t1);
                return {
                    type: "image",
                    content: {
                        mediaId: media.media_id
                    }
                };
            })

            
    },

    tempQRC() {
        API.createTempQRCode(999, 30*86400, function (res) {
            res.then(function (result) {
                console.log(result);
            })
        });
    }

};

module.exports = function (posterId) {
    const poster = Object.create(Poster);
    poster.pid = posterId;
    return poster;
}



var poster_argv = process.argv.splice(2);

if (poster_argv.length > 0) {
    const poster = Object.create(Poster);
    poster.init(poster_argv.shift(1) || 4);
    poster.create('oEL0iuL7_YskvbfiPOa3aR4kbeFs').then(function (r) {
        console.log(r);
    }).catch(function (err) {
        console.log('catch2: ', err);
    })

}


