/**
 * @file compile-module.spec.js ~ 2013/09/28 22:27:51
 * @author leeight(liyubei@baidu.com)
 */
var edp = require('edp-core');

var fs = require('fs');
var path = require('path');
var expect = require('expect.js');

var base = require('./base');
var Project = path.resolve(__dirname, 'data', 'dummy-project');
var ConfigFile = path.resolve(Project, 'module.conf');
var ProcessContext = require('../lib/process-context');
var Module = require('../lib/module');
var Reader = require('../lib/reader');
var CompilerContext = require('../lib/compiler-context');

describe('compile-module', function () {
    var processContext;
    var reader;

    beforeEach(function () {
        processContext = new ProcessContext({
            baseDir: Project,
            exclude: [],
            outputDir: 'output',
            fileEncodings: {}
        });
        reader = new Reader(processContext, ConfigFile);

        base.traverseDir(Project, processContext);
        base.traverseDir(path.join(Project, '..', 'base'), processContext);
    });

    function compileModule(code, moduleId, moduleConfig, combine, excludeModules) {
        var bundleConfigs = {};
        bundleConfigs[moduleId] = combine;

        var compilerContext = new CompilerContext(processContext,
                moduleConfig, reader, bundleConfigs);
        var module = new Module(moduleId, compilerContext);
        return module.toBundle();
    }


    it('default `combine` is false', function () {
        var moduleCode = compileModule(
            fs.readFileSync(path.resolve(Project, 'src', 'foo.js'), 'utf-8'),
            'foo',
            ConfigFile,
            false,
            null,
            processContext
        );
        var expectedCode =
        'define(\'foo\', [\n' +
        '    \'require\',\n' +
        '    \'io/File\',\n' +
        '    \'net/Http\',\n' +
        '    \'er/View\'\n' +
        '], function (require) {\n' +
        '    var ioFile = require(\'io/File\');\n' +
        '    var netHttp = require(\'net/Http\');\n' +
        '    var erView = require(\'er/View\');\n' +
        '    return \'foo\';\n' +
        '});';
        expect(moduleCode).to.eql(expectedCode);
    });

    it('dep\'s main module', function () {
        var moduleCode = compileModule(
            fs.readFileSync(path.resolve(Project, 'src', 'bar.js'), 'utf-8'),
            'bar',
            ConfigFile,
            true,
            null,
            processContext
        );

        var expectedCode =
        'define(\'net/Http\', [\'require\'], function (require) {\n' +
        '    return \'net/Http\';\n' +
        '});\n\n' +
        'define(\'er/View\', [\n    \'require\',\n    \'net/Http\'\n], function (require) {\n' +
        '    return require(\'net/Http\') + \';\' + \'er/View\';\n' +
        '});\n\n' +
        'define(\'er/main\', [\n    \'require\',\n    \'./View\'\n], function (require) {\n' +
        '    var view = require(\'./View\');\n' +
        '    return \'er\';\n' +
        '});\n\n' +
        'define(\'er\', [\'er/main\'], function (main) { return main; });\n\n' +
        'define(\'bar\', [\n    \'require\',\n    \'er\'\n], function (require) {\n' +
        '    var er = require(\'er\');\n' +
        '    return er;\n' +
        '});';
        expect(moduleCode).to.eql(expectedCode);
    });

    it('main module', function () {
        var moduleCode = compileModule(
            fs.readFileSync(path.resolve(Project, 'dep', 'er', '3.0.2', 'src', 'main.js'), 'utf-8'),
            'er',
            ConfigFile,
            true,
            null,
            processContext
        );

        var expectedCode =
        'define(\'net/Http\', [\'require\'], function (require) {\n' +
        '    return \'net/Http\';\n' +
        '});\n\n' +
        'define(\'er/View\', [\n    \'require\',\n    \'net/Http\'\n], function (require) {\n' +
        '    return require(\'net/Http\') + \';\' + \'er/View\';\n' +
        '});\n\n' +
        'define(\'er/main\', [\n    \'require\',\n    \'./View\'\n], function (require) {\n' +
        '    var view = require(\'./View\');\n' +
        '    return \'er\';\n' +
        '});\n\n' +
        'define(\'er\', [\'er/main\'], function (main) { return main; });';
        expect(moduleCode).to.eql(expectedCode);
    });

    it('exclude module', function () {
        var moduleCode = compileModule(
            fs.readFileSync(path.resolve(Project, 'dep', 'er', '3.0.2', 'src', 'main.js'), 'utf-8'),
            'er',
            ConfigFile,
            {
                exclude: ['er/*'],
                include: [[[['er/View']]]]
            }
        );

        // XXX(user) 没办法exclude自己.
        var expectedCode =
        'define(\'er/main\', [\n    \'require\',\n    \'./View\'\n], function (require) {\n' +
        '    var view = require(\'./View\');\n' +
        '    return \'er\';\n' +
        '});\n\n' +
        'define(\'er\', [\'er/main\'], function (main) { return main; });';
        expect(moduleCode).to.eql(expectedCode);
    });

    it('exclude module 2', function () {
        var moduleCode = compileModule(
            fs.readFileSync(path.resolve(Project, 'dep', 'er', '3.0.2', 'src', 'main.js'), 'utf-8'),
            'er',
            ConfigFile,
            {
                exclude: ['er/*']
            },
            null,
            processContext
        );

        var expectedCode =
        'define(\'er/main\', [\n    \'require\',\n    \'./View\'\n], function (require) {\n' +
        '    var view = require(\'./View\');\n' +
        '    return \'er\';\n' +
        '});\n\n' +
        'define(\'er\', [\'er/main\'], function (main) { return main; });';
        expect(moduleCode).to.eql(expectedCode);
    });

    it('exclude module 3', function () {
        var moduleCode = compileModule(
            fs.readFileSync(path.resolve(Project, 'dep', 'er', '3.0.2', 'src', 'main.js'), 'utf-8'),
            'er',
            ConfigFile,
            {
                exclude: [[['er/*']]]
            },
            null,
            processContext
        );

        var expectedCode =
        'define(\'er/main\', [\n    \'require\',\n    \'./View\'\n], function (require) {\n' +
        '    var view = require(\'./View\');\n' +
        '    return \'er\';\n' +
        '});\n\n' +
        'define(\'er\', [\'er/main\'], function (main) { return main; });';
        expect(moduleCode).to.eql(expectedCode);
    });

    it('default `combine` is true', function () {
        var moduleCode = compileModule(
            fs.readFileSync(path.resolve(Project, 'src', 'foo.js'), 'utf-8'),
            'foo',
            ConfigFile,
            true,
            null,
            processContext
        );

        var expectedCode =
        'define(\'io/File\', [\'require\'], function (require) {\n' +
        '    return \'io/File\';\n' +
        '});\n\n' +
        'define(\'net/Http\', [\'require\'], function (require) {\n' +
        '    return \'net/Http\';\n' +
        '});\n\n' +
        'define(\'er/View\', [\n    \'require\',\n    \'net/Http\'\n], function (require) {\n' +
        '    return require(\'net/Http\') + \';\' + \'er/View\';\n' +
        '});\n\n' +
        'define(\'foo\', [\n' +
        '    \'require\',\n    \'io/File\',\n    \'net/Http\',\n    \'er/View\'\n' +
        '], function (require) {\n' +
        '    var ioFile = require(\'io/File\');\n' +
        '    var netHttp = require(\'net/Http\');\n' +
        '    var erView = require(\'er/View\');\n' +
        '    return \'foo\';\n' +
        '});';
        expect(moduleCode).to.eql(expectedCode);
    });

    it('combine shuould ignore wrong module', function () {
        var moduleCode = compileModule(
            fs.readFileSync(path.resolve(Project, 'src', 'case138.js'), 'utf-8'),
            'case138',
            ConfigFile,
            true,
            null,
            processContext
        );

        var ast = edp.amd.getAst(moduleCode);

        // 期待进行合并操作后只有一个define调用语句
        // 即没有合并解析失败的模块
        expect(ast.body.length).to.be(3);
    });
});




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
