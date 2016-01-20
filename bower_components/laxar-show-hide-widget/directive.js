/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'angular',
   'jquery',
   'laxar'
], function( ng, $, ax, undefined ) {
   'use strict';

   var DIRECTIVE_NAME = 'axShowHideWidgetDirective';
   var STATE = 'axShowHideWidgetDirectiveState';

   var RESIZE_DELAY = 25;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createShowHideWidgetDirective() {
      return [ '$window', 'axVisibilityService', function( $window, visibilityService ) {
         return {
            restrict: 'A',
            link: function( scope, element, attrs ) {

               var options = scope.$eval( attrs[ DIRECTIVE_NAME ] );

               var show;
               var hide;
               if( options.animationsEnabled ) {
                  show = function() {
                     element.css( 'display', 'block' );
                     var height = calculateContentHeight( element );
                     animateToHeight( element, height );
                  };
                  hide = function() {
                    animateToHeight( element, 0 );
                  };
               }
               else {
                  show = function() { element.show(); };
                  hide = function() { element.hide(); };
               }

               var fixContainerSize = ax.fn.debounce( fixContainerSizeNow, RESIZE_DELAY );

               var widgetIsVisible;
               var showContent;
               var currentTargetHeight = 0;

               handleStateChange( scope.$eval( attrs[ STATE ] ) );
               scope.$watch( attrs[ STATE ], handleStateChange );

               visibilityService.handlerFor( scope ).onChange( handleWidgetVisibilityChange );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               function handleStateChange( newShowContent ) {
                  if( showContent === newShowContent ) {
                     return;
                  }
                  if( newShowContent ) {
                     if( showContent === undefined ) {
                        // initial show: no animations
                        element.show();
                     }
                     else {
                        show();
                        if( options.animationsEnabled && widgetIsVisible ) {
                           startWatchingForContentResizing();
                        }
                     }
                  }
                  else {
                     hide();
                     stopWatchingForContentResizing();
                  }
                  showContent = newShowContent;
               }

               ///////////////////////////////////////////////////////////////////////////////////////////////

               function handleWidgetVisibilityChange( newVisible, previousVisible ) {
                  widgetIsVisible = newVisible;
                  if( widgetIsVisible && previousVisible === false && showContent && options.animationsEnabled ) {
                     startWatchingForContentResizing();
                  }
                  else {
                     stopWatchingForContentResizing();
                  }
               }

               ///////////////////////////////////////////////////////////////////////////////////////////////

               function fixContainerSizeNow() {
                  if( !showContent || !scope.isVisible ) { return; }
                  var contentHeight = 0;
                  element.children().each( function( index, child ) {
                     contentHeight += $( child ).outerHeight( true );
                  } );
                  if( contentHeight !== currentTargetHeight ) {
                     animateToHeight( element, contentHeight );
                     // if this widget contains another animated widget (such as another AxShowHideWidget),
                     // make sure to pick up on its animated content
                     $window.setTimeout( fixContainerSize, RESIZE_DELAY );
                  }
               }

               ///////////////////////////////////////////////////////////////////////////////////////////////

               var clearWatcher;
               function startWatchingForContentResizing() {
                  if( !clearWatcher ) {
                     clearWatcher = scope.$watch( function() {
                        fixContainerSize();
                        // if this widget contains another animated widget (such as another AxShowHideWidget),
                        // make sure to pick up on its animated content
                        $window.setTimeout( fixContainerSize, RESIZE_DELAY );
                     } );
                  }
               }

               ///////////////////////////////////////////////////////////////////////////////////////////////

               function stopWatchingForContentResizing() {
                  if( clearWatcher ) {
                     clearWatcher();
                     clearWatcher = null;
                  }
               }

               ///////////////////////////////////////////////////////////////////////////////////////////////

               function animateToHeight( element, newHeight ) {
                  currentTargetHeight = newHeight;
                  startWatchingForContentResizing();
                  if( newHeight > 0 ) {
                     element.css( 'display', 'block' );
                     element.animate( { 'height': newHeight + 'px' }, function() {
                        element.css( 'height', 'auto' );
                        stopWatchingForContentResizing();
                     } );
                  }
                  else {
                     element.animate( { 'height': 0 }, function() {
                        if( !showContent ) {
                           element.css( 'display', 'none' );
                        }
                     } );
                  }
               }
            }
         };
      } ];
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function calculateContentHeight( element ) {
      element.css( 'visibility', 'hidden' );
      element.css( 'overflow', 'visible' );
      element.css( 'height', 'auto' );
      var height = $( element ).outerHeight( true );
      element.css( 'height', '0px' );
      element.css( 'overflow', '' );
      element.css( 'visibility', '' );

      return height;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      define: function( module ) {
         module.directive( 'axShowHideWidgetDirective', createShowHideWidgetDirective() );
      }
   };

} );
