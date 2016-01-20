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

   var DID_ENCOUNTER_ERROR_RESOURCE = '_DID_ENCOUNTER_ERROR_RESOURCE';
   var EVENT_SCROLL_TO_MESSAGES = 'axMessagesWidget.scrollToMessages';

   var levelMap = {
      BLANK:   { weight: 0 },
      SUCCESS: { weight: 1, cssClass: 'alert alert-success' },
      INFO:    { weight: 2, cssClass: 'alert alert-info'    },
      WARNING: { weight: 3, cssClass: 'alert alert-warning' },
      ERROR:   { weight: 4, cssClass: 'alert alert-danger'  }
   };
   var layoutVariants = {
      1: 'list',
      2: 'flat',
      3: 'byLevel',
      4: 'separate'
   };

   var moduleName = 'axMessagesWidget';
   var module     = ng.module( moduleName, [] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Controller.$inject = [ '$scope' ];

   function Controller( $scope ) {

      var localize = patterns.i18n.handlerFor( $scope ).scopeLocaleFromFeature( 'i18n', {
         onChange: rebuildMessagesForView
      } ).localizer();

      var resources;
      var resourceOrder = [];
      var exclusions = $scope.features.resource.exclude;
      var currentStatus = null;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.model = {
         levelMap: levelMap,
         messageViewType: layoutVariants[ $scope.features.layout.variant ],
         messages: {},
         messagesForView: [],
         messagesForViewByLevel: {}
      };

      $scope.actions = {
         hideMessagesByLevel: function( level ) {
            $scope.model.messagesForViewByLevel[ level ].forEach( $scope.actions.hideMessage );
            // update messages by level
            rebuildMessagesForView();
         },
         hideAllMessages: function() {
            // We need to make a copy here, as we otherwise are in conflict with the in-place modifications of
            // $scope.model.hideMessage
            $scope.model.messagesForView.slice( 0 ).forEach( $scope.actions.hideMessage );
         },
         hideMessage: function( message ) {
            var index = $scope.model.messagesForView.indexOf( message );
            if( index !== -1 ) {
               message.sourceMessages.forEach( function( sourceMessage ) {
                  sourceMessage.dismissed = true;
               } );
               $scope.model.messagesForView.splice( index, 1 );
            }
         }
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      resources = $scope.features.resource.list;

      if( Array.isArray( resources ) ) {
         if( resources.length === 0 ) {
            $scope.eventBus.subscribe( 'didValidate', insertMessagesForEvent );
         }
         else {
            resourceOrder = resources.slice( 0 );
            resources.forEach( function( resource ) {
               $scope.eventBus.subscribe( 'didValidate.' + resource, insertMessagesForEvent );
            } );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      if( $scope.features.errors.enabled ) {
         $scope.eventBus.subscribe( 'didEncounterError', function( event ) {
            insertMessagesForEvent( {
               resource: DID_ENCOUNTER_ERROR_RESOURCE,
               data: [ {
                  level: 'ERROR',
                  htmlMessage: event.message
               } ]
            } );
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      if( $scope.features.status.reset && $scope.features.status.reset.onActions ) {
         var actions = $scope.features.status.reset.onActions;

         actions.forEach( function( action ) {
            $scope.eventBus.subscribe( 'takeActionRequest.' + action , function( event ) {
               $scope.eventBus.publish( 'willTakeAction.' + event.action, {
                  action: event.action
               } );
               changeLevelStatus( 'BLANK' );
               $scope.model.messages = {};
               rebuildMessagesForView();
               recalculateCurrentStatus();
               $scope.eventBus.publish( 'didTakeAction.' + event.action, {
                  action: event.action
               } );
            } );
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      changeLevelStatus( 'BLANK' );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function insertMessagesForEvent( event ) {
         var topic = event.resource;
         if( exclusions && exclusions.some( isSuperTopicOf( topic ) ) ) {
            return;
         }

         if( topic ) {
            var superTopic = topic.split( /-/ )[ 0 ];
            $scope.eventBus.subscribe( 'validateRequest.' + superTopic, createRemover( topic ) );
            $scope.eventBus.subscribe( 'didReplace.' + superTopic, createRemover( topic ) );
         }

         if( $scope.features.resource.replace && event.outcome === 'SUCCESS' ) {
            if( $scope.model.messages[ topic ] ) {
               $scope.model.messages[ topic ].length = 0;
            }
         }

         var messageBucket = $scope.model.messages;
         if( !Array.isArray( messageBucket[ topic ] ) ) {
            messageBucket[ topic ] = [];
            if( resourceOrder.indexOf( topic ) === -1 ) {
               // In case of catch-all resource configuration, resources are simply ordered by the order
               // messages for them arrive.
               resourceOrder.push( topic );
            }
         }

         ( event.data || [] ).forEach( function( message ) {
            if( !( 'sortKey' in message ) ) {
               message.sortKey = '000';
            }
            messageBucket[ topic ].push( message );
         } );

         rebuildMessagesForView();
         recalculateCurrentStatus();
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function isSuperTopicOf( subTopic ) {
         return function( superTopic ) {
            return subTopic === superTopic || (
               subTopic.charAt( superTopic.length ) === '-' && subTopic.indexOf( superTopic ) === 0
            );
         };
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function createRemover( topic ) {
         return function removeMessagesFor( event, meta ) {
            var messageBucket = $scope.model.messages;
            if( Array.isArray( messageBucket[ topic ] ) ) {
               messageBucket[ topic ].length = 0;
               rebuildMessagesForView();
               recalculateCurrentStatus();
            }
            meta.unsubscribe();
         };
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function rebuildMessagesForView() {
         var model = $scope.model;
         var messagesForView = [];
         var textToPosition = {};

         resourceOrder.forEach( function( resource ) {
            var resourceMessages = ax.object.path( model.messages, resource, [] ).slice( 0 );

            resourceMessages.sort( function( a, b ) {
               return a.sortKey < b.sortKey ? -1 : ( a.sortKey > b.sortKey ? 1 : 0 );
            } );

            resourceMessages.forEach( function( message ) {
               if( message.dismissed ) {
                  return;
               }

               var viewMessage = transformMessageForView( message );
               if( viewMessage.htmlText in textToPosition ) {
                  var existingMessage = messagesForView[ textToPosition[ viewMessage.htmlText ] ];
                  var sourceMessages = existingMessage.sourceMessages.concat( viewMessage.sourceMessages );
                  if( levelMap[ existingMessage.level ].weight < levelMap[ viewMessage.level ].weight ) {
                     viewMessage.sourceMessages = sourceMessages;
                     messagesForView[ textToPosition[ viewMessage.htmlText ] ] = viewMessage;
                  }
                  else {
                     existingMessage.sourceMessages = sourceMessages;
                  }
                  return;
               }

               textToPosition[ viewMessage.htmlText ] = messagesForView.length;
               messagesForView.push( viewMessage );
            } );
         } );

         model.messagesForView = messagesForView;

         if( model.messageViewType === 'byLevel' ) {
            var messagesForViewByLevel = {};
            Object.keys( model.levelMap ).forEach( function( level ) {
               messagesForViewByLevel[ level ] = messagesForView.filter( function( message ) {
                  return message.level === level;
               } );
            } );
            model.messagesForViewByLevel = messagesForViewByLevel;
         }
         scrollWidgetIntoView();
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function transformMessageForView( message ) {
         return {
            htmlText: localize( message.i18nHtmlMessage || message.htmlMessage ),
            level: message.level,
            cssClass: levelMap[ message.level ].cssClass,
            sourceMessages: [ message ]
         };
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function recalculateCurrentStatus() {
         var newStatus = 'BLANK';
         Object.keys( $scope.model.messages ).forEach( function( resource ) {
            $scope.model.messages[ resource ].forEach( function( message ) {
               if( levelMap[ message.level ].weight > levelMap[ newStatus ].weight ) {
                  newStatus = message.level;
               }
            } );
         } );
         changeLevelStatus( newStatus );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function changeLevelStatus( newStatus ) {
         if( newStatus === currentStatus ) { return; }

         if( currentStatus != null ) {
            var currentStatusFlag = $scope.features.status[ currentStatus ];
            if( currentStatusFlag ) {
               $scope.eventBus.publish( 'didChangeFlag.' + currentStatusFlag + '.false', {
                  flag: currentStatusFlag,
                  state: false
               } );
            }
         }

         var newStatusFlag = $scope.features.status[ newStatus ];
         if( newStatusFlag ) {
            $scope.eventBus.publish( 'didChangeFlag.' + newStatusFlag + '.true', {
               flag: newStatusFlag,
               state: true
            } );
         }
         currentStatus = newStatus;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function scrollWidgetIntoView() {
         if( !$scope.features.autoScroll.enabled ) {
            return;
         }
         // in case the are no messages yet, we set a timeout to ensure that the directive
         // axMessagesAutoScroll has registered to the event and is not still blocked by the ngIf
         setTimeout( function() {
            $scope.$broadcast( EVENT_SCROLL_TO_MESSAGES );
         }, 0 );
      }
   }

   module.controller( 'AxMessagesWidgetController', Controller );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var directiveName = 'axMessagesAutoScroll';

   module.directive( directiveName, [ function( ) {
      return {
         link: function( $scope, $element ) {
            if( $scope.features.autoScroll.enabled ) {
               $scope.$on( EVENT_SCROLL_TO_MESSAGES, function() {
                  setTimeout( function() {
                     $element[ 0 ].scrollIntoView( true );
                  }, 0 );
               } );
            }
         }
      };
   } ] );

   return module;

} );
