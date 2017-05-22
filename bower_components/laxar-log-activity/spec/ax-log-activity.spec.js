/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'json!../widget.json',
   '../ax-log-activity',
   'jquery',
   'laxar-mocks',
   'laxar'
], function( descriptor, controller, $, axMocks, ax, undefined ) {
   'use strict';

   describe( 'A laxar-log-activity', function() {
      var widgetEventBus;
      var widgetContext;
      var testEventBus;

      var INSTANCE_ID;
      var lastRequestBody;
      var numberOfMessageBatches;
      var originalTimeout;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function createSetup( widgetConfiguration, logResourceUrl ) {
         beforeEach( function() {
            numberOfMessageBatches = 0;
            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
         } );

         beforeEach( axMocks.createSetupForWidget( descriptor, { } ) );

         beforeEach( function() {
            jasmine.clock().install();
            spyOn( ax.configuration, 'get' ).and.callFake( function( path ) {
               expect( path ).toEqual( 'widgets.laxar-log-activity.resourceUrl' );
               return logResourceUrl;
            } );
            axMocks.widget.configure( widgetConfiguration );
         } );

         beforeEach( axMocks.widget.load );

         beforeEach( function() {
            widgetContext = axMocks.widget.axContext;
            widgetEventBus = axMocks.widget.axEventBus;
            testEventBus = axMocks.eventBus;
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function text( messageItem ) {
         return messageItem.text;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( axMocks.tearDown );

      afterEach( function() {
         testEventBus.publish( 'endLifecycleRequest.default', { lifecycleId: 'default' } );
         testEventBus.flush();
         jasmine.clock().uninstall();
         jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
         widgetContext.clearBuffer();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature logging', function() {

         var workingPostSpy;

         beforeEach( function() {
            // Make sure that the log threshold matches the expectations
            ax.log.setLogThreshold( 'INFO' );
            $.ajax = workingPostSpy = jasmine.createSpy( 'workingPostSpy' ).and.callFake( function( request ) {
               var method = request.type.toLowerCase();
               if( method === 'post' ) {
                  ++numberOfMessageBatches;
                  lastRequestBody = JSON.parse( request.data );
               }
               var deferred = $.Deferred().resolve(request);
               return deferred.promise();
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when disabled', function() {
            createSetup( { logging: { enabled: false } }, 'http://test-repo:4711' );

            beforeEach( function() {
               ax.log.warn( 'laxar-log-activity spec: this warning MUST not be posted' );
               jasmine.clock().tick( widgetContext.features.logging.threshold.seconds * 1000 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'does not perform any HTTP communication (R1.01)', function() {
               expect( $.ajax ).not.toHaveBeenCalled();
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when receiving portal log messages below the configured threshold', function() {

            createSetup( {}, 'http://test-repo:4711' );

            beforeEach( function() {
               ax.log.info( 'laxar-log-activity spec: this info MUST be buffered' );
               ax.log.warn( 'laxar-log-activity spec: this warning MUST be buffered' );
               ax.log.error( 'laxar-log-activity spec: this error MUST be buffered' );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'defers sending them (R1.02)', function() {
               expect( $.ajax ).not.toHaveBeenCalled();
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when created', function() {

            createSetup( {}, 'http://test-repo:4711' );

            it( 'tries to read the log resource URL from configuration (R1.03)', function() {
               expect( ax.configuration.get ).toHaveBeenCalled();
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when log resource configuration is missing', function() {

            var errorSpy_;

            beforeEach( function() {
               errorSpy_ = spyOn( ax.log, 'error' );
            } );

            createSetup( {}, null );

            it( 'logs an error (R1.04)', function() {
               expect( errorSpy_ ).toHaveBeenCalledWith( 'laxar-log-activity: resourceUrl not configured' );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'using the default time threshold, when that is reached', function() {
            var messagesToSend_;
            createSetup( {}, 'http://test-repo:4711' );

            beforeEach( function() {
               jasmine.DEFAULT_TIMEOUT_INTERVAL = ( widgetContext.features.logging.threshold.seconds + 1 ) * 1000;
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'submits collected messages to the service as items (R1.05)', function() {
               messagesToSend_ = [
                  'laxar-log-activity spec: this info MUST be sent',
                  'laxar-log-activity spec: this warning MUST be sent.',
                  'laxar-log-activity spec: this error MUST be sent'
               ];
               ax.log.debug( 'laxar-log-activity spec: this debug message MUST NOT be sent' );
               ax.log.info( messagesToSend_[ 0 ] );
               ax.log.warn( messagesToSend_[ 1 ] );
               ax.log.error( messagesToSend_[ 2 ] );
               expect( $.ajax ).not.toHaveBeenCalled();
               jasmine.clock().tick( widgetContext.features.logging.threshold.seconds * 1000 );
               ax.log.info( 'laxar-log-activity spec: this message MUST NOT be sent with the first batch' );
               expect( $.ajax ).toHaveBeenCalled();
               expect( lastRequestBody.messages.map( text ) ).toEqual( messagesToSend_ );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'substitutes placeholders in log messages (R1.15)', function() {
               expect( $.ajax ).not.toHaveBeenCalled();
               ax.log.info( 'laxar-log-activity spec: This is a [0] and another [1].', 'placeholder', 1 );
               jasmine.clock().tick( widgetContext.features.logging.threshold.seconds * 1000 );
               var item = lastRequestBody.messages[ 0 ];
               expect( item.text ).toEqual( 'laxar-log-activity spec: This is a placeholder and another 1.' );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'stringifies objects when replacing placeholders in log messages (R1.15)', function() {
               ax.log.info( 'laxar-log-activity spec: This is a [0].', { 'json': 'stringified object' } );
               ax.log.info( 'laxar-log-activity spec: This is a [0].', [ { 'json': 'stringified' }, 'array' ] );
               jasmine.clock().tick( widgetContext.features.logging.threshold.seconds * 1000 );

               var item = lastRequestBody.messages[ 0 ];
               expect( item.text ).toEqual( 'laxar-log-activity spec: This is a {"json":"stringified object"}.' );
               item = lastRequestBody.messages[ 1 ];
               expect( item.text ).toEqual( 'laxar-log-activity spec: This is a [{"json":"stringified"},"array"].' );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'treats the escaped backslash-escaped characters as normal text (R1.15)', function() {
               ax.log.info( 'laxar-log-activity spec: This \\[0] is not a placeholder', 4711 );
               jasmine.clock().tick( widgetContext.features.logging.threshold.seconds * 1000 );
               var item = lastRequestBody.messages[ 0 ];
               expect( item.text ).toEqual( 'laxar-log-activity spec: This [0] is not a placeholder' );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'when a message with log tags was logged', function() {

               beforeEach( function() {
                  var context = ax.log.context || ax.log;
                  context.addTag( 'TAG1', 'My tag' );
                  context.addTag( 'TAG2', 'My other tag' );
                  ax.log.info( 'Log Activity spec: Text' );
                  jasmine.clock().tick( widgetContext.features.logging.threshold.seconds * 1000 );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'appends the log tags to the message (R1.16)', function() {
                  var item = lastRequestBody.messages[ 0 ];
                  var tags = item.tags;
                  expect( tags ).toContain( 'INST:' + ( ax.log.context || ax.log ).gatherTags()[ 'INST' ] );
                  expect( tags ).toContain( 'TAG1:My tag' );
                  expect( tags ).toContain( 'TAG2:My other tag' );
               } );

            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'assigns the application instance identifier as tag INST to the items (R1.17)', function() {
               ax.log.info( 'laxar-log-activity spec: this info MUST be sent' );
               jasmine.clock().tick( widgetContext.features.logging.threshold.seconds * 1000 );
               var item = lastRequestBody.messages[ 0 ];
               expect( item.tags ).toContain( 'INST:' + INSTANCE_ID );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'submits the log level with each item (R1.18)', function() {
               messagesToSend_ = [
                  'laxar-log-activity spec: this info MUST be sent',
                  'laxar-log-activity spec: this warning MUST be sent.',
                  'laxar-log-activity spec: this error MUST be sent'
               ];
               ax.log.info( messagesToSend_[ 0 ] );
               ax.log.warn( messagesToSend_[ 1 ] );
               ax.log.error( messagesToSend_[ 2 ] );
               jasmine.clock().tick( widgetContext.features.logging.threshold.seconds * 1000 );
               expect( lastRequestBody.messages[ 0 ].level ).toEqual( 'INFO' );
               expect( lastRequestBody.messages[ 1 ].level ).toEqual( 'WARN' );
               expect( lastRequestBody.messages[ 2 ].level ).toEqual( 'ERROR' );
            } );


            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'submits the creation time with each item (R1.18)', function() {
               ax.log.info( 'laxar-log-activity spec: this info MUST be sent' );
               jasmine.clock().tick( widgetContext.features.logging.threshold.seconds * 1000 );
               expect( lastRequestBody.messages[ 0 ].time ).toEqual( jasmine.any( String ) );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'a message doesn\'t delays the submission', function() {
               messagesToSend_ = [
                  'laxar-log-activity spec: this info MUST be sent',
                  'laxar-log-activity spec: this warning MUST be sent.',
                  'laxar-log-activity spec: this error MUST be sent'
               ];
               ax.log.info( messagesToSend_[ 0 ] );
               ax.log.warn( messagesToSend_[ 1 ] );
               jasmine.clock().tick( widgetContext.features.logging.threshold.seconds * 1000 / 2 );
               ax.log.error( messagesToSend_[ 2 ] );
               expect( $.ajax ).not.toHaveBeenCalled();
               jasmine.clock().tick( widgetContext.features.logging.threshold.seconds * 1000 / 2 );
               expect( $.ajax ).toHaveBeenCalled();
               expect( lastRequestBody.messages.map( text ) ).toEqual( messagesToSend_ );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'using the user-defined time threshold, when that is reached', function() {
            var messagesToSend_;
            var userSetThresholdSeconds = 777;
            var userSetThresholdMs = userSetThresholdSeconds * 1000;

            createSetup( { logging: { threshold: { seconds: userSetThresholdSeconds } } },
                         'http://test-repo:4711' );

            beforeEach( function() {
               jasmine.DEFAULT_TIMEOUT_INTERVAL = ( userSetThresholdSeconds + 1 ) * 1000 ;
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'submits collected messages to the service (R1.06)', function() {
               messagesToSend_ = [ 'laxar-log-activity spec: this info MUST be sent' ];
               ax.log.info( messagesToSend_[ 0 ] );
               jasmine.clock().tick( userSetThresholdMs - 1 );
               expect( $.ajax ).not.toHaveBeenCalled();
               jasmine.clock().tick( 1 );
               ax.log.info( 'laxar-log-activity spec: this message MUST NOT be sent' );
               jasmine.clock().tick( userSetThresholdMs - 1 );
               expect( lastRequestBody.messages.map( text ) ).toEqual( messagesToSend_ );
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'using the request policy "PER_MESSAGE"', function() {

            var limit = 3;
            createSetup( { logging: { threshold: { messages: limit }, requestPolicy: 'PER_MESSAGE' } },
                         'http://test-repo:4711' );

            beforeEach( function() {
               limit = widgetContext.features.logging.threshold.messages;
               for( var i = 0; i < limit; ++i ) {
                  ax.log.info( 'laxar-log-activity spec: message number ' + i );
               }
               jasmine.clock().tick( 0 );
            } );

            it( 'submits collected messages to the service per message (R1.07)', function() {
               expect( numberOfMessageBatches ).toEqual( 3 );
               expect( lastRequestBody.text ).toEqual( 'laxar-log-activity spec: message number 2' );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when the event window.onload is triggered', function() {

            var messagesToSend_;
            var originalBeforeunload_;

            createSetup( {}, 'http://test-repo:4711' );

            beforeEach( function() {
               messagesToSend_ = [ 'laxar-log-activity spec: this info MUST be sent' ];
               ax.log.info( messagesToSend_[ 0 ] );

               // PhantomJS compatibility: temporarily clear beforeunload to allow for event simulation
               originalBeforeunload_ = window.onbeforeunload;
               window.onbeforeunload = function() {};
               $( window ).triggerHandler( 'beforeunload' );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            afterEach( function() {
               window.onbeforeunload = originalBeforeunload_;
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'immediately submits collected messages to the log service (R1.08)', function() {
               expect( lastRequestBody.messages.map( text ) ).toEqual( messagesToSend_ );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'using the default maximum number of messages', function() {

            var limit_;
            createSetup( {}, 'http://test-repo:4711' );

            beforeEach( function() {
               limit_ = widgetContext.features.logging.threshold.messages;
               for( var i = 0; i < limit_ - 1; ++i ) {
                  ax.log.info( 'laxar-log-activity spec: message number ' + i );
               }
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'buffers as long as that has not been reached (R1.09, R1.11)', function() {
               expect( numberOfMessageBatches ).toEqual( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'when that is reached', function() {

               beforeEach( function() {
                  ax.log.info( 'laxar-log-activity spec: message number ' + (limit_ - 1) );
                  ax.log.info( 'laxar-log-activity spec: this message MUST NOT be sent in the first batch' );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'submits collected messages to the service (R1.09, R1.11)', function() {
                  expect( numberOfMessageBatches ).toEqual( 1 );
                  expect( lastRequestBody.messages.length ).toEqual( limit_ );
               } );

            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'using a user-defined maximum number of messages', function() {

            var limit = 7;

            createSetup( { logging: { threshold: { messages: limit } } }, 'http://test-repo:4711' );

            beforeEach( function() {
               limit = widgetContext.features.logging.threshold.messages;
               for( var i = 0; i < limit - 1; ++i ) {
                  ax.log.info( 'laxar-log-activity spec: message number ' + i );
               }
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'buffers as long as that has not been reached (R1.10, R1.11)', function() {
               expect( numberOfMessageBatches ).toEqual( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'when that is reached', function() {

               beforeEach( function() {
                  ax.log.info( 'laxar-log-activity spec: message number ' + (limit - 1) );
                  ax.log.info( 'laxar-log-activity spec: this message MUST NOT be sent in the first batch' );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'submits collected messages to the service (R1.10, R1.11)', function() {
                  expect( numberOfMessageBatches ).toEqual( 1 );
                  expect( lastRequestBody.messages.length ).toEqual( limit );
               } );

            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when receiving a didEncounterError event', function() {

            createSetup( {}, 'http://test-repo:4711' );

            beforeEach( function() {
               spyOn( ax.log, 'error' ).and.callThrough();

               var errorData = {
                  code: 'HTTP_GET',
                  message: 'laxar-log-activity spec: simulated error',
                  data: {
                     text: '404 Not Found'
                  }
               };
               testEventBus.publish( 'didEncounterError.' + errorData.code, errorData );
               testEventBus.flush();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'generates a corresponding log message (R1.13)', function() {
               expect( ax.log.error ).toHaveBeenCalledWith(
                  '([0]) [1]', 'HTTP_GET', 'laxar-log-activity spec: simulated error'
               );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when multiple identical log messages are received in a row', function() {

            var batchSize = 3;
            var repetitions = 10;
            var repeatedMessage = 'laxar-log-activity spec: repeated message that MUST be logged once';
            var otherMessage = 'laxar-log-activity spec: ' +
                               'Another message that MUST be logged in the first batch';

            createSetup( { logging: { threshold: { messages: batchSize } } }, 'http://test-repo:4711' );

            beforeEach( function() {
               for( var i = 0; i < repetitions; ++i ) {
                  ax.log.info( repeatedMessage );
               }
               ax.log.warn( otherMessage );
               jasmine.clock().tick( widgetContext.features.logging.threshold.seconds * 1000 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'collapses them into one message on receipt (R1.14)', function() {
               expect( numberOfMessageBatches ).toEqual( 1 );
               expect( lastRequestBody.messages.length ).toEqual( 2 );

               var firstMessage = text( lastRequestBody.messages[ 0 ] );
               expect( firstMessage ).not.toEqual( repeatedMessage );
               expect( firstMessage ).toContain( repeatedMessage );
               expect( firstMessage ).toContain( '10x' );
               expect( text( lastRequestBody.messages[ 1 ] ) ).toEqual( otherMessage );
            } );

         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature logging when a communication error occurs', function() {

         var messageToLose = 'laxar-log-activity spec: This message MUST NOT be re-sent';
         var messageToKeep = 'laxar-log-activity spec: This message MUST be sent';
         var messageToSentDirect = 'laxar-log-activity spec: This message MUST be sent';
         var failingPostSpy;
         var workingPostSpy;
         var thresholdSeconds = 100;
         var retrySeconds = 100;
         var retries = 4;

         beforeEach( function() {
            $.ajax = failingPostSpy = jasmine.createSpy( 'failingPostSpy' ).and.callFake( function() {
               var deferred = $.Deferred().reject( 'failed' );
               return deferred.promise();
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and with retry enabled', function() {

            createSetup(
               {
                  logging: {
                     threshold: {
                        seconds: thresholdSeconds
                     },
                     retry: {
                        enabled: true,
                        seconds: retrySeconds,
                        retries: retries
                     }
                  }
               },
               'http://test-repo:4711'
            );

            beforeEach( function() {
               ax.log.info( messageToLose + ' 0' );
               jasmine.clock().tick( thresholdSeconds * 1000 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            afterEach( function() {
               jasmine.clock().tick( retrySeconds * 1000 * ( retries + 1 ) );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'retries to submit the failed messages after a configured time seconds (R1.20)', function() {
               expect( failingPostSpy.calls.count() ).toEqual( 1 );
               jasmine.clock().tick( retrySeconds * 1000 );
               expect( failingPostSpy.calls.count() ).toEqual( 2 );
               jasmine.clock().tick( retrySeconds * 1000 );
               expect( failingPostSpy.calls.count() ).toEqual( 3 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'retries to submit the failed messages only a configured number of retries (R1.20)', function() {
               expect( failingPostSpy.calls.count() ).toEqual( 1 );
               jasmine.clock().tick( retrySeconds * 1000 );
               expect( failingPostSpy.calls.count() ).toEqual( 2 );
               jasmine.clock().tick( retrySeconds * 1000 * retries + 1 );
               expect( failingPostSpy.calls.count() ).toEqual( retries + 1 );
               jasmine.clock().tick( retrySeconds * 1000 );
               expect( failingPostSpy.calls.count() ).toEqual( retries + 1 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'and the service is available again and new messages are logged', function() {

               beforeEach( function() {
                  $.ajax = workingPostSpy = jasmine.createSpy( 'workingPostSpy' ).and.callFake( function( request ) {
                     var method = request.type.toLowerCase();
                     if( method === 'post' ) {
                        ++numberOfMessageBatches;
                        lastRequestBody = JSON.parse( request.data );
                     }
                     var deferred = $.Deferred().resolve(request);
                     return deferred.promise();
                  } );
                  ax.log.info( messageToSentDirect + ' 0' );
                  ax.log.info( messageToSentDirect + ' 1' );
               } );

               //////////////////////////////////////////////////////////////////////////////////////////////////

               it( 'retries to submit the failed messages without the new collected ones (R1.20)', function() {
                  expect( failingPostSpy.calls.count() ).toEqual( 1 );
                  jasmine.clock().tick( retrySeconds * 1000 );
                  jasmine.clock().tick( thresholdSeconds * 1000 );
                  expect( workingPostSpy.calls.count() ).toEqual( 2 );
               } );

            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'without feature retry', function() {

            createSetup( {}, 'http://test-repo:4711' );

            beforeEach( function() {
               ax.log.info( messageToLose + ' 0' );
               ax.log.info( messageToLose + ' 1' );
               ax.log.info( messageToLose + ' 2' );
               jasmine.clock().tick( widgetContext.features.logging.threshold.seconds * 1000 );

               $.ajax = workingPostSpy = jasmine.createSpy( 'workingPostSpy' ).and.callFake( function( request ) {
                  var method = request.type.toLowerCase();
                  if( method === 'post' ) {
                     ++numberOfMessageBatches;
                     lastRequestBody = JSON.parse( request.data );
                  }
                  var deferred = $.Deferred().resolve(request);
                  return deferred.promise();
               } );

               ax.log.info( messageToKeep + ' 0' );
               ax.log.info( messageToKeep + ' 1' );
               jasmine.clock().tick( widgetContext.features.logging.threshold.seconds * 1000 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'discards failed messages (R1.12)', function() {
               expect( failingPostSpy.calls.count() ).toEqual( 1 );
               expect( workingPostSpy.calls.count() ).toEqual( 1 );
               expect( lastRequestBody.messages.map( text ) ).toEqual( [
                  messageToKeep + ' 0',
                  messageToKeep + ' 1'
               ] );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and with retry enabled and the request policy "PER_MESSAGE"', function() {

            createSetup(
               {
                  logging: {
                     threshold: {
                        seconds: thresholdSeconds
                     },
                     requestPolicy: 'PER_MESSAGE',
                     retry: {
                        enabled: true,
                        seconds: retrySeconds,
                        retries: retries
                     }
                  }
               },
               'http://test-repo:4711'
            );

            beforeEach( function() {
               ax.log.info( messageToLose + ' 0' );
               jasmine.clock().tick( thresholdSeconds * 1000 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            afterEach( function() {
               jasmine.clock().tick( retrySeconds * 1000 * retries );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'retries to submit the failed messages after a configured time interval (R1.20)', function() {
               expect( failingPostSpy.calls.count() ).toEqual( 1 );
               jasmine.clock().tick( retrySeconds * 1000 );
               expect( failingPostSpy.calls.count() ).toEqual( 2 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'retries to submit the failed messages only a configured number of retries (R1.20)', function() {
               expect( failingPostSpy.calls.count() ).toEqual( 1 );
               jasmine.clock().tick( retrySeconds * 1000 * retries );
               expect( failingPostSpy.calls.count() ).toEqual( retries + 1 );
               jasmine.clock().tick( retrySeconds * 1000 );
               expect( failingPostSpy.calls.count() ).toEqual( retries + 1 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'and the service is available again and new messages are logged', function() {

               beforeEach( function() {
                  $.ajax = workingPostSpy = jasmine.createSpy( 'workingPostSpy' ).and.callFake(
                     function( request ) {
                        var method = request.type.toLowerCase();
                        if( method === 'post' ) {
                           ++numberOfMessageBatches;
                           lastRequestBody = JSON.parse( request.data );
                        }
                        var deferred = $.Deferred().resolve(request);
                        return deferred.promise();
                     }
                  );
                  ax.log.info( messageToSentDirect + ' 0' );
                  ax.log.info( messageToSentDirect + ' 1' );

               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'retries to submit the failed messages without the new collected ones (R1.20)', function() {
                  expect( failingPostSpy.calls.count() ).toEqual( 1 );
                  jasmine.clock().tick( retrySeconds * 1000 );
                  jasmine.clock().tick( thresholdSeconds * 1000 );
                  expect( workingPostSpy.calls.count() ).toEqual( 3 );
               } );

            } );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature instanceId', function() {

         var request_;
         var workingPostSpy;

         beforeEach( function() {
            // Make sure that the log threshold matches the expectations
            ax.log.setLogThreshold( 'INFO' );
            $.ajax = workingPostSpy = jasmine.createSpy( 'workingPostSpy' ).and.callFake( function( request ) {
               request.headers = request.headers ? request.headers : {};
               request_ = request;

               var deferred = $.Deferred().resolve(request);
               return deferred.promise();
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when disabled', function(){

            createSetup( {}, 'http://test-repo:4711' );

            beforeEach( function() {
               ax.log.info( 'laxar-log-activity spec: this info MUST be buffered' );
               jasmine.clock().tick( widgetContext.features.logging.threshold.seconds * 1000 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'sends a headers with an empty object (R1.21)', function() {
               // the default of headers in $.ajax is an empty object
               expect( request_.headers ).toEqual( {} );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when enabled', function(){

            createSetup(
               {
                  instanceId: {
                     enabled: true
                  }
               },
               'http://test-repo:4711'
            );

            beforeEach( function() {
               ax.log.info( 'laxar-log-activity spec: this info MUST be buffered' );
               jasmine.clock().tick( widgetContext.features.logging.threshold.seconds * 1000 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'uses the default header (R1.21)', function() {
               expect( request_.headers[ 'x-laxar-log-tags' ] ).toBeDefined();
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and a configured name for the header', function(){

            createSetup(
               {
                  instanceId: {
                     enabled: true,
                     header: 'x-individual-name'
                  }
               },
               'http://test-repo:4711'
            );

            beforeEach( function() {
               ax.log.info( 'laxar-log-activity spec: this info MUST be buffered' );
               jasmine.clock().tick( widgetContext.features.logging.threshold.seconds * 1000 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'uses the configured header (R1.21)', function() {
               expect( request_.headers[ 'x-individual-name' ] ).toBeDefined();
            } );

         } );

      } );

   } );
} );
