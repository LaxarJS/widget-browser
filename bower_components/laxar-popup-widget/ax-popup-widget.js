/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'angular',
   'laxar',
   'laxar-patterns'
], function( ng, ax, patterns ) {
   'use strict';

   var moduleName = 'axPopupWidget';
   var module     = ng.module( moduleName, [] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Controller.$inject = [ '$scope', '$q', 'modalService' ];

   function Controller( $scope, $q, modalService ) {

      $scope.model = {
         popupLayerId: 'popupLayer',
         anchorElementId: null,
         closeIconAvailable: $scope.features.closeIcon.enabled,
         isOpen: false,
         isOpening: false,
         layerConfiguration: {},
         layout: $scope.features.content.layout
      };

      attachActionListeners();

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      patterns.visibility.handlerFor( $scope, {
         // determine visibility state for nested areas
         onAnyAreaRequest: function() {
            return $scope.model.isOpen || $scope.model.isOpening;
         }
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.model.handleCloseIconClicked = function() {
         if( !$scope.model.closeIconAvailable ) {
            return;
         }
         $scope.$broadcast( 'closeLayerForced' );
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.model.handleBackdropClicked = function() {
         if( !$scope.features.backdropClose.enabled ) {
            return;
         }
         $scope.$broadcast( 'closeLayerForced' );
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.model.preventClosingPopup = function( event ) {
         event.stopPropagation();
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.$on( '$destroy', function() {
         closeActionHandler();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function attachActionListeners() {
         $scope.features.open.onActions.forEach( function( action ) {
            $scope.eventBus.subscribe( 'takeActionRequest.' + action, openActionHandler );
         } );

         $scope.features.close.onActions.forEach( function( action ) {
            $scope.eventBus.subscribe( 'takeActionRequest.' + action, closeActionHandler );
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function openActionHandler( event ) {
         var eventAction;
         if( !$scope.model.isOpen ) {
            eventAction = event.action;
            $scope.model.anchorElementId = event.anchorDomElement;

            publishVisibilityChange( true ).then( function() {
               $scope.model.isOpen = true;
               drawPopup( $scope );
            } );
         }
         $scope.eventBus.publish( 'didTakeAction.' + eventAction, {
            action: eventAction
         } );
         drawPopup( $scope );
         modalService.setClassOnBody();
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function closeActionHandler( event ) {
         if( $scope.model.isOpen ) {
            $scope.model.isOpen = false;
            publishVisibilityChange( false );
         }
         var eventAction;
         if( event ) {
            eventAction = event.action;
            $scope.eventBus.publish( 'didTakeAction.' + eventAction, {
               action: eventAction
            } );
         }
         modalService.unsetClassOnBody();
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function publishVisibilityChange( state ) {
         $scope.model.isOpening = true;
         return publishVisibilityFlag( state ).then( function() {
            return patterns.visibility.requestPublisherForWidget( $scope )( state ).then( function() {
               $scope.model.isOpening = false;
            } );
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function publishVisibilityFlag( state ) {
         var visibilityFlag = $scope.features.visibility.flag;
         if( !visibilityFlag ) {
            return $q.resolve();
         }
         return $scope.eventBus.publish( 'didChangeFlag.' + visibilityFlag + '.' + state, {
            flag: visibilityFlag,
            state: state
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function drawPopup() {
         $scope.model.layerConfiguration = {
            layerElementSelector: '#' + $scope.id( $scope.model.popupLayerId ),
            positioning: $scope.features.position.vertical.toLowerCase(),
            allowedPositions: [ 'center' ],
            autoFocus: $scope.features.autoFocus.enabled,
            captureFocus: $scope.features.captureFocus.enabled,
            closeByKeyboard: $scope.features.closeIcon.enabled,
            preventBodyScrolling:  $scope.features.preventBodyScrolling.enabled,
            closeByOutsideClick: false,
            whenPositioned: function() {
               applyInternetExplorerCssHack( $scope.id( $scope.model.popupLayerId ) );
            },
            whenClosed: function( forcedClose ) {
               closeActionHandler();

               if( forcedClose && $scope.features.forcedClose.action ) {
                  var forcedCloseAction = $scope.features.forcedClose.action;
                  $scope.eventBus.publish( 'takeActionRequest.' +  forcedCloseAction, {
                     action: forcedCloseAction,
                     anchorDomElement: $scope.model.anchorElementId
                  } );
               }
            }
         };
      }

   }

   module.controller( 'AxPopupWidgetController', Controller );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   module.factory( 'modalService', [ '$document', function( $document ) {
      return {
         setClassOnBody: function() {
            $document.find( 'body').addClass( 'modal-open' );
         },
         unsetClassOnBody: function() {
            $document.find( 'body').removeClass( 'modal-open' );
         }
      };
   } ] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function applyInternetExplorerCssHack( popupLayerId ) {
      var style = document.createElement( 'style' );
      if( style.styleSheet ) {
         var head = document.getElementsByTagName( 'head' )[ 0 ];
         style.type = 'text/css';
         style.styleSheet.cssText = '.ax-popup-widget :before,.ax-popup-widget :after{content:none !important';
         head.appendChild( style );
         /*jshint expr:true*/
         document.getElementById( popupLayerId ).offsetWidth;
         head.removeChild( style );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );
