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

   var moduleName = 'axHeadlineWidget';
   var module = ng.module( moduleName, [] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

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

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Controller.$inject = [ '$scope' ];

   function Controller( $scope ) {
      var flagHandler = patterns.flags.handlerFor( $scope );

      var localize = patterns.i18n.handlerFor( $scope ).scopeLocaleFromFeature( 'i18n', {
         onChange: function() {
            $scope.model.areas.left.forEach( function( button ) {
               button.htmlLabel = localize( button.i18nHtmlLabel );
            } );
            $scope.model.areas.right.forEach( function( button ) {
               button.htmlLabel = localize( button.i18nHtmlLabel );
            } );
         }
      } ).localizer();

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.model = {
         level: $scope.features.headline.level,
         areas: {
            left: [],
            right: []
         }
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.model.areas.left = getButtonList( 'LEFT' );
      $scope.model.areas.right = getButtonList( 'RIGHT' );

      function getButtonList( alignKey ) {
         return $scope.features.buttons
            .filter( function( button ) {
               return button.align === alignKey;
            } )
            .filter( function( button ) {
               return button.enabled;
            } )
            .map( function( button, i ) {
               button.fallbackIndex = i;
               button.id = $scope.id( button.action + '_' + i );
               button.htmlLabel = localize( button.i18nHtmlLabel );
               addButtonStyleClasses( button );

               Object.keys( BUTTON_STATE_TRIGGER_TO_CLASS_MAP ).forEach( function( flagName ) {
                  var className = BUTTON_STATE_TRIGGER_TO_CLASS_MAP[ flagName ];
                  flagHandler.registerFlag( button[ flagName ], {
                     initialState: false,
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
         } )['finally']( reset );
      };

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
         for( var flagName in BUTTON_STATE_TRIGGER_TO_CLASS_MAP ) {
            if( button.classes[ BUTTON_STATE_TRIGGER_TO_CLASS_MAP[ flagName ] ] ) {
               return true;
            }
         }

         return false;
      }

   }

   module.controller( 'AxHeadlineWidgetController', Controller );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;
} );
