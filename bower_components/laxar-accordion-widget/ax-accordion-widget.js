/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'angular',
   'laxar',
   'laxar-patterns'
], function( angular, ax, patterns ) {
   'use strict';

   var moduleName = 'axAccordionWidget';
   var module     = angular.module( moduleName, [] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Controller.$inject = [ '$scope', '$q' ];

   function Controller( $scope, $q ) {

      var requestedPanel = -1;
      var allowNextPanelActivation = false;

      $scope.model = {
         panels: [],
         selectedPanel: 0
      };

      var localize = patterns.i18n.handlerFor( $scope ).scopeLocaleFromFeature( 'i18n', {
         onChange: function() {
            $scope.model.panels.forEach( function( areaModel, index ) {
               areaModel.htmlLabel = localize( $scope.features.areas[ index ].i18nHtmlLabel );
            } );
         }
      } ).localizer();

      $scope.model.panels = $scope.features.areas.map( createPanelModel );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.eventBus.subscribe( 'beginLifecycleRequest', function() {
         $scope.model.panels.forEach( function( panel, i ) {
            publishFlagIfConfigured( i, $scope.model.selectedPanel === i );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      patterns.visibility.handlerFor( $scope, {
         // set nested area visibility depending on the `areaShowing` state and on the context visibility
         onAnyAreaRequest: function( event ) {
            var eventArea = event.area.substring( $scope.widget.id.length + 1 );
            var index = $scope.model.selectedPanel;
            index = isOk( index ) ? index : requestedPanel;
            if( isOk( index ) ) {
               var selectedArea = $scope.model.panels[ index ].areaName;
               return event.visible && eventArea === selectedArea;
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            function isOk( index ) {
               return angular.isNumber( index ) && index >= 0;
            }
         }
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function createPanelModel( area, index ) {

         var areaModel = {
            areaName: area.name,
            htmlLabel: localize( area.i18nHtmlLabel ),
            classes: {
               'ax-anonymize-me': area.anonymize,
               disabled: false,
               error: false,
               active: false
            }
         };

         configureFlagHandler( area.validOn, function( valid ) {
            areaModel.classes.error = !valid;
         } );
         configureFlagHandler( area.disabledOn, function( disabled ) {
            areaModel.classes.disabled = disabled;
         } );
         configureFlagHandler( area.taggedOn, function( tagged ) {
               areaModel.classes[ 'is-tagged' ] = tagged;
         } );

         if( area.selectionRequestTrigger && area.selectionRequestTrigger.onActions ) {
            area.selectionRequestTrigger.onActions.forEach( function( action ) {
               $scope.eventBus.subscribe( 'takeActionRequest.' + action,
                  createSelectionRequestTriggerHandler( area, index ) );
            } );
         }

         if( area.selectionRequest && area.selectionRequest.confirmationAction ) {
            $scope.eventBus.subscribe(
               'takeActionRequest.' + area.selectionRequest.confirmationAction,
               handleDidConfirmSelection
            );
         }

         return areaModel;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /** Make the given panel visible, make sure that contents are loaded (visible) first. */
      function setSelectedPanel( newIndex ) {
         var oldIndex = $scope.model.selectedPanel;

         if( !isNaN( oldIndex ) ) {
            $scope.model.panels[ oldIndex ].classes.active = false;
            publishFlagIfConfigured( oldIndex, false );
            publishVisibility( oldIndex, false );
         }

         if( !isNaN( newIndex ) ) {
            requestedPanel = newIndex;
            publishFlagIfConfigured( newIndex, true );
            publishVisibility( newIndex, true )
               .then( function() {
                  implementSelection( newIndex );
               } );
         }

         var selectionAction = $scope.features.areas[ newIndex ].selection &&
                               $scope.features.areas[ newIndex ].selection.action;
         if( selectionAction ) {
            $scope.eventBus.publish( 'takeActionRequest.' + selectionAction, {
               action: selectionAction
            } );
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         function publishVisibility( index, visibility ) {
            if( !$scope.isVisible ) {
               return $q.when();
            }
            var areaName = [ $scope.widget.id, $scope.model.panels[ index ].areaName ].join( '.' );
            return patterns.visibility.requestPublisherForArea( $scope, areaName )( visibility );
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         function implementSelection( index ) {
            $scope.model.panels[ index ].classes.active = true;
            $scope.model.selectedPanel = newIndex;
            allowNextPanelActivation = true;
         }

      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function createSelectionRequestTriggerHandler( areaFeatures, index ) {
         return function() {
            if( areaFeatures.selectionRequest && areaFeatures.selectionRequest.action ) {
               $scope.model.onBeforeActivate( index );
            }
            else {
               setSelectedPanel( index );
            }
         };
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function handleDidConfirmSelection() {
         if( requestedPanel < 0 ) {
            ax.log.debug( 'Received selection confirmation, but no panel selection was requested.' );
            return;
         }
         if( requestedPanel > $scope.model.panels.length - 1 ) {
            ax.log.warn( 'Received selection confirmation, but pending index [0] exceeds maximum of [1].',
                      requestedPanel,
                      $scope.model.panels.length - 1 );
            requestedPanel = -1;
            return;
         }

         setSelectedPanel( requestedPanel );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.model.onBeforeActivate = function( index ) {
         if( $scope.model.panels[ index ].classes.disabled ) {
            return false;
         }

         if( allowNextPanelActivation && index === requestedPanel ) {
            requestedPanel = -1;
            allowNextPanelActivation = false;
            // selection was already confirmed, allow UI to reflect it now:
            return true;
         }

         var areaConfig = $scope.features.areas[ index ];
         var selectionRequestAction = areaConfig.selectionRequest &&
                                      areaConfig.selectionRequest.action;
         if( selectionRequestAction ) {
            requestedPanel = index;
            $scope.eventBus.publish( 'takeActionRequest.' + selectionRequestAction, {
               action: selectionRequestAction
            } );
         }
         else {
            setSelectedPanel( index );
         }

         // wait for confirm and/or visibility propagation
         return false;
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function configureFlagHandler( flag, handler ) {
         if( !flag ) {
            return;
         }
         var invertedFlag = flag.indexOf( '!' ) === 0;
         $scope.eventBus.subscribe( 'didChangeFlag.' + flag.replace( /^!/, '' ), function( event ) {
            var value = invertedFlag ? !event.state : event.state;
            handler( value );
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function publishFlagIfConfigured( areaIndex, state ) {
         var flag = $scope.features.areas[ areaIndex ].flag;
         if( flag ) {
            $scope.eventBus.publish( 'didChangeFlag.' + flag + '.' + state, {
               flag: flag,
               state: state
            } );
         }
      }

   }

   module.controller( 'AxAccordionWidgetController', Controller );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );
