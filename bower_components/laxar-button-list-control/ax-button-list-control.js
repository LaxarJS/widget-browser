/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'angular',
   'laxar',
   'text!./default.theme/ax-button-list-control.html'
], function( ng, ax, buttonTemplate ) {
   'use strict';

   var DEBOUNCE_TIME_MS = 300;
   var directiveName = 'axButtonList';
   var directive = [ '$compile', function( $compile ) {
      return {
         restrict: 'A',
         scope: true,
         link: function( scope, element, attrs ) {
            var $off = scope.$watch( attrs[ directiveName ], function( newValue ) {
               if( newValue && newValue.length ) {

                  newValue.forEach( function( button ) {
                     var buttonScope = scope.$new();
                     buttonScope.button = button;
                     buttonScope.buttonClicked = ax.fn.debounce( function() {
                        buttonScope.$eval( attrs.axButtonListClick );
                     }, DEBOUNCE_TIME_MS, true );

                     element.append( $compile( buttonTemplate )( buttonScope ) );
                  } );

                  $off();
               }
            } );
         }
      };
   } ];

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( directiveName + 'Control', [] ).directive( directiveName, directive );

} );
