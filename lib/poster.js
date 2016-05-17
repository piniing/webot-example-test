var gm = require('gm');
var request = require('request');
var fs = require('fs');
var _name = "China中文";

var img = 'http://wx.qlogo.cn/mmopen/26eh0ib7BL6KnrJBtIUGDtz2bbWU29LaKy8ibaNbiaUnmHI7EyK67vVoz5WoSFQwmiajBQU3ichHcfmeibcOFhEfic21YeiaibdblISy1/96';
var savePath = '../static/temp/pipe.png';

var stream = request(img).pipe(fs.createWriteStream(savePath));
stream.on('finish', function () {
    createPoster();
})

function createPoster() {
    gm(savePath)
        // .draw('image Over 60,165 100,100 "http://wx.qlogo.cn/mmopen/26eh0ib7BL6KnrJBtIUGDtz2bbWU29LaKy8ibaNbiaUnmHI7EyK67vVoz5WoSFQwmiajBQU3ichHcfmeibcOFhEfic21YeiaibdblISy1/64"')
        .font('../static/simhei.ttf')
        .fontSize(12)
        .fill("blue")
        .stroke("white", 1)
        .drawText(10, 20, _name)
        .write('../static/temp/gm.jpg', function(err) {
            if (!err){
                console.log('done');
            }else{
                console.log(err.message || "出错了！");
            }
        });
}