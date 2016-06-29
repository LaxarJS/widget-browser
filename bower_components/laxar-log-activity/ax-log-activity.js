/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'jquery',
   'laxar',
   'moment'
], function( $, ax, moment ) {
   'use strict';

   // Messages up to this index have been captured
   var lastMessageId_ = -1;

   var formatMessage = createMessageFormatter();

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var injections = [ 'axContext' ];

   var logController = function( context ) {
      if( !context.features.logging.enabled ) {
         return;
      }
      var logResourceUrl_ = ax.configuration.get( 'widgets.laxar-log-activity.resourceUrl', null );
      if( !logResourceUrl_ ) {
         ax.log.error( 'laxar-log-activity: resourceUrl not configured' );
         return;
      }
      var instanceId = ax.log.gatherTags()[ 'INST' ];
      var waitMilliseconds = context.features.logging.threshold.seconds * 1000;
      var waitMessages = context.features.logging.threshold.messages;

      var buffer_ = [];
      // Collect log messages and submit them periodically:
      ax.log.addLogChannel( handleLogItem );
      var timeout = window.setTimeout( submit, waitMilliseconds );
      context.eventBus.subscribe( 'endLifecycleRequest', function() {
         ax.log.removeLogChannel( handleLogItem );
         window.clearTimeout( timeout );
      } );

      // Log error events:
      context.eventBus.subscribe( 'didEncounterError', function( event ) {
         ax.log.error( '([0]) [1]', event.code, event.message );
      } );

      // Submit messages before browser unload:
      $( window ).off( 'beforeunload.laxar-log-activity' );
      $( window ).on( 'beforeunload.laxar-log-activity', function() {
         submit( true );
         window.clearTimeout( timeout );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function handleLogItem( item ) {
         if( item.id <= lastMessageId_ ) {
            return;
         }

         var tagList = [ 'INST:' + ( item.tags.INST || instanceId ) ];
         ax.object.forEach( item.tags, function( value, tag ) {
            if( tag !== 'INST' ) {
               tagList.push( tag + ':' + value );
            }
         } );

         lastMessageId_ = item.id;

         var textAndReplacements = formatMessage( item.text, item.replacements );

         var messageItem = {
            level: item.level,
            text: textAndReplacements.text,
            replacements: textAndReplacements.replacements,
            time: moment( item.time ).format( 'YYYY-MM-DDTHH:mm:ss.SSSZ' ),
            file: item.sourceInfo.file,
            line: item.sourceInfo.line,
            tags: tagList,
            repetitions: 1
         };

         if( markDuplicate( messageItem ) ) {
            return;
         }

         buffer_.push( messageItem );

         if( buffer_.length >= waitMessages ) {
            submit();
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         function markDuplicate( item ) {
            var numItemsToCheck = 2;
            var n = buffer_.length;
            for( var i = n - 1; i >= 0 && i >= n - numItemsToCheck; --i ) {
               var previousItem = buffer_[ i ];
               if( item.line === previousItem.line &&
                   item.file === previousItem.file &&
                   item.level === previousItem.level &&
                   item.text === previousItem.text ) {
                  ++previousItem.repetitions;
                  return true;
               }
            }
            return false;
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function submit( synchronously ) {
         if( context.features.logging.requestPolicy === 'BATCH' ) {
            submitBatch( synchronously );
         }
         else if( context.features.logging.requestPolicy === 'PER_MESSAGE' ) {
            submitPerMessage( synchronously );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function submitPerMessage( synchronously ) {
         window.clearTimeout( timeout );
         timeout = window.setTimeout( submitPerMessage, waitMilliseconds );
         if( !buffer_.length ) {
            return;
         }

         buffer_.forEach( function( message ) {
            if( message.repetitions > 1 ) {
               message.text += ' (repeated ' + message.repetitions + 'x)';
            }
            message.source = document.location.origin;
            var requestBody = JSON.stringify( message );
            postTo( logResourceUrl_, requestBody, synchronously );
         } );

         buffer_ = [];
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function submitBatch( synchronously ) {
         var promises = [];
         window.clearTimeout( timeout );
         timeout = window.setTimeout( submitBatch, waitMilliseconds );
         if( !buffer_.length ) {
            return;
         }
         var requestBody = prepareRequestBody( buffer_ );
         buffer_ = [];
         postTo( logResourceUrl_, requestBody, synchronously );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         function prepareRequestBody( buffer ) {
            buffer_.forEach( function( message ) {
               if( message.repetitions > 1 ) {
                  message.text += ' (repeated ' + message.repetitions + 'x)';
               }
            } );

            return JSON.stringify( {
               messages: buffer,
               source: document.location.origin
            } );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function postTo( url, requestBody, synchronously ) {
         $.support.cors = true;
         return $.ajax( {
               type: 'POST',
               url: url,
               data: requestBody,
               crossDomain: true,
               async: synchronously !== true,
               contentType: 'application/json',
               dataType: 'json',
               headers: { 'x-aixigo-log-tags': '[INST:' + instanceId + ']' }
         } );
      }
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createMessageFormatter() {
      var formatters = ax.object.options( { 'default': defaultFormatter }, ax.string.DEFAULT_FORMATTERS );

      return function( text, replacements ) {
         var anonymizeReplacements = [];
         var mappers = {
            anonymize: function( value ) {
               anonymizeReplacements.push( value );
               return '[' + ( anonymizeReplacements.length - 1 ) + ':anonymize]';
            }
         };
         var format = ax.string.createFormatter( formatters, mappers );
         return {
            text: format( text, replacements ),
            replacements: anonymizeReplacements
         };
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function defaultFormatter( value, subSpecifier ) {
         if( typeof value === 'object' && value != null ) {
            if( value instanceof Error ) {
               return JSON.stringify( {
                  message: value.message,
                  stack: value.stack || ''
               } );
            }
            return JSON.stringify( value );
         }
         return ax.string.DEFAULT_FORMATTERS[ 'default' ]( value, subSpecifier );
      }
   }

   return {
      name: 'ax-log-activity',
      injections: injections,
      create: logController
   };
} );
