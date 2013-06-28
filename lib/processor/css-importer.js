/**
 * @file CSS import合并的构建处理器
 * @author errorrik[errorrik@gmail.com]
 */

var AbstractProcessor = require( './abstract' );

/**
 * CSS import合并的构建处理器
 * 
 * @constructor
 * @param {Object} options 初始化参数
 */
function CssImporter( options ) {
    AbstractProcessor.call( this, options );
    this.extnames = this.extnames || [ 'css', 'less' ];
}

CssImporter.prototype = new AbstractProcessor();

/**
 * 处理器名称
 * 
 * @type {string}
 */
CssImporter.prototype.name = 'CssImporter';

/**
 * 构建处理
 * 
 * @param {FileInfo} file 文件信息对象
 * @param {ProcessContext} processContext 构建环境对象
 * @param {Function} callback 处理完成回调函数
 */
CssImporter.prototype.process = function ( file, processContext, callback ) {
    var isMatch = false;
    this.extnames.forEach( function ( extname ) {
        if ( extname === file.extname ) {
            isMatch = true;
        }
    } );

    var PROCESSED_PROP = 'cssImporterProcessed';
    if ( isMatch && !file.get( PROCESSED_PROP ) ) {
        var me = this;
        var path = require( '../util/path' );
        var isRelativePath = require( '../util/is-relative-path' );

        var data = file.data.replace( 
            /@import\s+(url\()?\s*(['"])?([^'"\)]+)\2\s*\)?\s*;?/g, 
            function ( match, u, start, url ) {
                if ( isRelativePath( url ) ) {
                    var target = path.relative(
                        processContext.baseDir,
                        path.resolve( path.dirname( file.path ), url )
                    );
                    var targetFile = processContext.getFileByPath( target );

                    // 目标文件可能未被css importer处理过
                    if ( targetFile ) {
                        if ( !targetFile.get( PROCESSED_PROP ) ) {
                            me.process( targetFile, processContext );
                        }

                        return targetFile.data;
                    }
                }

                return match;
                
            } 
        );

        file.setData( data );
        file.set( PROCESSED_PROP, 1 );
    }

    callback && callback();
};

module.exports = exports = CssImporter;
