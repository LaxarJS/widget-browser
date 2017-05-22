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

   var buffer_ = [];
   var resendBuffer = [];
   var retryTimeout;
   var retryMilliseconds;
   var nextSubmit = null;
   var logResourceUrl_;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var injections = [ 'axContext' ];

   var logController = function( context ) {

      //function for the spec tests
      context.clearBuffer = function() {
         buffer_.length = 0;
         resendBuffer = [];
         nextSubmit = null;
         retryTimeout = null;
         retryMilliseconds = null;
      };

      if( !context.features.logging.enabled ) {
         return;
      }
      logResourceUrl_ = ax.configuration.get( 'widgets.laxar-log-activity.resourceUrl', null );
      if( !logResourceUrl_ ) {
         ax.log.error( 'laxar-log-activity: resourceUrl not configured' );
         return;
      }

      var instanceId = ax.log.gatherTags()[ 'INST' ];
      var headers = {};
      if( context.features.instanceId.enabled ) {
         headers[ context.features.instanceId.header ] = '[INST:' + instanceId + ']';
      }

      var waitMilliseconds = context.features.logging.threshold.seconds * 1000;
      var waitMessages = context.features.logging.threshold.messages;

      if( context.features.logging.retry.enabled ) {
         var resendRetries = context.features.logging.retry.retries;
         if( resendBuffer.length > 0 ) {
            scheduleNextResend();
         }
      }

      // Collect log messages and submit them periodically:
      ax.log.addLogChannel( handleLogItem );

      var timeout;

      var dateNow = Date.now();
      if( nextSubmit && dateNow >= nextSubmit ) {
         submit();
      }
      else {
         scheduleNextSubmit( dateNow );
      }


      context.eventBus.subscribe( 'endLifecycleRequest', function() {
         ax.log.removeLogChannel( handleLogItem );
         window.clearTimeout( timeout );
         window.clearTimeout( retryTimeout );
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
         window.clearTimeout( retryTimeout );
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
         nextSubmit = null;
         scheduleNextSubmit( Date.now() );

         if( context.features.logging.requestPolicy === 'BATCH' ) {
            submitBatch( synchronously );
         }
         else if( context.features.logging.requestPolicy === 'PER_MESSAGE' ) {
            submitPerMessage( synchronously );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function submitBatch( synchronously ) {
         if( !buffer_.length ) {
            return;
         }

         var requestBody = prepareRequestBody( buffer_ );
         buffer_ = [];
         postTo( logResourceUrl_, requestBody, synchronously ).fail(
            function() {
               if( context.features.logging.retry.enabled && !synchronously ) {
                  resendBuffer.push( {
                     requestBody: requestBody,
                     retriesLeft: resendRetries
                  } );
                  scheduleNextResend();
               }
            }
         );

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

      function submitPerMessage( synchronously ) {
         if( !buffer_.length ) {
            return;
         }

         buffer_.forEach( function( message ) {
            if( message.repetitions > 1 ) {
               message.text += ' (repeated ' + message.repetitions + 'x)';
            }
            message.source = document.location.origin;
            var requestBody = JSON.stringify( message );
            postTo( logResourceUrl_, requestBody, synchronously ).fail(
               function() {
                  if( context.features.logging.retry.enabled && !synchronously ) {
                     resendBuffer.push( {
                        requestBody: requestBody,
                        retriesLeft: resendRetries
                     } );
                     scheduleNextResend();
                  }
               }
            );
         } );
         buffer_ = [];
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function resendMessages( synchronously ) {
         window.clearTimeout( retryTimeout );
         resendBuffer = resendBuffer.filter( function( item ) { return item.retriesLeft > 0; } );
         if( resendBuffer.length > 0 ) {
            retryTimeout = window.setTimeout( resendMessages, retryMilliseconds );
         }
         resendBuffer.forEach( function( item ) {
            --item.retriesLeft;
            postTo( logResourceUrl_, item.requestBody, synchronously )
               .then(
                  function() { item.retriesLeft = 0; },
                  function() { }
               );
         } );
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
            headers: headers
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function scheduleNextSubmit( dateNow ) {
         window.clearTimeout( timeout );
         if( nextSubmit ) {
            timeout = window.setTimeout( submit, nextSubmit - dateNow );
         }
         else {
            timeout = window.setTimeout( submit, waitMilliseconds );
            nextSubmit = dateNow + waitMilliseconds;
         }
      }

      ///////////////////////////////////////////////////////////////////////////////////////////////////////////

      function scheduleNextResend() {
         window.clearTimeout( retryTimeout );
         retryMilliseconds = context.features.logging.retry.seconds * 1000;
         retryTimeout = window.setTimeout( resendMessages, retryMilliseconds );
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
