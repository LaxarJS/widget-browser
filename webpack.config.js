/**
 * Copyright 2017
 * Released under the MIT license
 */
const path = require( 'path' );
const ExtractTextPlugin = require( 'extract-text-webpack-plugin' );
const WebpackJasmineHtmlRunnerPlugin = require( 'webpack-jasmine-html-runner-plugin' );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = ( env = {} ) => {

   const publicPath = env.production ? '/dist/' : '/build/';

   return {
      devtool: '#source-map',
      entry: {
         'init': './init.js'
      },

      output: {
         path: path.resolve( __dirname, `./${publicPath}` ),
         publicPath,
         filename: env.production ? '[name].bundle.min.js' : '[name].bundle.js'
      },

      plugins: [
         ...( env.production ? [ new ExtractTextPlugin( { filename: '[name].bundle.css' } ) ] : [] )
      ],

      resolve: {
         modules: [ path.resolve( __dirname, 'node_modules' ) ],
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
                  name: env.production ? 'assets/[name]-[sha1:hash:8].[ext]' : 'assets/[path]-[name].[ext]'
               }
            },
            {  // ... after optimizing graphics with the image-loader ...
               test: /\.(gif|jpe?g|png|svg)$/,
               loader: 'img-loader?progressive=true'
            },
            {  // ... and resolving CSS url(s) with the css loader
               // (extract-loader extracts the CSS string from the JS module returned by the css-loader)
               test: /\.(css|s[ac]ss)$/,
               loader: env.production ?
                  ExtractTextPlugin.extract( { fallback: 'style-loader', use: 'css-loader' } ) :
                  'style-loader!css-loader'
            },
            {
               test: /[/]default[.]theme[/].*[.]s[ac]ss$/,
               loader: 'sass-loader',
               options: require( 'laxar-uikit/themes/default.theme/sass-options' )
            },
            {
               test: /[/](laxar-)?cube[.]theme[/].*[.]s[ac]ss$/,
               loader: 'sass-loader',
               options: require( 'laxar-cube.theme/sass-options' )
            }
         ]
      }
   };
}

function resolve( p ) { return path.resolve( __dirname, p ); }
