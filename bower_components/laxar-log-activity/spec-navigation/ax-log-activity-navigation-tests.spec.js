/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'json!../widget.json',
   '../ax-log-activity',
   'jquery',
   'laxar'
], function( descriptor, controller, $, ax ) {
   'use strict';

   describe( 'A laxar-log-activity with navigation', function() {

      var lastRequestBody;
      var numberOfMessageBatches;
      var originalTimeout;
      var failingPostSpy;
      var workingPostSpy;

      var thresholdSeconds = 120;
      var retries = 10;
      var retrySeconds = 180;

      var scheduledFunctions = [];
      var widgetContext = {};
      var features = {};

      var messagesToSend;

      var baseTime;

      var legacyQ = {
         defer: defer,
         all: Promise.all.bind( Promise ),
         resolve: Promise.resolve.bind( Promise ),
         reject: Promise.reject.bind( Promise ),
         when: Promise.resolve.bind( Promise )
      };
      ax._tooling.eventBus.init( legacyQ, eventBusTick, eventBusTick );
      var testEventBus = ax._tooling.eventBus.create();
      testEventBus.flush = flushEventBusTicks;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         testEventBus.publish( 'endLifecycleRequest.default', { lifecycleId: 'default' } );
         testEventBus.flush();
         jasmine.clock().uninstall();
         jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
         widgetContext.clearBuffer();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature logging', function() {

         beforeEach( function() {
            // Make sure that the log threshold matches the expectations
            ax.log.setLogThreshold( 'INFO' );
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
         } );

         beforeEach( function() {
            numberOfMessageBatches = 0;
            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = ( thresholdSeconds + 1 ) * 1000;
         } );

         beforeEach( function() {
            jasmine.clock().install();
            spyOn( ax.configuration, 'get' ).and.callFake( function( path ) {
               expect( path ).toEqual( 'widgets.laxar-log-activity.resourceUrl' );
               return 'http://test-repo:4711';
            } );
         } );

         beforeEach( function() {
            widgetContext.features = {
               logging: {
                  enabled: true,
                  requestPolicy: 'BATCH',
                  threshold: {
                     seconds: thresholdSeconds,
                     messages: 100
                  },
                  retry: {
                     enabled: true,
                     seconds: retrySeconds,
                     retries: retries
                  }
               },
               instanceId: { enabled: false },
               retry: { enabled: false }
            };
            widgetContext.eventBus = testEventBus;
            features = widgetContext.features;

            controller.create( widgetContext );
            messagesToSend = [
               'laxar-log-activity spec: this info MUST be sent',
               'laxar-log-activity spec: this warning MUST be sent.',
               'laxar-log-activity spec: this error MUST be sent'
            ];
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'doesn\'t submit the messages before one of the defined condition is fulfilled (R1.05, R1.09)',
            function() {
               ax.log.info( messagesToSend[ 0 ] );
               ax.log.warn( messagesToSend[ 1 ] );
               ax.log.error( messagesToSend[ 2 ] );
               expect( workingPostSpy ).not.toHaveBeenCalled();
            }
         );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when the time threshold is reached', function() {

            beforeEach( function() {
               ax.log.info( messagesToSend[ 0 ] );
               ax.log.warn( messagesToSend[ 1 ] );
               ax.log.error( messagesToSend[ 2 ] );
               jasmine.clock().tick( ms( features.logging.threshold.seconds ) );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'submits collected messages to the service as items (R1.05)', function() {
               expect( workingPostSpy ).toHaveBeenCalled();
               expect( lastRequestBody.messages.map( text ) ).toEqual( messagesToSend );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'after navigation and with new log messages when the time threshold is reached',
               function() {

                  beforeEach( function() {
                     ax.log.info( messagesToSend[ 0 ] );
                     testEventBus.publish( 'endLifecycleRequest', { lifecycleId: 'default' } );
                     testEventBus.flush();
                     controller.create( widgetContext );
                     ax.log.warn( messagesToSend[ 1 ] );
                     ax.log.error( messagesToSend[ 2 ] );
                     jasmine.clock().tick( ms( features.logging.threshold.seconds ) );
                  } );

                  ////////////////////////////////////////////////////////////////////////////////////////////

                  it( 'submits collected messages to the service (R1.05)', function() {
                     expect( workingPostSpy ).toHaveBeenCalled();
                     expect( lastRequestBody.messages.map( text ) ).toEqual( messagesToSend );
                  } );

               }
            );

            describe( 'when a navigation is initiated and the time threshold is reached', function() {

               beforeEach( function() {
                  ax.log.info( messagesToSend[ 0 ] );
                  ax.log.warn( messagesToSend[ 1 ] );
                  ax.log.error( messagesToSend[ 2 ] );
                  testEventBus.publish( 'endLifecycleRequest', { lifecycleId: 'default' } );
                  testEventBus.flush();
                  controller.create( widgetContext );
                  jasmine.clock().tick( ms( features.logging.threshold.seconds ) );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'a new activity on the second page submits collected messages to the service (#7, R1.05)',
                  function() {
                     expect( workingPostSpy ).toHaveBeenCalled();
                     expect( lastRequestBody.messages.map( text ) ).toEqual( messagesToSend );
                  }
               );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when a navigation is initiated after the half time of threshold', function() {
            beforeEach( function() {
               baseTime = new Date();
               jasmine.clock().mockDate( baseTime );

               ax.log.info( messagesToSend[ 0 ] );
               ax.log.warn( messagesToSend[ 1 ] );
               ax.log.error( messagesToSend[ 2 ] );
            } );

            afterEach( function() {
               jasmine.clock().tick( ( retries + 1 ) * ms( retrySeconds ) );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

             it( 'doesn\'t submit the messages before the full time of threshold is reached (#7, R1.05)',
                function(  ) {
                  var halfMillisecondsThreshold = ms( features.logging.threshold.seconds / 2 );
                  jasmine.clock().tick( halfMillisecondsThreshold );
                  expect( workingPostSpy ).not.toHaveBeenCalled();
                }
             );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'and after the full time of threshold is reached (#7, R1.05)', function() {

               it( 'a new activity on the second page submits collected messages to the service', function() {
                  var halfMillisecondsThreshold = ms( features.logging.threshold.seconds / 2 );

                  jasmine.clock().tick( halfMillisecondsThreshold );
                  expect( workingPostSpy ).not.toHaveBeenCalled();

                  testEventBus.publish( 'endLifecycleRequest', { lifecycleId: 'default' } );
                  testEventBus.flush();
                  controller.create( widgetContext );
                  expect( workingPostSpy ).not.toHaveBeenCalled();

                  jasmine.clock().tick( halfMillisecondsThreshold );
                  expect( workingPostSpy ).toHaveBeenCalled();
                  expect( lastRequestBody.messages.map( text ) ).toEqual( messagesToSend );
               } );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'and after another navigation and the full time of threshold is reached', function() {

               it( 'a new activity on the third page submits collected messages to the service (#7, R1.05)',
                  function() {
                     var halfMillisecondsThreshold = ms( features.logging.threshold.seconds / 2 );
                     var quarterMillisecondsThreshold = ms( features.logging.threshold.seconds / 4 );

                     jasmine.clock().tick( quarterMillisecondsThreshold );
                     expect( workingPostSpy ).not.toHaveBeenCalled();

                     testEventBus.publish( 'endLifecycleRequest', { lifecycleId: 'default' } );
                     testEventBus.flush();
                     controller.create( widgetContext );
                     expect( workingPostSpy ).not.toHaveBeenCalled();

                     jasmine.clock().tick( quarterMillisecondsThreshold );
                     expect( workingPostSpy ).not.toHaveBeenCalled();

                     testEventBus.publish( 'endLifecycleRequest', { lifecycleId: 'default' } );
                     testEventBus.flush();
                     controller.create( widgetContext );
                     expect( workingPostSpy ).not.toHaveBeenCalled();

                     jasmine.clock().tick( halfMillisecondsThreshold );
                     expect( workingPostSpy ).toHaveBeenCalled();
                     expect( lastRequestBody.messages.map( text ) ).toEqual( messagesToSend );
                  }
               );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'with retry enabled and when disconnected before and after navigation',
               function() {
                  var messageToLose = 'laxar-log-activity spec: This message MUST NOT be re-sent';
                  var messageToSentDirect = 'laxar-log-activity spec: This message MUST be sent';

                  beforeEach( function() {
                     baseTime = new Date();
                     jasmine.clock().mockDate( baseTime );

                     $.ajax = failingPostSpy = jasmine.createSpy( 'failingPostSpy' ).and.callFake( function() {
                        var deferred = $.Deferred().reject( 'failed' );
                        return deferred.promise();
                     } );

                     ax.log.info( messageToLose + '0' );
                     jasmine.clock().tick( ms( thresholdSeconds ) );
                     testEventBus.publish( 'endLifecycleRequest', { lifecycleId: 'default' } );
                     testEventBus.flush();
                     controller.create( widgetContext );
                  } );

                  ////////////////////////////////////////////////////////////////////////////////////////////

                  it( 'retries to submit the failed messages after a configured time seconds (#7, R1.20)',
                     function() {
                        expect( failingPostSpy.calls.count() ).toEqual( 1 );

                        jasmine.clock().tick( ms( retrySeconds ) );
                        expect( failingPostSpy.calls.count() ).toEqual( 2 );

                        jasmine.clock().tick( ms( retrySeconds ) );
                        expect( failingPostSpy.calls.count() ).toEqual( 3 );

                  } );

                  ////////////////////////////////////////////////////////////////////////////////////////////

                  it( 'retries to submit the failed messages only a configured number of retries (#7, R1.20)',
                     function() {
                        expect( failingPostSpy.calls.count() ).toEqual( 1 );
                        jasmine.clock().tick( ms( retrySeconds ) );
                        expect( failingPostSpy.calls.count() ).toEqual( 2 );
                        jasmine.clock().tick( ms( retrySeconds ) * retries + 1 );
                        expect( failingPostSpy.calls.count() ).toEqual( retries + 1 );
                        jasmine.clock().tick( ms( retrySeconds ) );
                        expect( failingPostSpy.calls.count() ).toEqual( retries + 1 );

                     }
                  );

                  ////////////////////////////////////////////////////////////////////////////////////////////

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
                        ax.log.info( messageToSentDirect + '0' );
                        ax.log.info( messageToSentDirect + '1' );
                     } );

                     /////////////////////////////////////////////////////////////////////////////////////////

                     it( 'retries to submit the failed messages without the new collected ones (#7, R1.20)',
                        function() {
                           expect( failingPostSpy.calls.count() ).toEqual( 1 );
                           jasmine.clock().tick( ms( retrySeconds ) );
                           jasmine.clock().tick( ms( thresholdSeconds ) );
                           expect( workingPostSpy.calls.count() ).toEqual( 2 );
                        }
                     );
                  } );
               }
            );

         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function text( messageItem ) {
         return messageItem.text;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function defer() {
         var deferred = {};
         deferred.promise = new Promise( function( resolve, reject ) {
            deferred.resolve = resolve;
            deferred.reject = reject;
         } );
         return deferred;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function eventBusTick( func ) {
         scheduledFunctions.push( func );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function flushEventBusTicks() {
         while( scheduledFunctions.length > 0 ) {
            var funcs = scheduledFunctions.slice( 0 );
            scheduledFunctions = [];
            funcs.forEach( executeFunction );
         }

         function executeFunction( func ) {
            func();
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function ms( seconds ) {
         return seconds * 1000;
      }

   } );
} );
