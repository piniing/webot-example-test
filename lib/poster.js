const gm = require('gm').subClass({imageMagick: true});
const request = require('request');
const fs = require('fs');
const path = require('path');
const API = require('./wx_api');

var staticPath = path.resolve(__dirname, '../static');

const ttfPath = staticPath + '/simhei.ttf';
const posterPath = staticPath + '/poster.jpg';
const headimgurlSize = '64';


// var img = 'http://wx.qlogo.cn/mmopen/26eh0ib7BL6KnrJBtIUGDtz2bbWU29LaKy8ibaNbiaUnmHI7EyK67vVoz5WoSFQwmiajBQU3ichHcfmeibcOFhEfic21YeiaibdblISy1/96';
// var savePath = '../static/temp/pipe.png';

// var stream = request(img).pipe(fs.createWriteStream(savePath));
// stream.on('finish', function () {
//     createPoster();
// })

function createPoster(headimgurlPath, nickname, savePath, callback) {
    gm(posterPath)
        .draw(`image Over 20,435 ${headimgurlSize},${headimgurlSize} "${headimgurlPath}"`)
        .font(ttfPath)
        .fontSize(16)
        // .fill("blue")
        // .stroke("blue", 1)
        .drawText(90, 455, nickname)
        .write(savePath, callback);
}

const create = function (openid) {
    return new Promise((resolve, reject) => {
        API.getUserInfo(openid, function (result) {

            result.then(function (info) {

                var headimgurlPath = staticPath + '/temp/'+ openid +'_0.png';
                var savePath = staticPath + '/temp/'+ openid +'_1.png';

                function createFinish(err) {
                    if (err) { return reject(); }

                    return resolve(true);
                        
                    API.uploadMedia(savePath, 'image', function (media) {
                        // console.log(media);
                        if (err) { return reject(); }

                        return resolve({ type: "image", content: {
                                mediaId: media.media_id
                            }
                        });
                    });

                }

                var headimgurl = info.headimgurl.substr(0, info.headimgurl.lastIndexOf('/') + 1) + headimgurlSize;

                var stream = request(headimgurl).pipe(fs.createWriteStream(headimgurlPath));
                stream.on('finish', function () {
                    createPoster(headimgurlPath, info.nickname, savePath, createFinish);
                });

            }).catch(function () {
                return reject();
            });

        });
    });
    
}

// API.createQRCode(999, function (res) {
//     res.then(function (result) {
//         console.log(result);
//     })
// });
var poster_argv = process.argv.splice(2);

if (poster_argv.length > 0) {
    create('oEL0iuL7_YskvbfiPOa3aR4kbeFs').then(function (r) {
        console.log(r);
    }).catch(function (err) {
        console.log(err);
    })
}

module.exports = create;