/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/*global module,__dirname,__filename */
module.exports = function( grunt ) {
   'use strict';

   var path = require( 'path' );
   var _ = grunt.util._;

   var serverPort = 8003;
   var testPort = 1000 + serverPort;
   var liveReloadPort = 30000 + serverPort;

   grunt.initConfig( {
      pkg: grunt.file.readJSON( 'package.json' ),
      'laxar-configure': {
         options: {
            flows: [
               { target: 'main', src: 'application/flow/flow.json' }
            ],
            ports: {
               develop: serverPort,
               test: testPort,
               livereload: liveReloadPort
            }
         }
      },

      'laxar-compass': {
         options: {
            compass: './tools/bin/compass'
         }
      },

      watch: {
         options: {
            debounceDelay: 50
         },
         'laxar-reload': {
            files: [
               'includes/lib/laxar/laxar.js',
               'includes/lib/laxar/lib/**'
            ]
         },
         'laxar-patterns-reload': {
            files: [
               'includes/lib/laxar-patterns/laxar-patterns.js',
               'includes/lib/laxar-patterns/lib/**'
            ]
         }
      }
   } );

   /* Find all widget.json files,
    * take their directory names,
    * create or update the configuration */
   grunt.file.expand( 'includes/widgets/*/*/widget.json' )
      .map( path.dirname )
      .forEach( function( widget ) {
         var config = grunt.config( 'widget.' + widget );
         grunt.config( 'widget.' + widget, _.defaults( {}, config ) );
         grunt.config( 'watch.' + widget, {
            files: [
               widget + '/!(bower_components|node_modules)',
               widget + '/!(bower_components|node_modules)/**',
               '!' + widget + '/**/*.scss'
            ]
         } );
      } );

   //////////////////////////////////////////////////////////////////////////////////////////////////////////

   grunt.loadNpmTasks( 'grunt-laxar' );

   // basic aliases
   grunt.registerTask( 'test', [ 'laxar-test' ] );
   grunt.registerTask( 'build', [ 'laxar-build' ] );
   grunt.registerTask( 'dist', [ 'laxar-dist' ] );
   grunt.registerTask( 'develop', [ 'laxar-develop' ] );

   // additional (possibly) more intuitive aliases
   grunt.registerTask( 'optimize', [ 'laxar-dist' ] );
   grunt.registerTask( 'start', [ 'laxar-develop' ] );
   grunt.registerTask( 'start-no-watch', [ 'laxar-develop-no-watch' ] );
   grunt.registerTask( 'default', [ 'build', 'test' ] );

};
