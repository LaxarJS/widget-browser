/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'json!../widget.json',
   'laxar-mocks',
   'laxar',
   'angular-mocks',
   './helpers/spec_helper',
   './fixtures'
], function( descriptor, axMocks, ax, ngMocks, buttonMatchers, testData ) {
   'use strict';

   var widgetEventBus;
   var widgetScope;
   var testEventBus;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createSetup( widgetConfiguration ) {

      beforeEach( axMocks.createSetupForWidget( descriptor, {
         knownMissingResources: [ 'ax-button-list-control.css' ]
      } ) );

      beforeEach( function() {
         axMocks.widget.configure( widgetConfiguration );
      } );

      beforeEach( axMocks.widget.load );

      beforeEach( function() {
         widgetScope = axMocks.widget.$scope;
         widgetEventBus = axMocks.widget.axEventBus;
         testEventBus = axMocks.eventBus;
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   beforeEach( function() {
      jasmine.addMatchers( buttonMatchers );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   afterEach( function() {
      axMocks.tearDown();
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'An ax-command-bar-widget', function() {

      createSetup( { buttons: [] } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'defines three distinct areas for buttons (R1.1)', function() {
         expect( widgetScope.model.areas.left ).toBeDefined();
         expect( widgetScope.model.areas.center ).toBeDefined();
         expect( widgetScope.model.areas.right ).toBeDefined();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'renders no buttons by default', function() {
         expect( widgetScope.model.areas.left.length ).toBe( 0 );
         expect( widgetScope.model.areas.center.length ).toBe( 0 );
         expect( widgetScope.model.areas.right.length ).toBe( 0 );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'An AxCommandBarWidget with some custom buttons', function() {

      describe( 'when no buttons are disabled', function() {

         createSetup( testData.customAllEnabledButtons );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'puts them into the correct areas (R1.2, R2.4)', function() {
            expect( widgetScope.model.areas.left ).toContainButtonWithAction( 'action1' );
            expect( widgetScope.model.areas.left ).toContainButtonWithAction( 'action2' );
            expect( widgetScope.model.areas.left ).toContainButtonWithAction( 'action3' );
            expect( widgetScope.model.areas.center ).toContainButtonWithAction( 'action4' );
            expect( widgetScope.model.areas.right ).toContainButtonWithAction( 'action5' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sorts them by their index (R2.4)', function() {
            expect( widgetScope.model.areas.left[ 0 ] ).toHaveAction( 'action3' );
            expect( widgetScope.model.areas.left[ 1 ] ).toHaveAction( 'action1' );
            expect( widgetScope.model.areas.left[ 2 ] ).toHaveAction( 'action2' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sets the css class for class-attribute (R2.5)', function() {
            expect( widgetScope.model.areas.right[ 0 ].classes[ 'btn-success' ] ).toBe( true );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sets the css class for size-attribute (R2.6)', function() {
            expect( widgetScope.model.areas.center[ 0 ].classes[ 'btn-sm' ] ).toBe( true );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when some buttons are disabled', function() {

         beforeEach( function() {
            testData.customAllEnabledButtons.buttons[ 1 ].enabled = false;
            testData.customAllEnabledButtons.buttons[ 3 ].enabled = false;
         } );

         createSetup( testData.customAllEnabledButtons );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         afterEach( function() {
            testData.customAllEnabledButtons.buttons[ 1 ].enabled = true;
            testData.customAllEnabledButtons.buttons[ 3 ].enabled = true;
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does not render these buttons (R2.1)', function() {
            expect( widgetScope.model.areas.left ).toContainButtonWithAction( 'action1' );
            expect( widgetScope.model.areas.left ).not.toContainButtonWithAction( 'action2' );
            expect( widgetScope.model.areas.left ).toContainButtonWithAction( 'action3' );
            expect( widgetScope.model.areas.center ).not.toContainButtonWithAction( 'action4' );
            expect( widgetScope.model.areas.right ).toContainButtonWithAction( 'action5' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when no buttons are disabled and some buttons have index and some have no index', function() {

         createSetup( testData.sortTestButtons.customButtons  );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sorts them by their index (R2.4)', function() {
            var buttonOrder = [ 15, 1, 2, 3, 4, 5, 10, 11, 6, 12, 13, 7, 14, 8, 9 ];
            widgetScope.model.areas.left.forEach( function( button, i ) {
               expect( button ).toHaveAction( 'action' + buttonOrder[ i ] );
            } );
         } );

      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'An AxCommandBarWidget with some default buttons', function() {

      describe( 'when no buttons are disabled', function() {

         createSetup( testData.defaultAllEnabledButtons );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'puts them into the correct areas (R3.1)', function() {
            expect( widgetScope.model.areas.left ).toContainButtonWithAction( 'previous' );
            expect( widgetScope.model.areas.center ).toContainButtonWithAction( 'help' );
            expect( widgetScope.model.areas.right ).toContainButtonWithAction( 'next' );
            expect( widgetScope.model.areas.right ).toContainButtonWithAction( 'cancel' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sorts them by their index (R3.1)', function() {
            expect( widgetScope.model.areas.right[ 0 ] ).toHaveAction( 'cancel' );
            expect( widgetScope.model.areas.right[ 1 ] ).toHaveAction( 'next' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when some buttons are disabled', function() {

         beforeEach( function() {
            testData.defaultAllEnabledButtons.previous.enabled = false;
            testData.defaultAllEnabledButtons.next.enabled = false;
         } );

         createSetup( testData.defaultAllEnabledButtons );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         afterEach( function() {
            testData.defaultAllEnabledButtons.previous.enabled = true;
            testData.defaultAllEnabledButtons.next.enabled = true;
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does not render these buttons (R3.1)', function() {
            expect( widgetScope.model.areas.left ).not.toContainButtonWithAction( 'previous' );
            expect( widgetScope.model.areas.center ).toContainButtonWithAction( 'help' );
            expect( widgetScope.model.areas.right ).not.toContainButtonWithAction( 'next' );
            expect( widgetScope.model.areas.right ).toContainButtonWithAction( 'cancel' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'and some of the buttons have index and some have no index', function() {

         createSetup( testData.sortTestButtons.defaultButtons );

         //////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sorts them by their index and inserts default buttons before custom buttons having the same index (R2.4)', function() {
            var buttonOrder = [ 11, 7, 8, 1, 3, 4, 5, 9, 12, 10, 2 ];
            widgetScope.model.areas.left.forEach( function( button, i ) {
               expect( button ).toHaveAction( 'action' + buttonOrder[ i ] );
            } );
         } );

      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'An AxCommandBarWidget with both custom and default buttons', function() {

      describe( '', function() {

         var features = ax.object.deepClone( testData.defaultAllEnabledButtons );
         features.buttons = testData.customAllEnabledButtons.buttons;

         createSetup( features );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'inserts default buttons before custom buttons having the same index (R3.2)', function() {
            expect( widgetScope.model.areas.right[ 0 ] ).toHaveAction( 'cancel' );
            expect( widgetScope.model.areas.right[ 1 ] ).toHaveAction( 'action5' );
            expect( widgetScope.model.areas.right[ 2 ] ).toHaveAction( 'next' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'creates a view label for a simple string (R2.2)', function() {
            expect( widgetScope.model.areas.right[ 1 ].htmlLabel ).toEqual( 'Action 5' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'creates a view label for a localized object based on the current locale (R2.2)', function() {
            changeLocale( 'de' );
            var next = widgetScope.model.areas.right[ 2 ];
            expect( next.htmlLabel ).toEqual( '<i class=\"icon-circle-arrow-right\"></i> Weiter' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and some of the buttons have index and some have no index', function() {

            createSetup( testData.sortTestButtons.defaultAndCustomButtons );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'sorts them by their index and inserts default buttons before custom buttons having the same index (R2.4, R3.2)', function() {
               var buttonOrder = [ 16, 15, 1, 2, 3, 4, 5, 10, 11, 18, 6, 12, 13, 7, 14, 17, 8, 9 ];
               widgetScope.model.areas.left.forEach( function( button, i ) {
                  expect( button ).toHaveAction( 'action' + buttonOrder[ i ] );
               } );
            } );

         } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'An AxCommandBarWidget with buttons', function() {

      createSetup( testData.defaultAllEnabledButtons );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when configured flags change', function() {

         var mySpy;
         var nextButton;
         var helpButton;
         var previousButton;

         function publishFlagChange( flag, state ) {
            widgetScope.eventBus.publish( 'didChangeFlag.' + flag + '.' + state, {
               flag: flag,
               state: state
            } );
            testEventBus.flush();
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         beforeEach( function() {
            mySpy = jasmine.createSpy( 'takeActionRequestSpy' );
            widgetEventBus.subscribe( 'takeActionRequest', mySpy );

            nextButton = widgetScope.model.areas.right[ 1 ];
            helpButton = widgetScope.model.areas.center[ 0 ];
            previousButton = widgetScope.model.areas.left[ 0 ];

            publishFlagChange( 'helpAvailable', true );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'on true the according css classes are applied (R2.7)', function() {
            expect( nextButton.classes['ax-invisible'] ).toBe( false );
            expect( nextButton.classes['ax-busy'] ).toBe( false );
            expect( helpButton.classes['ax-omitted'] ).toBe( false );
            expect( previousButton.classes['ax-disabled'] ).toBe( false );

            publishFlagChange( 'guestUser', true );
            publishFlagChange( 'navigation', true );
            publishFlagChange( 'helpAvailable', false );
            publishFlagChange( 'notUndoable', true );

            expect( nextButton.classes['ax-invisible'] ).toBe( true );
            expect( nextButton.classes['ax-busy'] ).toBe( true );
            expect( helpButton.classes['ax-omitted'] ).toBe( true );
            expect( previousButton.classes['ax-disabled'] ).toBe( true );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when all flags are active', function() {

            beforeEach( function() {
               publishFlagChange( 'guestUser', true );
               publishFlagChange( 'navigation', true );
               publishFlagChange( 'helpAvailable', false );
               publishFlagChange( 'notUndoable', true );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'on false the according css classes are removed (R2.7)', function() {
               expect( nextButton.classes[ 'ax-invisible' ] ).toBe( true );
               expect( nextButton.classes[ 'ax-busy' ] ).toBe( true );
               expect( helpButton.classes[ 'ax-omitted' ] ).toBe( true );
               expect( previousButton.classes[ 'ax-disabled' ] ).toBe( true );

               publishFlagChange( 'guestUser', false );
               publishFlagChange( 'navigation', false );
               publishFlagChange( 'helpAvailable', true );
               publishFlagChange( 'notUndoable', false );

               expect( nextButton.classes[ 'ax-invisible' ] ).toBe( false );
               expect( nextButton.classes[ 'ax-busy' ] ).toBe( false );
               expect( helpButton.classes[ 'ax-omitted' ] ).toBe( false );
               expect( previousButton.classes[ 'ax-disabled' ] ).toBe( false );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'no user interaction is possible (R2.7)', function() {
               widgetScope.handleButtonClicked( nextButton );
               widgetScope.handleButtonClicked( helpButton );
               widgetScope.handleButtonClicked( previousButton );
               testEventBus.flush();

               expect( mySpy.calls.count() ).toEqual( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'on false user interaction is possible again (R2.7)', function() {
               publishFlagChange( 'guestUser', false );
               publishFlagChange( 'navigation', false );
               publishFlagChange( 'helpAvailable', true );
               publishFlagChange( 'notUndoable', false );

               widgetScope.handleButtonClicked( nextButton );
               widgetScope.handleButtonClicked( helpButton );
               widgetScope.handleButtonClicked( previousButton );
               testEventBus.flush();

               expect( mySpy.calls.count() ).toEqual( 3 );
            } );

         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when a button is pressed', function() {

         var actionEvent;
         var actionEventName;
         var signalActionFinished;
         var nextButton;

         beforeEach( function() {
            nextButton = widgetScope.model.areas.right[ 1 ];

            var action;
            widgetScope.eventBus.subscribe( 'takeActionRequest', function( event, meta ) {
               action = event.action;
               actionEvent = event;
               actionEventName = meta.name;
               widgetScope.eventBus.publish( 'willTakeAction.' + action, { options: { sender: 'spec' } } );
               testEventBus.flush();
            } );
            signalActionFinished = function() {
               widgetScope.eventBus.publish( 'didTakeAction.' + action, { options: { sender: 'spec' } } );
               testEventBus.flush();
            };
            widgetScope.handleButtonClicked( nextButton );
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'an event with the configured action is published (R2.9)', function() {
            expect( actionEventName ).toEqual( 'takeActionRequest.next' );
            expect( actionEvent.action ).toEqual( 'next' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'the according button has the css class is-active as long as the action is ongoing', function() {
            expect( nextButton.classes[ 'ax-active' ] ).toBe( true );

            signalActionFinished();

            expect( nextButton.classes[ 'ax-active' ] ).toBe( false );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and the action is canceled', function() {

            beforeEach( ngMocks.inject( function( $q ) {
               signalActionFinished();
               widgetEventBus.publishAndGatherReplies.and.callFake( $q.reject );
               widgetScope.handleButtonClicked( nextButton );
            } ) );

            it( 'resets the button state', function() {
               expect( nextButton.classes[ 'ax-active' ] ).toBe( true );
               widgetScope.$apply();
               expect( nextButton.classes[ 'ax-active' ] ).toBe( false );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends the button\'s id as event.anchorDomElement (R2.9)', function() {
            expect( actionEvent.anchorDomElement ).toEqual( widgetScope.id( 'next_0' ) );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and the button is pressed again before a didTakeAction event was received', function() {

            it( 'doesn\'t publish a takeActionRequest event twice (R2.9)', function() {
               expect( actionEventName ).toEqual( 'takeActionRequest.next' );

               actionEventName = 'resetEventName';
               widgetScope.handleButtonClicked( nextButton );
               testEventBus.flush();
               expect( actionEventName ).toEqual( 'resetEventName' );

               signalActionFinished();
               widgetScope.handleButtonClicked( nextButton );
               testEventBus.flush();
               expect( actionEventName ).toEqual( 'takeActionRequest.next' );
            } );
         } );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'An AxCommandBarWidget with buttons with same action', function() {

      createSetup( testData.customWithSameAction );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'has individual ids for each button (R2.9)', function() {
         expect( widgetScope.model.areas.left[ 0 ].id ).not.
            toEqual( widgetScope.model.areas.left[ 1 ].id );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'An AxCommandBarWidget', function() {

      describe( 'with no explicit layout configuration', function() {
         var features = {
            buttons: [
               { i18nHtmlLabel: 'Action 1', action: 'action1' },
               { i18nHtmlLabel: 'Action 2', action: 'action2' }
            ]
         };
         createSetup( features );

         it( 'displays the buttons horizontally (R4.1)', function() {
            expect( widgetScope.model.layout ).toEqual( 'ax-local-horizontal' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with configured layout variant HORIZONTAL', function() {
         var features = {
            buttons: [
               { i18nHtmlLabel: 'Action 1', action: 'action1' },
               { i18nHtmlLabel: 'Action 2', action: 'action2' }
            ],
            layout: { variant: 'HORIZONTAL' }
         };
         createSetup( features );

         it( 'displays the buttons horizontally (R4.1)', function() {
            expect( widgetScope.model.layout ).toEqual( 'ax-local-horizontal' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with configured layout variant VERTICAL', function() {
         var features = {
            buttons: [
               { i18nHtmlLabel: 'Action 1', action: 'action1' },
               { i18nHtmlLabel: 'Action 2', action: 'action2' }
            ],
            layout: { variant: 'VERTICAL' }
         };
         createSetup( features );

         it( 'displays the buttons vertically (R4.1)', function() {
            expect( widgetScope.model.layout ).toEqual( 'ax-local-vertical' );
         } );

      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function changeLocale( languageTag, locale ) {
      locale = locale || 'default';
      testEventBus.publish( 'didChangeLocale.' + locale, {
         locale: locale,
         languageTag: languageTag
      } );
      testEventBus.flush();
   }

} );
