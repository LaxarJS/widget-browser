/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * https://laxarjs.org/license
 */
/* eslint-env node */

const path = require( 'path' );
const fs = require( 'fs' );

const widgetListFileName = 'widget-list.json';

const ExtractTextPlugin = require( 'extract-text-webpack-plugin' );
const WebpackJasmineHtmlRunnerPlugin = require( 'webpack-jasmine-html-runner-plugin' );
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WriteFilePlugin = require( 'write-file-webpack-plugin' );

const widgetList = require( `./application/assets/${widgetListFileName}` );


module.exports = ( env = {} ) =>
   env.browserSpec ?
      Object.assign( config( env ), {
         entry: WebpackJasmineHtmlRunnerPlugin.entry( './application/widgets/**/spec/*.spec.js' ),
         output: {
            path: resolve( 'spec-output' ),
            publicPath: '/spec-output/',
            filename: '[name].bundle.js'
         }
      } ) :
      config( env );

function config( env ) {
   const outputPath = env.production ? 'dist/' : 'build/';

   const copyFileList = copyFilesForWidgetListing( '' );
   copyFileList.push( {
      from: path.resolve( __dirname, `./application/assets/${widgetListFileName}` ),
      to: path.resolve( __dirname, `./assets/${widgetListFileName}` )
   } );

   let plugins;
   if( env.production ) {
      plugins = [
         new WriteFilePlugin(),
         new ExtractTextPlugin( { filename: '[name].bundle.css' } ),
         new CopyWebpackPlugin( copyFileList )
      ];
   }
   else {
      plugins = [
         new WebpackJasmineHtmlRunnerPlugin()
      ];
   }

   return {
      devtool: '#source-map',
      entry: {
         'init': './init.js'
      },

      output: {
         path: resolve( `./${outputPath}` ),
         publicPath: outputPath,
         filename: env.production ? '[name].bundle.min.js' : '[name].bundle.js',
         chunkFilename: env.production ? '[name].bundle.min.js' : '[name].bundle.js'
      },

      plugins,

      resolve: {
         modules: [ resolve( 'node_modules' ) ],
         extensions: [ '.js' ],
         alias: {
            'default.theme': 'laxar-uikit/themes/default.theme',
            'cube.theme': 'laxar-cube.theme'
         }
      },

      module: {
         rules: [
            {
               test: /\.js$/,
               exclude: resolve( 'node_modules' ),
               loader: 'babel-loader'
            },
            {
               test: /.spec.js$/,
               exclude: resolve( 'node_modules' ),
               loader: 'laxar-mocks/spec-loader'
            },
            {  // load styles, images and fonts with the file-loader
               // (out-of-bundle in build/assets/)
               test: /\.(gif|jpe?g|png|ttf|woff2?|svg|eot|otf)(\?.*)?$/,
               loader: 'file-loader',
               options: {
                  name: env.production ? 'assets/[name]-[sha1:hash:8].[ext]' : 'assets/[name].[ext]'
               }
            },
            {  // ... after optimizing graphics with the image-loader ...
               test: /\.(gif|jpe?g|png|svg)$/,
               loader: 'img-loader?progressive=true'
            },
            {  // ... and resolving CSS url()s with the css loader
               // (extract-loader extracts the CSS string from the JS module returned by the css-loader)
               test: /\.(css|s[ac]ss)$/,
               loader: env.production ?
                  ExtractTextPlugin.extract( {
                     fallback: 'style-loader',
                     use: env.production ? 'css-loader' : 'css-loader?sourceMap',
                     publicPath: ''
                  } ) :
                  'style-loader!css-loader?sourceMap'
            },
            {
               test: /[/]default[.]theme[/].*[.]s[ac]ss$/,
               loader: 'sass-loader',
               options: Object.assign(
                  {},
                  require( 'laxar-uikit/themes/default.theme/sass-options' ),
                  { sourceMap: true }
               )
            },
            {
               test: /[/](laxar-)?cube[.]theme[/].*[.]s[ac]ss$/,
               loader: 'sass-loader',
               options: Object.assign(
                  {},
                  require( 'laxar-cube.theme/sass-options' ),
                  { sourceMap: true }
               )
            }
         ]
      }
   };
}

function resolve( p ) { return path.resolve( __dirname, p ); }

function copyFilesForWidgetListing( publicPath ) {
   const copyOperations = [];

   widgetList.forEach( widgetPath => {
      const sourcePath = path.resolve( __dirname, `./${widgetPath}` );
      const buildPath = path.resolve( __dirname, `./${publicPath}/assets/widgets/${widgetPath}` );

      [ 'package.json', 'widget.json', 'README.md', 'docs' ].forEach( fileName => {

         fs.exists( path.resolve( sourcePath, fileName ), exists => {
            if( !exists ) { return; }
            copyOperations.push( {
               from: path.resolve( sourcePath, fileName ),
               to: path.resolve( buildPath, fileName )
            } );
         } );
      } );
   } );
   return copyOperations;
}
