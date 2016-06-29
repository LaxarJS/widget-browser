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
   './fixtures'
], function( descriptor, axMocks,  ax, ngMocks, fixtures ) {
   'use strict';

   var widgetEventBus;
   var widgetScope;
   var testEventBus;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createSetup( widgetConfiguration ) {

      beforeEach( axMocks.createSetupForWidget( descriptor, {
         knownMissingResources: [ 'ax-button-list-control.css', 'ax-i18n-control.css' ]
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

   afterEach( function() {
      axMocks.tearDown();
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'An ax-headline-widget', function() {

      //////////////////////////////////////////////////////////////////////////////////////////////////

      function changeFlag( flag, state ) {
         testEventBus.publish( 'didChangeFlag.' + flag + '.' + state, { flag: flag, state: state }, { sender: 'spec' } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured headline text', function() {

         createSetup( {
            headline: {
               i18nHtmlText: {
                  'de-DE': 'Hello World'
               },
               level: 4
            },

            intro: {
               i18nHtmlText: {
                  'de-DE': 'Welcome to the headline!'
               }
            }
         } );

         beforeEach( function() {
            useLocale( 'de-DE' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         // R1.1, R1.2, R1.3: No complex ui tests for simple HTML markup with AngularJS directives.

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      // R3.1:  No complex ui tests for simple CSS and HTML markup.

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with configured buttons', function() {
         createSetup( {
            headline: {
               i18nHtmlText: {
                  'de-DE': 'Überschrift',
                  'it-IT': 'Titolo',
                  'en-GB': 'Headline'
               }
            },
            buttons: [
               { i18nHtmlLabel: { 'de-DE': 'A' }, action: 'actionA', index:  5, align: 'RIGHT' },
               { i18nHtmlLabel: { 'de-DE': 'B' }, action: 'actionB' },
               { i18nHtmlLabel: { 'de-DE': 'C' }, action: 'actionC', index: -2, align: 'RIGHT' },
               { i18nHtmlLabel: { 'de-DE': 'D' }, action: 'actionD', index:  3, align: 'RIGHT' },
               { i18nHtmlLabel: { 'de-DE': 'E' }, action: 'actionD', index:  0, align: 'RIGHT' },
               { i18nHtmlLabel: { 'de-DE': 'F' }, action: 'actionA', index:  5, align: 'LEFT' },
               { i18nHtmlLabel: { 'de-DE': 'G' }, action: 'actionB', align: 'LEFT' },
               { i18nHtmlLabel: { 'de-DE': 'H' }, action: 'actionC', index: -2, align: 'LEFT' },
               { i18nHtmlLabel: { 'de-DE': 'I' }, action: 'actionD', index:  3, align: 'LEFT' },
               { i18nHtmlLabel: { 'de-DE': 'J' }, action: 'actionD', index:  0, align: 'LEFT' }
            ]
         } );

         it( 'puts them into the correct areas (R3.2)', function() {
            useLocale( 'de-DE' );
            expect( widgetScope.model.areas.right[ 0 ].htmlLabel ).toEqual( 'C' );
            expect( widgetScope.model.areas.right[ 1 ].htmlLabel ).toEqual( 'B' );
            expect( widgetScope.model.areas.right[ 2 ].htmlLabel ).toEqual( 'E' );
            expect( widgetScope.model.areas.right[ 3 ].htmlLabel ).toEqual( 'D' );
            expect( widgetScope.model.areas.right[ 4 ].htmlLabel ).toEqual( 'A' );
            expect( widgetScope.model.areas.left[ 0 ].htmlLabel ).toEqual( 'H' );
            expect( widgetScope.model.areas.left[ 1 ].htmlLabel ).toEqual( 'G' );
            expect( widgetScope.model.areas.left[ 2 ].htmlLabel ).toEqual( 'J' );
            expect( widgetScope.model.areas.left[ 3 ].htmlLabel ).toEqual( 'I' );
            expect( widgetScope.model.areas.left[ 4 ].htmlLabel ).toEqual( 'F' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      // R3.3, R3.4: No complex ui tests for simple CSS and HTML markup.

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with configured buttons', function() {

         createSetup( {
            headline: {
               i18nHtmlText: {
                  'de-DE': 'Überschrift',
                  'it-IT': 'Titolo',
                  'en-GB': 'Headline'
               }
            },
            buttons: [
               { i18nHtmlLabel: { 'de-DE': 'A' }, action: 'actionA' },
               { i18nHtmlLabel: { 'de-DE': 'B' }, action: 'actionB', enabled: false },
               { i18nHtmlLabel: { 'de-DE': 'C' }, action: 'actionC', enabled: true },
               { i18nHtmlLabel: { 'de-DE': 'D' }, action: 'actionD', enabled: false }
            ]
         } );

         it( 'excludes buttons that have been configured to be disabled (R3.5)', function() {

            useLocale( 'de-DE' );

            var modelButtons = widgetScope.model.areas.right;

            expect( modelButtons[ 0 ].htmlLabel ).toEqual( 'A' );
            expect( modelButtons[ 1 ].htmlLabel ).toEqual( 'C' );

            expect( modelButtons.length ).toBe( 2 );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      // R3.6: No complex ui tests for simple CSS and HTML markup and no testing of LaxarJS parts.

      // R3.7: No complex ui tests for simple CSS and HTML markup and no testing of LaxarJS parts.

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with configured buttons', function() {

         createSetup( {
            headline: {
               i18nHtmlText: {
                  'de-DE': 'Überschrift',
                  'it-IT': 'Titolo',
                  'en-GB': 'Headline'
               }
            },
            buttons: fixtures.customButtons
         } );

         it( 'sorts the buttons based on their configured index which defaults to 0 (R3.8)', function() {

            useLocale( 'de-DE' );

            var buttonOrder = [ 15, 1, 2, 3, 4, 5, 10, 11, 6, 12, 13, 7, 14, 8, 9 ];
            widgetScope.model.areas.right.forEach( function( button, i ) {
               expect( button.action ).toBe( 'action' + buttonOrder[ i ] );
            } );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with configured buttons', function() {
         createSetup( {
            headline: {
               i18nHtmlText: {
                  'de-DE': 'Überschrift',
                  'it-IT': 'Titolo',
                  'en-GB': 'Headline'
               }
            },
            buttons: [
               { i18nHtmlLabel: { 'de-DE': 'A' }, action: 'actionA' },
               { i18nHtmlLabel: { 'de-DE': 'B' }, action: 'actionB', 'class': 'PRIMARY' },
               { i18nHtmlLabel: { 'de-DE': 'C' }, action: 'actionC', 'class': 'INFO' },
               { i18nHtmlLabel: { 'de-DE': 'D' }, action: 'actionD', 'class': 'SUCCESS' },
               { i18nHtmlLabel: { 'de-DE': 'E' }, action: 'actionE', 'class': 'WARNING' },
               { i18nHtmlLabel: { 'de-DE': 'F' }, action: 'actionF', 'class': 'DANGER' },
               { i18nHtmlLabel: { 'de-DE': 'G' }, action: 'actionG', 'class': 'LINK' },
               { i18nHtmlLabel: { 'de-DE': 'H' }, action: 'actionH', 'class': 'INVERSE' },
               { i18nHtmlLabel: { 'de-DE': 'I' }, action: 'actionI', 'class': 'NORMAL' }
            ]
         } );

         it( 'assigns a CSS class to each button based on the configured class (R3.9)', function() {

            useLocale( 'de-DE' );

            var modelButtons = widgetScope.model.areas.right;

            expect( modelButtons[ 1 ].classes[ 'btn-primary' ] ).toBe( true );
            expect( modelButtons[ 2 ].classes[ 'btn-info' ] ).toBe( true );
            expect( modelButtons[ 3 ].classes[ 'btn-success' ] ).toBe( true );
            expect( modelButtons[ 4 ].classes[ 'btn-warning' ] ).toBe( true );
            expect( modelButtons[ 5 ].classes[ 'btn-danger' ] ).toBe( true );
            expect( modelButtons[ 6 ].classes[ 'btn-link' ] ).toBe( true );
            expect( modelButtons[ 7 ].classes[ 'btn-inverse' ] ).toBe( true );

            expect( modelButtons[ 0 ].classes[ 'btn-primary' ] ).toBeFalsy();
            expect( modelButtons[ 0 ].classes[ 'btn-info' ] ).toBeFalsy();
            expect( modelButtons[ 0 ].classes[ 'btn-success' ] ).toBeFalsy();
            expect( modelButtons[ 0 ].classes[ 'btn-warning' ] ).toBeFalsy();
            expect( modelButtons[ 0 ].classes[ 'btn-danger' ] ).toBeFalsy();
            expect( modelButtons[ 0 ].classes[ 'btn-link' ] ).toBeFalsy();
            expect( modelButtons[ 0 ].classes[ 'btn-inverse' ] ).toBeFalsy();

            expect( modelButtons[ 8 ].classes[ 'btn-success' ] ).toBeFalsy();
            expect( modelButtons[ 5 ].classes[ 'btn-success' ] ).toBeFalsy();
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with configured buttons', function() {
         createSetup( {
            headline: {
               i18nHtmlText: {
                  'de-DE': 'Überschrift',
                  'it-IT': 'Titolo',
                  'en-GB': 'Headline'
               }
            },
            buttons: [
               { i18nHtmlLabel: { 'de-DE': 'A' }, action: 'actionA' },
               { i18nHtmlLabel: { 'de-DE': 'B' }, action: 'actionB', size: 'DEFAULT' },
               { i18nHtmlLabel: { 'de-DE': 'C' }, action: 'actionC', size: 'MINI' },
               { i18nHtmlLabel: { 'de-DE': 'D' }, action: 'actionD', size: 'SMALL' },
               { i18nHtmlLabel: { 'de-DE': 'E' }, action: 'actionE', size: 'LARGE' }
            ]
         } );

         it( 'assigns a CSS class to each button based on the configured size (R3.10)', function() {

            useLocale( 'de-DE' );

            var modelButtons = widgetScope.model.areas.right;

            expect( modelButtons[ 2 ].classes[ 'btn-xs' ] ).toBe( true );
            expect( modelButtons[ 3 ].classes[ 'btn-sm' ] ).toBe( true );
            expect( modelButtons[ 4 ].classes[ 'btn-lg' ] ).toBe( true );

            expect( modelButtons[ 0 ].classes[ 'btn-xs' ] ).toBeFalsy();
            expect( modelButtons[ 0 ].classes[ 'btn-sm' ] ).toBeFalsy();
            expect( modelButtons[ 0 ].classes[ 'btn-lg' ] ).toBeFalsy();

            expect( modelButtons[ 1 ].classes[ 'btn-xs' ] ).toBeFalsy();
            expect( modelButtons[ 1 ].classes[ 'btn-sm' ] ).toBeFalsy();
            expect( modelButtons[ 1 ].classes[ 'btn-lg' ] ).toBeFalsy();
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with configured buttons', function() {

         describe( 'when configured flags change', function() {

            var mySpy;
            var buttons = [];

            function publishFlagChange( flag, state ) {
               testEventBus.publish( 'didChangeFlag.' + flag + '.' + state, {
                  flag: flag,
                  state: state
               } );
               testEventBus.flush();
            }

            //////////////////////////////////////////////////////////////////////////////////////////////////

            createSetup( {
               headline: {
                  i18nHtmlText: {
                     'de-DE': 'Überschrift',
                     'it-IT': 'Titolo',
                     'en-GB': 'Headline'
                  }
               },
               buttons: [
                  {i18nHtmlLabel: {'de-DE': 'A'}, action: 'actionA', disableOn: ['notUndoable']},
                  {
                     i18nHtmlLabel: {'de-DE': 'B'}, action: 'actionB', hideOn: ['guestUser'],
                     busyOn: ['navigation']
                  },
                  {i18nHtmlLabel: {'de-DE': 'C'}, action: 'actionC', omitOn: ['!helpAvailable']}
               ]
            } );

            beforeEach( function() {

               useLocale( 'de-DE' );

               mySpy = jasmine.createSpy( 'takeActionRequestSpy' );
               widgetEventBus.subscribe( 'takeActionRequest', mySpy );

               buttons = widgetScope.model.areas.right;

               publishFlagChange( 'helpAvailable', true );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'on true the according css classes are applied (R3.11, R.12)', function() {
               expect( buttons[1].classes['ax-invisible'] ).toBe( false );
               expect( buttons[1].classes['ax-busy'] ).toBe( false );
               expect( buttons[2].classes['ax-omitted'] ).toBe( false );
               expect( buttons[0].classes['ax-disabled'] ).toBe( false );

               publishFlagChange( 'guestUser', true );
               publishFlagChange( 'navigation', true );
               publishFlagChange( 'helpAvailable', false );
               publishFlagChange( 'notUndoable', true );

               expect( buttons[1].classes['ax-invisible'] ).toBe( true );
               expect( buttons[1].classes['ax-busy'] ).toBe( true );
               expect( buttons[2].classes['ax-omitted'] ).toBe( true );
               expect( buttons[0].classes['ax-disabled'] ).toBe( true );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'when all flags are active', function() {

               beforeEach( function() {
                  publishFlagChange( 'guestUser', true );
                  publishFlagChange( 'navigation', true );
                  publishFlagChange( 'helpAvailable', false );
                  publishFlagChange( 'notUndoable', true );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'on false the according css classes are removed (R3.11, R3.12)', function() {
                  expect( buttons[1].classes['ax-invisible'] ).toBe( true );
                  expect( buttons[1].classes['ax-busy'] ).toBe( true );
                  expect( buttons[2].classes['ax-omitted'] ).toBe( true );
                  expect( buttons[0].classes['ax-disabled'] ).toBe( true );

                  publishFlagChange( 'guestUser', false );
                  publishFlagChange( 'navigation', false );
                  publishFlagChange( 'helpAvailable', true );
                  publishFlagChange( 'notUndoable', false );

                  expect( buttons[1].classes['ax-invisible'] ).toBe( false );
                  expect( buttons[1].classes['ax-busy'] ).toBe( false );
                  expect( buttons[2].classes['ax-omitted'] ).toBe( false );
                  expect( buttons[0].classes['ax-disabled'] ).toBe( false );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'no user interaction is possible', function() {
                  widgetScope.handleButtonClicked( buttons[0] );
                  widgetScope.handleButtonClicked( buttons[1] );
                  widgetScope.handleButtonClicked( buttons[2] );
                  testEventBus.flush();

                  expect( mySpy.calls.count() ).toBe( 0 );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'on false user interaction is possible again (R3.12)', function() {
                  publishFlagChange( 'guestUser', false );
                  publishFlagChange( 'navigation', false );
                  publishFlagChange( 'helpAvailable', true );
                  publishFlagChange( 'notUndoable', false );

                  widgetScope.handleButtonClicked( buttons[0] );
                  widgetScope.handleButtonClicked( buttons[1] );
                  widgetScope.handleButtonClicked( buttons[2] );
                  testEventBus.flush();

                  expect(  mySpy.calls.count() ).toBe( 3 );
               } );
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when a button is pressed', function() {
            var spy;
            var buttons;

            buttons = [
               {i18nHtmlLabel: {'de-DE': 'A'}, action: 'actionY'},
               {i18nHtmlLabel: {'de-DE': 'B'}, action: 'actionY'}
            ];
            spy = jasmine.createSpy( 'takeActionRequestSpy' );

            createSetup( {
               headline: {
                  i18nHtmlText: {
                     'de-DE': 'Überschrift',
                     'it-IT': 'Titolo',
                     'en-GB': 'Headline'
                  }
               },
               buttons: buttons
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            beforeEach( function() {
               useLocale( 'de-DE' );
               testEventBus.subscribe( 'takeActionRequest.actionY', spy );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'publishes a takeActionRequest for the configured action (R3.13)', function() {
               widgetScope.handleButtonClicked( widgetScope.model.areas.right[0] );
               testEventBus.flush();

               expect( spy ).toHaveBeenCalled();
               expect( spy.calls.argsFor( 0 )[ 0 ].action ).toEqual( 'actionY' );
               expect( spy.calls.argsFor( 0 )[ 1 ].name ).toEqual( 'takeActionRequest.actionY' );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'sends the button\'s id as event.anchorDomElement (R3.13)', function() {
               widgetScope.handleButtonClicked( widgetScope.model.areas.right[0] );
               testEventBus.flush();

               expect( spy.calls.argsFor( 0 )[ 0 ].anchorDomElement ).toEqual( widgetScope.id( 'actionY_0' ) );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'has individual ids for each button (R3.13)', function() {
               expect( widgetScope.model.areas.right[ 0 ].id ).not.
                  toEqual( widgetScope.model.areas.right[ 1 ].id );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'the button has the css class "ax-active" while the action is being processed (R3.14)', function() {
               var modelButton = widgetScope.model.areas.right[0];

               testEventBus.subscribe( 'takeActionRequest.actionY', function() {
                  testEventBus.publish( 'willTakeAction.actionY', {action: 'actionY'}, {sender: 'spec'} );
               } );

               widgetScope.handleButtonClicked( modelButton );

               testEventBus.flush();
               expect( modelButton.classes['ax-active'] ).toBe( true );

               testEventBus.publish( 'didTakeAction.actionY', {action: 'actionA'}, {sender: 'spec'} );
               testEventBus.flush();
               expect( modelButton.classes['ax-active'] ).toBe( false );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'and the action is canceled', function() {
               var modelButton;

               beforeEach( ngMocks.inject( function( $q ) {
                  modelButton = widgetScope.model.areas.right[0];
                  widgetEventBus.publishAndGatherReplies.and.callFake( $q.reject );
                  widgetScope.handleButtonClicked( modelButton );
               } ) );

               it( 'resets the button state (R3.14)', function() {
                  expect( modelButton.classes['ax-active'] ).toBe( true );
                  widgetScope.$apply();
                  expect( modelButton.classes['ax-active'] ).toBe( false );
               } );

            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when a configured flag changes', function() {
            var button = {
               i18nHtmlLabel: {'de-DE': 'A'},
               action: 'actionA',
               disableOn: ['notUndoable'],
               hideOn: ['guestUser'],
               busyOn: ['navigation'],
               omitOn: ['!helpAvailable']
            };

            createSetup( {
               headline: {
                  i18nHtmlText: {
                     'de-DE': 'Überschrift',
                     'it-IT': 'Titolo',
                     'en-GB': 'Headline'
                  }
               },
               buttons: [ button ]
            } );

            beforeEach( function() {
               useLocale( 'de-DE' );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'sets the respective css class accordingly (R3.11)', function() {
               changeFlag( 'guestUser', true );
               changeFlag( 'navigation', true );
               changeFlag( 'helpAvailable', true );
               changeFlag( 'notUndoable', true );

               var modelButton = widgetScope.model.areas.right[0];

               expect( modelButton.classes['ax-invisible'] ).toBe( false );
               expect( modelButton.classes['ax-busy'] ).toBe( false );
               expect( modelButton.classes['ax-omitted'] ).toBe( false );
               expect( modelButton.classes['ax-disabled'] ).toBe( false );

               testEventBus.flush();

               expect( modelButton.classes['ax-invisible'] ).toBe( true );
               expect( modelButton.classes['ax-busy'] ).toBe( true );
               expect( modelButton.classes['ax-omitted'] ).toBe( false );
               expect( modelButton.classes['ax-disabled'] ).toBe( true );

               changeFlag( 'guestUser', false );
               changeFlag( 'navigation', false );
               changeFlag( 'helpAvailable', false );
               changeFlag( 'notUndoable', false );

               testEventBus.flush();

               expect( modelButton.classes['ax-invisible'] ).toBe( false );
               expect( modelButton.classes['ax-busy'] ).toBe( false );
               expect( modelButton.classes['ax-omitted'] ).toBe( true );
               expect( modelButton.classes['ax-disabled'] ).toBe( false );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'if the flag is true, no user interaction is possible (R3.11)', function() {
               var spy = jasmine.createSpy( 'takeActionRequestSpy' );
               widgetEventBus.subscribe( 'takeActionRequest', spy );

               changeFlag( 'guestUser', true );
               testEventBus.flush();

               widgetScope.handleButtonClicked( widgetScope.model.areas.right[0] );
               testEventBus.flush();

               expect( spy.calls.count() ).toBe( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'if the flag is false user interactions will be processed again (R3.11)', function() {
               var spy = jasmine.createSpy( 'takeActionRequestSpy' );
               widgetEventBus.subscribe( 'takeActionRequest', spy );

               changeFlag( 'guestUser', false );
               testEventBus.flush();

               widgetScope.handleButtonClicked( widgetScope.model.areas.right[0] );
               testEventBus.flush();

               expect( spy.calls.count() ).toBe( 1 );
            } );

         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with configured buttons', function() {
         var button = {
            i18nHtmlLabel: {
               'de-DE': '<em>Deutsch</em>',
               'it-IT': '<p>Italiano</p>',
               'en-GB': '<div>English</div>',
               'en-US': '<div>American English</div>'
            },
            action: 'actionA'
         };
         createSetup( {
            headline: {
               i18nHtmlText: {
                  'de-DE': 'Überschrift',
                  'it-IT': 'Titolo',
                  'en-GB': 'Headline'
               }
            },
            buttons: [ button ]
         } );

         it( 'selects the HTML label based on the current locale (R4.1)', function() {
            useLocale( 'it' );
            expect( widgetScope.model.areas.right[ 0 ].htmlLabel ).toEqual( button.i18nHtmlLabel.it );

            useLocale( 'en-US' );
            expect( widgetScope.model.areas.right[ 0 ].htmlLabel ).toEqual( button.i18nHtmlLabel[ 'en-US' ] );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function useLocale( languageTag, locale ) {
         locale = locale || 'default';
         testEventBus.publish( 'didChangeLocale.' + locale, {
            locale: locale,
            languageTag: languageTag
         } );
         testEventBus.flush();
      }

   } );
} );
