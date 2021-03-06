/**
 * @file processor-exclude-support.spec.js ~ 2014/02/25 15:19:06
 * @author leeight(liyubei@baidu.com)
 * 检查processor是否支持exclude和include
 * 主要检查的问题是，继承了AbstractProcessor之后，重写isExclude方法的时候，
 * 忘记调用superClass的方法去检查exclude属性了
 */
var path = require('path');
var fs = require('fs');

var expect = require('expect.js');

var base = require('./base');

var ctors = [];

fs.readdirSync(path.join(__dirname, '../lib/processor')).forEach(function (file) {
    if (/\.js$/.test(file)) {
        ctors.push([path.basename(file), require('../lib/processor/' + file)]);
    }
});

describe('processor-exclude-support', function () {
    var fileData = base.getFileInfo('data/css-compressor/default.css', __dirname);
    ctors.forEach(function (item) {
        it(item[0], function () {
            var Ctor = item[1];
            if (typeof Ctor !== 'function') {
                return;
            }

            var instance = new Ctor({
                exclude: ['*'],
                include: ['default.css']
            });
            expect(instance.isExclude(fileData)).to.be(true);
            expect(instance.isInclude(fileData)).to.be(true);
        });
    });
});




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
