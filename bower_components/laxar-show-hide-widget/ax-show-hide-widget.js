/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'angular',
   'laxar-patterns',
   './directive'
], function( ng, patterns, axShowHideWidgetDirective ) {
   'use strict';

   var moduleName = 'axShowHideWidget';
   var module     = ng.module( moduleName, [] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Controller.$inject = [ '$scope', '$q' ];

   function Controller( $scope, $q ) {

      $scope.model = {
         contentArea: $scope.features.area.name,
         areaShowing: $scope.features.visibility.initially,
         areaLoading: false,
         options: {
            animationsEnabled: $scope.features.animation.enabled
         }
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      patterns.visibility.handlerFor( $scope, {
         // set nested area visibility depending on the `areaShowing` state and on our own visibility
         onAnyAreaRequest: function( event ) {
            return event.visible && ( $scope.model.areaShowing || $scope.model.areaLoading );
         }
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.eventBus.subscribe( 'didNavigate', function() {
         publishVisibilityFlag( $scope.model.areaShowing );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      if( $scope.features.show.onActions ) {
         subscribeToActions( $scope.features.show.onActions, true );
      }

      if( $scope.features.hide.onActions ) {
         subscribeToActions( $scope.features.hide.onActions, false );
      }

      if( $scope.features.visibility.toggleOn ) {
         subscribeToFlag( $scope.features.visibility.toggleOn );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function subscribeToActions( actions, newVisibility ) {
         actions.forEach( function( action ) {
            $scope.eventBus.subscribe( 'takeActionRequest.' + action, function() {
               if( $scope.model.areaShowing === newVisibility ) {
                  return;
               }

               $scope.eventBus.publish( 'willTakeAction.' + action, {
                  action: action
               } );

               $scope.model.areaLoading = newVisibility;
               publishVisibilityFlag( newVisibility )
                  .then( function() {
                     return patterns.visibility.requestPublisherForWidget( $scope )( newVisibility );
                  } )
                  .then( function() {
                     $scope.model.areaShowing = newVisibility;
                     $scope.model.areaLoading = false;
                     $scope.eventBus.publish( 'didTakeAction.' + action, {
                        action: action
                     } );
                  } );
            } );
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function subscribeToFlag( flag ) {
         var invertedFlag = flag.indexOf( '!' ) === 0;

         $scope.eventBus.subscribe( 'didChangeFlag.' + flag.replace( /^!/, '' ), function( event ) {
            var newVisibility = invertedFlag ? !event.state : event.state;
            if( $scope.model.areaShowing === newVisibility ) {
               return;
            }

            $scope.model.areaLoading = true;
            publishVisibilityFlag( newVisibility )
               .then( function() {
                  return patterns.visibility.requestPublisherForWidget( $scope )( newVisibility );
               } )
               .then( function() {
                  $scope.model.areaShowing = newVisibility;
                  $scope.model.areaLoading = false;
               } );

         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function publishVisibilityFlag( state ) {
         var flag = $scope.features.visibility.flag;
         if( flag ) {
            return $scope.eventBus.publish( 'didChangeFlag.' + flag + '.' + state, {
               flag: flag,
               state: state
            } );
         }
         return $q.when( true );
      }

   }

   module.controller( 'AxShowHideWidgetController', Controller );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   axShowHideWidgetDirective.define( module );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );
