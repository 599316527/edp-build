/**
 * @file 模块编译的构建处理器
 * @author errorrik[errorrik@gmail.com]
 *         treelite[c.xinle@gmail.com]
 */

var AbstractProcessor = require( './abstract' );

/**
 * 模块编译的构建处理器
 * 
 * @constructor
 * @param {Object} options 初始化参数
 * @param {string} options.configFile 模块配置文件
 * @param {string} options.entryExtnames 入口文件扩展名列表，`,`分隔的字符串
 */
function ModuleCompiler( options ) {
    AbstractProcessor.call( this, options );

    // init entryExtnames
    var entryExtnames = {};
    var optExtnames = this.entryExtnames || [];
    if ( !(optExtnames instanceof Array) ) {
        optExtnames = optExtnames.split( /\s*,\s*/ );
    }
    optExtnames.forEach(
        function ( extname ) {
            entryExtnames[ extname ] = 1;
        }
    );
    this.entryExtnames = entryExtnames;
}

ModuleCompiler.prototype = new AbstractProcessor();


/**
 * 处理器名称
 * 
 * @type {string}
 */
ModuleCompiler.prototype.name = 'ModuleCompiler';

/**
 * 构建处理
 * 
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
ModuleCompiler.prototype.process = function ( file, processContext, callback ) {
    var path = require( '../util/path' );

    
    var moduleId;
    var extname = file.extname;
    var configFile = path.resolve( processContext.baseDir, this.configFile );

    /**
     * 编译模块
     * 
     * @inner
     * @param {Object} fileInfo 文件信息对象
     * @param {string} modId 模块id
     * @param {boolean} combine 是否合并，编译其依赖模块
     */
    function compileModule( fileInfo, modId, combine ) {
        if ( !fileInfo || file.get( 'module-combined' ) ) {
            return;
        }

        var moduleCode = require( '../util/compile-module' )( 
            fileInfo.rawData, 
            modId, 
            configFile, 
            combine
        );

        // 如果文件内容不是一个模块定义，compileModule返回空对象
        if ( moduleCode !== false ) {
            fileInfo.setData( moduleCode );
            combine && fileInfo.set( 'module-combined', 1 );
        }
    }

    // 如果是js文件，尝试模块编译
    if ( extname === 'js' ) {
        moduleId = require( '../util/get-module-id' )( file.fullPath, configFile );

        if ( moduleId ) {
            compileModule( file, moduleId );
        }
    }

    // 如果是入口文件，尝试搜索入口模块，入口模块以combine模式编译
    if ( !moduleId && this.entryExtnames[ extname ] ) {
        require( '../util/find-entry-modules' )( file.data, extname ).forEach(
            function ( entryModule ) {
                var relativePath = path.relative( 
                    processContext.baseDir, 
                    require( '../util/get-module-file' )( entryModule, configFile ) 
                );
                var entryFile = processContext.files[ relativePath ];

                compileModule( entryFile, entryModule, true );
            }
        );
    }
    
    callback();
};

module.exports = exports = ModuleCompiler;
