/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license
 * www.laxarjs.org
 */
define( [
   'angular',
   'laxar',
   'laxar-patterns'
], function( ng, ax, patterns ) {
   'use strict';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Controller.$inject = [ '$scope' ];

   function Controller( $scope ) {

      $scope.model = {
         isOpen: false,
         sourceElementSelector: null
      };

      patterns.actions.handlerFor( $scope )
         .registerActionsFromFeature( 'open', handleOpenAction )
         .registerActionsFromFeature( 'close', handleCloseAction );

      patterns.visibility.handlerFor( $scope, {
         onAnyAreaRequest: function() {
            // respond with the visibility for all nested areas (in this case there is only one)
            return $scope.model.isOpen;
         }
      } );
      var visibilityRequestPublisher = patterns.visibility.requestPublisherForWidget( $scope );

      $scope.functions = {
         close: function() {
            if( $scope.features.closeIcon.enabled ) {
               handleCloseAction();
            }
         },
         backdropClicked: function() {
            if( $scope.features.backdropClose.enabled ) {
               handleCloseAction();
            }
         },
         whenVisibilityChanged: function( visible ) {
            visibilityRequestPublisher( visible );
         }
      };

      if( $scope.features.close.action ) {
         var closeActionPublisher = patterns.actions.publisherForFeature( $scope, 'close' );
         $scope.$on( layerDirectiveClosedEvent, function() {
            closeActionPublisher();
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      if( usesPlaceParameter() ) {
         $scope.eventBus.subscribe( 'didNavigate', function( event ) {
            var navSettings = $scope.features.navigation;
            $scope.model.isOpen = event.data != null &&
                                  ( event.data[ navSettings.parameterName ] === navSettings.parameterValue );
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function handleOpenAction( event ) {
         if( $scope.model.isOpen ) {
            return;
         }

         $scope.model.isOpen = true;
         $scope.model.sourceElementSelector = $scope.features.animateFrom.actionSelectorPath ?
            ax.object.path( event, $scope.features.animateFrom.actionSelectorPath, null ) :
            null;
         $scope.model.skipAnimations = $scope.features.skipAnimations.actionSelectorPath ?
            ax.object.path( event, $scope.features.skipAnimations.actionSelectorPath, false ) :
            false;

         publishPlaceParameter();

         var logTag = $scope.features.logTag;
         if( logTag.name && logTag.value ) {
            ax.log.setTag( logTag.name, logTag.value );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function handleCloseAction() {
         if( !$scope.model.isOpen ) {
            return;
         }
         $scope.model.isOpen = false;
         publishPlaceParameter();

         var logTag = $scope.features.logTag;
         if( logTag.name && logTag.value ) {
            ax.log.removeTag( logTag.name );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function usesPlaceParameter() {
         var navSettings = $scope.features.navigation;
         return navSettings.parameterName && navSettings.parameterValue;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function publishPlaceParameter() {
         if( !usesPlaceParameter() ) {
            return;
         }
         var navSettings = $scope.features.navigation;
         if( navSettings.parameterName && navSettings.parameterValue ) {
            var parameters = {};
            parameters[ navSettings.parameterName ] = $scope.model.isOpen ?
               navSettings.parameterValue :
               null;
            $scope.eventBus.publish( 'navigateRequest._self', {
               target: '_self',
               data: parameters
            } );
         }
      }

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var layerDirectiveName = 'axDetailsLayer';
   var layerDirectiveClosedEvent = layerDirectiveName + '.layerClosed';
   var layerDirective = [ '$window', '$document', function( $window, $document ) {
      return {
         scope: {
            isOpen: '=' + layerDirectiveName + 'IsOpen',
            sourceElementSelector: '=' + layerDirectiveName + 'SourceElementSelector',
            skipAnimations: '=' + layerDirectiveName + 'SkipAnimations',
            useActiveElement: '=' + layerDirectiveName + 'UseActiveElement',
            onClose: '=' + layerDirectiveName + 'OnClose',
            whenVisibilityChanged: '=' + layerDirectiveName + 'WhenVisibilityChanged',
            resetOnOpen: '=' + layerDirectiveName + 'ResetOnOpen'
         },
         link: function( scope, element ) {

            element.css( 'display', 'none' );
            var backdropElement = $querySelector( '.modal-backdrop', element.parent() );

            var escapeCloseHandler = function( event ) {
               if( event.keyCode === 27 && typeof scope.onClose === 'function' ) {
                  scope.$apply( scope.onClose );
               }
            };

            var lastTabWasShifted = false;

            var sourceElement = null;
            scope.$watch( 'isOpen', function( open, wasOpen ) {
               if( open === wasOpen ) {
                  return;
               }

               backdropElement.toggleClass( 'fade', !( scope.skipAnimations && open ) );

               if( open && scope.useActiveElement ) {
                  sourceElement = document.activeElement;
               }
               if( scope.sourceElementSelector ) {
                  sourceElement = document.querySelector( scope.sourceElementSelector ) || sourceElement;

                  if( !sourceElement ) {
                     ax.log.warn( 'laxar-details-layer-widget: source element selector [0] ' +
                                  'does not match anything.', scope.sourceElementSelector );
                  }
               }

               // reset class. Will be set on-demand in the following
               element.removeClass( 'ax-details-layer-with-source-animation' );

               if( open ) {
                  document.addEventListener( 'focus', checkFocus, true );
                  $document.on( 'keydown', tabCaptureListener );
                  openLayer( sourceElement, scope.skipAnimations );
               }
               else {
                  document.removeEventListener( 'focus', checkFocus );
                  $document.off( 'keydown', tabCaptureListener );
                  closeLayer( sourceElement );
               }
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function checkFocus( event ) {
               var node = event.target;
               while( node !== document.body && node !== element[ 0 ] ) {
                  node = node.parentNode;
               }
               if( node === document.body ) {
                  var nextNode = findFirstOrLast( lastTabWasShifted );
                  secureFocus( nextNode );
               }
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function tabCaptureListener( event ) {
               if( event.keyCode === 9 ) {
                  lastTabWasShifted = event.shiftKey;
               }
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function findFirstOrLast( useLargest ) {
               var nodes = [].slice.call(
                  element[ 0 ].querySelectorAll( 'input,a,button,textarea,select,[tabindex]' )
               );

               return nodes.reduce( function( previousNode, currentNode ) {

                  if( !isFocusable( currentNode ) ) {
                     return previousNode;
                  }

                  var tabindexCurrent = getTabindex( currentNode );
                  if( tabindexCurrent < 0 ) {
                     return previousNode;
                  }
                  var tabindexPrevious = getTabindex( previousNode );

                  var currentIsSmaller = tabindexCurrent < tabindexPrevious;
                  if( useLargest ) {
                     return currentIsSmaller ? previousNode : currentNode;
                  }
                  return currentIsSmaller ? currentNode : previousNode;
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               function getTabindex( node ) {
                  var item = node.attributes.getNamedItem( 'tabindex' );
                  return item ? item.value : 0;
               }

               ///////////////////////////////////////////////////////////////////////////////////////////////

               function isFocusable( node ) {
                  if( node.nodeType !== 1 || node.disabled ) {
                     return false;
                  }
                  var computedStyle = $window.getComputedStyle( node );
                  if( computedStyle.getPropertyValue( 'display' ) === 'none' ) {
                     return false;
                  }
                  if( computedStyle.getPropertyValue( 'visibility' ) === 'hidden' ) {
                     return false;
                  }
                  return node.offsetParent !== null;
               }
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function secureFocus( node ) {
               try {
                  node.focus();
               }
               catch( e ) {
                  // ignore exceptions in IE  when focussing hidden DOM nodes
               }
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            scope.$on( '$destroy', function() {
               document.removeEventListener( 'focus', checkFocus );
               sourceElement = null;
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function openLayer( sourceElement, skipAnimations ) {
               if( sourceElement && !skipAnimations ) {
                  var boundingBox = sourceElement.getBoundingClientRect();
                  var scaling = boundingBox.width / viewportWidth();
                  element.css( 'height', ( boundingBox.height / scaling ) + 'px' );
                  element.css( 'transform',
                     'translate3d( ' + boundingBox.left + 'px, ' + boundingBox.top + 'px, 0 )' +
                     'scale3d( ' + scaling + ', ' + scaling + ', 1 ) '
                  );
                  element.css( 'opacity', 0.3 );
                  element.addClass( 'ax-details-layer-with-source-animation' );
               }

               backdropElement.removeClass( 'ng-hide' );
               element.css( 'display', 'block' );

               /*jshint -W030:false */
               element[ 0 ].offsetWidth; // Triggering reflow. Otherwise the animation won't work

               // scroll content layer to top:
               if( scope.resetOnOpen ) {
                  var content = element[ 0 ].querySelector( '.ax-details-layer-content' );
                  content.scrollTop = 0;
               }

               if( sourceElement && !skipAnimations ) {
                  element.css( 'height', '' );
                  element.css( 'opacity', 1 );
                  element.css( 'transform', 'translate3d(0, 0, 0) scale3d( 1, 1, 1)' );
                  element.one( 'transitionend', completeOpening );
               }
               else {
                  completeOpening( skipAnimations );
               }
               // Issue (#8):
               // For iOS Safari: we need to make the body fixed in order to prevent background scrolling.
               // To maintain the scroll position, we translate the entire page upwards, and move the layer down.
               // Thus we only execute the additional code when the user agent might use the apple webkit engine.
               if( isWebKit() ) {
                  preventBodyScrolling();
               }

               ///////////////////////////////////////////////////////////////////////////////////////////////

               function completeOpening( skipAnimations ) {
                  if( !scope.isOpen ) {
                     // the layer was opened and instantly closed again
                     return;
                  }

                  ng.element( document.body )
                     .on( 'keyup', escapeCloseHandler )
                     .addClass( 'modal-open' );
                  if( skipAnimations ) {
                     backdropElement.css( 'transition', 'none' );
                     /*jshint -W030:false */
                     backdropElement[ 0 ].offsetWidth; // Triggering reflow for the disabled transition
                  }
                  backdropElement.addClass( 'ax-details-layer-open' );
                  element.removeClass( 'ax-details-layer-with-source-animation' );
                  scope.whenVisibilityChanged( true );
                  if( skipAnimations ) {
                     backdropElement.css( 'transition', '' );
                  }
               }
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function closeLayer( sourceElement ) {
               if( isWebKit() ) {
                  restoreBodyScrolling();
               }
               backdropElement.removeClass( 'ax-details-layer-open' );
               ng.element( document.body )
                  .off( 'keyup', escapeCloseHandler )
                  .removeClass( 'modal-open' );
               if( sourceElement ) {
                  element.addClass( 'ax-details-layer-with-source-animation' );

                  var boundingBox = sourceElement.getBoundingClientRect();
                  var scaling = boundingBox.width / viewportWidth();
                  element.css( 'height', ( boundingBox.height / scaling ) + 'px' );
                  element.css( 'opacity', 0 );
                  element.css( 'transform',
                     'translate3d( ' + boundingBox.left + 'px, ' + boundingBox.top + 'px, 0 )' +
                     'scale3d( ' + scaling + ', ' + scaling + ', 1 ) '
                  );
                  element.one( 'transitionend', completeClosing );
               }
               else {
                  completeClosing();
               }

               ///////////////////////////////////////////////////////////////////////////////////////////////

               function completeClosing() {
                  if( scope.isOpen ) {
                     // the layer was closed and instantly opened again
                     return;
                  }

                  element.removeClass( 'ax-details-layer-with-source-animation' );
                  element.css( {
                     'display': 'none',
                     'transform': '',
                     'opacity': '',
                     'height': ''
                  } );
                  backdropElement.addClass( 'ng-hide' );
                  scope.whenVisibilityChanged( false );
                  scope.$emit( layerDirectiveClosedEvent );
               }
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function preventBodyScrolling() {
               // Following body scroll prevention taken from here:
               // https://github.com/luster-io/prevent-overscroll

               $querySelector( '.ax-details-layer-content' )
                  .on( 'touchstart', handleContentTouchStart )
                  .on( 'touchmove', handleContentTouchMove );

               ng.element( document.body ).on( 'touchmove', handleBodyTouchMove );
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function restoreBodyScrolling() {
               $querySelector( '.ax-details-layer-content' )
                  .off( 'touchstart', handleContentTouchStart )
                  .off( 'touchmove', handleContentTouchMove );

               ng.element( document.body ).off( 'touchmove', handleBodyTouchMove );
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function handleContentTouchStart() {
               var contentElement = element[ 0 ].querySelector( '.ax-details-layer-content' );
               var top = contentElement.scrollTop;
               var totalScroll = contentElement.scrollHeight;
               var currentScroll = top + contentElement.offsetHeight;

               // If we're at the top or the bottom of the containers scroll, push up or down one pixel.
               // This prevents the scroll from "passing through" to the body.
               if( top === 0 ) {
                  contentElement.scrollTop = 1;
               }
               else if( currentScroll === totalScroll ) {
                  contentElement.scrollTop = top - 1;
               }
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function handleContentTouchMove( event ) {
               var contentElement = element[ 0 ].querySelector( '.ax-details-layer-content' );
               // If the content is actually scrollable, i.e. the content is long enough
               // that scrolling can occur
               if( contentElement.offsetHeight < contentElement.scrollHeight ) {
                  event.originalEvent._isDetailsLayer = true;
               }
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function handleBodyTouchMove( event ) {
               // In this case, the default behavior is scrolling the body, which
               // would result in an overflow. Since we don't want that, we preventDefault.
               if( !event.originalEvent._isDetailsLayer ) {
                  event.preventDefault();
               }
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function viewportWidth() {
               return Math.max( document.documentElement.clientWidth, window.innerWidth || 0 );
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function isWebKit() {
               return navigator.userAgent.match( /AppleWebKit/ );
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function $querySelector( selector, $context ) {
               $context = typeof $context === 'undefined' ? element : $context;
               return ng.element( $context[ 0 ].querySelector( selector ) );
            }
         }
      };
   } ];

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return ng.module( 'axDetailsLayerWidget', [] )
      .controller( 'AxDetailsLayerWidgetController', Controller )
      .directive( layerDirectiveName, layerDirective );

} );
