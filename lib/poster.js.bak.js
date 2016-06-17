

// const headimgurlSize = '64';


// var fileExists = function (path) {
//     return fs.existsSync(path);
// }

// var checkDirectory = function (path) {
//     console.log('path:', path);
//     path = getDirectory(path);
//     if(!fileExists(path)) {
//         return fs.mkdirSync(path);
//     }

//     return true;
// }

// var getDirectory = function (poster_name) {
//     return staticPath + '/' + poster_name + '/';
// }

// function createPoster(headimgurlPath, nickname, savePath, callback) {
//     gm(posterPath)
//         .draw(`image Over 20,435 ${headimgurlSize},${headimgurlSize} "${headimgurlPath}"`)
//         .font(ttfPath)
//         .fontSize(16)
//         // .fill("blue")
//         // .stroke("blue", 1)
//         .drawText(90, 455, nickname)
//         .quality(85)
//         .write(savePath, callback);
// }


// const create = function (openid, posterName) {

//     console.log(openid, posterName);
//     if(openid=='client')
//         openid = 'oEL0iuL7_YskvbfiPOa3aR4kbeFs';

//     posterName = posterName || 'temp';
//     var t1 = new Date().getTime();

//     return new Promise((resolve, reject) => {
//         API.getUserInfo(openid, function (result) {

//             result.then(function (info) {

//                 var dir = getDirectory(posterName);

//                 var savePath = dir + openid + '_1.jpg';
//                 var headimgurlPath = dir + openid +'_0.png';

//                 function createFinish(err) {
//                     if (err) { return reject(err); }

//                     // console.log('finish', new Date().getTime() - t1);
//                     // return resolve(true);
                        
//                     API.uploadMedia(savePath, 'image', function (media) {
//                         console.log('upload', new Date().getTime() - t1);
//                         // console.log(media);
//                         if (err) { return reject(err); }

//                         return resolve({ type: "image", content: {
//                                 mediaId: media.media_id
//                             }
//                         });
//                     });

//                 }

//                 var headimgurl = info.headimgurl.substr(0, info.headimgurl.lastIndexOf('/') + 1) + headimgurlSize;

//                 var stream = request(headimgurl).pipe(fs.createWriteStream(headimgurlPath));
//                 stream.on('finish', function () {
//                     createPoster(headimgurlPath, info.nickname, savePath, createFinish);
//                 });

//             }).catch(function (err) {
//                 console.log('catch', err);
//                 return reject();
//             });

//         });
//     });
    
// }

// API.createQRCode(999, function (res) {
//     res.then(function (result) {
//         console.log(result);
//     })
// });

// var poster_argv = process.argv.splice(2);

// if (poster_argv.length > 0) {
//     create('oEL0iuL7_YskvbfiPOa3aR4kbeFs', poster_argv.shift(1)).then(function (r) {
//         console.log(r);
//     }).catch(function (err) {
//         console.log(err);
//     })
// }

// exports.fileExists = fileExists;
// exports.checkDirectory = checkDirectory;
// exports.create = create;
// exports.helpMessage = function () {
//     return '感谢您帮您的朋友放牛！你也要参加吗？请输入"放牛"或"fangniu"';
// }

