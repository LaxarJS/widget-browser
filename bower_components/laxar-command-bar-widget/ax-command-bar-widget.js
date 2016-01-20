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

   var moduleName = 'axCommandBarWidget';
   var module     = ng.module( moduleName, [] );

   var GRID_COLUMN_CLASS_PREFIX = 'col-lg-';
   var BUTTON_CLASS_PREFIX = 'btn-';
   var BUTTON_CLASS_ACTIVE = 'ax-active';
   var BUTTON_CLASS_HIDDEN = 'ax-invisible';
   var BUTTON_CLASS_OMITTED = 'ax-omitted';
   var BUTTON_CLASS_BUSY = 'ax-busy';
   var BUTTON_CLASS_DISABLED = 'ax-disabled';

   var BUTTON_STATE_TRIGGER_TO_CLASS_MAP = {
      hideOn: BUTTON_CLASS_HIDDEN,
      omitOn: BUTTON_CLASS_OMITTED,
      disableOn: BUTTON_CLASS_DISABLED,
      busyOn: BUTTON_CLASS_BUSY
   };

   var CONFIG_TO_BOOTSTRAP_STYLE_MAP = {
      NORMAL: 'default',
      PRIMARY: 'primary',
      INFO: 'info',
      SUCCESS: 'success',
      WARNING: 'warning',
      DANGER: 'danger',
      INVERSE: 'inverse',
      LINK: 'link'
   };

   var CONFIG_TO_BOOTSTRAP_SIZE_MAP = {
      MINI: 'xs',
      SMALL: 'sm',
      LARGE: 'lg'
   };

   var DEFAULT_BUTTONS =
      [ 'previous', 'next', 'finish', 'ok', 'cancel', 'close', 'info', 'help', 'print', 'apply', 'yes', 'no' ];

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Controller.$inject = [ '$scope' ];

   function Controller( $scope ) {

      var localize = patterns.i18n.handlerFor( $scope ).scopeLocaleFromFeature( 'i18n', {
         onChange: updateLocalization
      } ).localizer();
      var allButtons = buttonsFromAllFeatures();
      var flagHandler = patterns.flags.handlerFor( $scope );

      $scope.model = {
         areaOrder: [ 'left', 'center', 'right' ],
         areas: {},
         areaClasses: {},
         layout: $scope.features.layout.variant === 'VERTICAL' ? 'ax-local-vertical' : 'ax-local-horizontal'
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.model.areaOrder.forEach( function( areaName ) {
         $scope.model.areas[ areaName ] = allButtons
            .filter( function( button ) {
               return areaName === button.align.toLowerCase();
            } )
            .map( function( button, index ) {
               button.id = $scope.id( button.action + '_' + index );
               button.htmlLabel = localize( button.i18nHtmlLabel );
               addButtonStyleClasses( button );

               Object.keys( BUTTON_STATE_TRIGGER_TO_CLASS_MAP ).forEach( function( flagName ) {
                  var className = BUTTON_STATE_TRIGGER_TO_CLASS_MAP[ flagName ];
                  flagHandler.registerFlag( button[ flagName ], {
                     initialState: button.classes[ className ],
                     onChange: function( newState ) {
                        button.classes[ className ] = newState;
                     }
                  } );
               } );

               return button;
            } )
            .sort( function( buttonA, buttonB ) {
               if( buttonA.index === buttonB.index ) {
                  return buttonA.fallbackIndex - buttonB.fallbackIndex;
               }
               return buttonA.index - buttonB.index;
            } );

         var columnWidth = $scope.features.areas[ areaName ].columnWidth;
         $scope.model.areaClasses[ areaName ] =
            typeof( columnWidth ) !== 'number' ? [] : [ GRID_COLUMN_CLASS_PREFIX + columnWidth ];
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function updateLocalization() {
         $scope.model.areaOrder.forEach( function( areaName ) {
            $scope.model.areas[areaName].forEach( function( button ) {
               button.htmlLabel = localize( button.i18nHtmlLabel );
            } );
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.handleButtonClicked = function( button ) {
         if( shouldCancelButtonAction( button ) ) {
            return;
         }

         button.classes[ BUTTON_CLASS_ACTIVE ] = true;
         function reset() {
            button.classes[ BUTTON_CLASS_ACTIVE ] = false;
         }
         $scope.eventBus.publishAndGatherReplies( 'takeActionRequest.' + button.action, {
            action: button.action,
            anchorDomElement: button.id
         } ).then( reset, reset );
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function buttonsFromAllFeatures() {
         var buttons = $scope.features.buttons.map( function( button, i ) {
            button.fallbackIndex = i + DEFAULT_BUTTONS.length;
            return button;
         } );
         DEFAULT_BUTTONS.forEach( function( buttonFeatureName, i ) {
            var button = $scope.features[ buttonFeatureName ];
            if( button ) {
               button.fallbackIndex = i;
               buttons.push( button );
            }
         } );

         return buttons.filter( function( button ) {
            return button.enabled;
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function addButtonStyleClasses( button ) {
         button.classes = {};
         button.classes[ BUTTON_CLASS_ACTIVE ] = false;
         button.classes[ BUTTON_CLASS_HIDDEN ] = false;
         button.classes[ BUTTON_CLASS_DISABLED ] = false;
         button.classes[ BUTTON_CLASS_OMITTED ] = false;
         button.classes[ BUTTON_CLASS_BUSY ] = false;

         var buttonClass = button['class'];

         if( buttonClass ) {
            var typePart = CONFIG_TO_BOOTSTRAP_STYLE_MAP[ buttonClass ];
            if( !typePart ) {
               typePart = CONFIG_TO_BOOTSTRAP_STYLE_MAP.NORMAL;
            }
            var styleClass = BUTTON_CLASS_PREFIX + typePart;
            button.classes[ styleClass ] = true;
         }

         if( button.size && button.size !== 'DEFAULT' ) {
            var sizeClass = BUTTON_CLASS_PREFIX + CONFIG_TO_BOOTSTRAP_SIZE_MAP[ button.size ];
            button.classes[ sizeClass ] = true;
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function shouldCancelButtonAction( button ) {
         if( button.classes[ BUTTON_CLASS_ACTIVE ] ) {
            return true;
         }
         for( var flagName in BUTTON_STATE_TRIGGER_TO_CLASS_MAP ) {
            if( button.classes[ BUTTON_STATE_TRIGGER_TO_CLASS_MAP[ flagName ] ] ) {
               return true;
            }
         }

         return false;
      }

   }

   module.controller( 'AxCommandBarWidgetController', Controller );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );
