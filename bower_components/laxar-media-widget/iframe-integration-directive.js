/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'jquery'
], function() {
   'use strict';

   var directiveName = 'axMediaWidgetIframeIntegration';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createIframeIntegrationDirective() {
      return [ function() {
         return {
            restrict: 'A',
            scope: true,
            link: function( scope, iElement, iAttrs ) {
               var iframe = iElement[0];
               var scopeProperty = iAttrs[ directiveName ];

               scope.$watch( scopeProperty, function () {
                  var name = scope.$eval( scopeProperty );
                  iframe.setAttribute( 'name', name );
                  if( iframe.contentWindow ) {
                     iframe.contentWindow.name = name;
                  }
                  else {
                     iElement.on( 'load', function() {
                        iframe.contentWindow.name = name;
                     } );
                  }
               } );
            }
         };
      } ];
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      define: function( module ) {
         module.directive( directiveName, createIframeIntegrationDirective() );
      }
   };

} );
