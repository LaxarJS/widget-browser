/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'json!../widget.json',
   'laxar-mocks',
   'angular-mocks',
   'laxar'
], function( descriptor, axMocks, ngMocks, ax ) {
   'use strict';

   describe( 'An ax-accordion-widget', function() {
      var widgetEventBus;
      var widgetScope;
      var testEventBus;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function createSetup( widgetConfiguration ) {

         beforeEach( axMocks.createSetupForWidget( descriptor, {
            knownMissingResources: [ 'ax-accordion-widget.css', 'ax-i18n-control.css' ]
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

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         axMocks.tearDown();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with configured areas', function() {
         var configuration = {
            areas: [
               {
                  name:  'firstArea',
                  i18nHtmlLabel: { 'de': 'Erster Bereich', 'en': 'First Area' },
                  flag: 'visible-firstArea',
                  anonymize: true,
                  taggedOn: 'dogtag'
               },
               {
                  name:  'secondArea',
                  i18nHtmlLabel: { 'de': 'Zweiter Bereich', 'en': 'Second Area' },
                  flag: 'visible-secondArea',
                  validOn: 'secondResourceValid',
                  disabledOn: 'secondPanelDisabled'
               },
               {
                  name:  'thirdArea',
                  i18nHtmlLabel: { 'de': 'Dritter Bereich', 'en': 'Third Area' },
                  anonymize: true
               }
            ]
         };
         createSetup( configuration );
         beforeEach( function() {
            axMocks.triggerStartupEvents();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'creates a widget area of all configured widget area names (R1.1)', function() {
            // no real test, but something must be done :)
            expect( widgetScope.model.panels[ 0 ].areaName ).toEqual( 'firstArea' );
            expect( widgetScope.model.panels[ 1 ].areaName ).toEqual( 'secondArea' );
            expect( widgetScope.model.panels[ 2 ].areaName ).toEqual( 'thirdArea' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'renders localized html code (R1.2)', function() {
            testEventBus.flush();
            expect( widgetScope.model.panels[ 0 ].htmlLabel ).toEqual( 'First Area' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends the new flags on panel change if configured (R1.3)', function() {

            widgetScope.model.onBeforeActivate( 1 );
             testEventBus.flush();

            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didChangeFlag.visible-secondArea.true', {
                  flag: 'visible-secondArea',
                  state: true
               } );

            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didChangeFlag.visible-firstArea.false', {
                  flag: 'visible-firstArea',
                  state: false
               } );

            widgetScope.model.onBeforeActivate( 2 );
             testEventBus.flush();

            expect( widgetEventBus.publish ).not
               .toHaveBeenCalledWith( 'didChangeFlag.visible-thirdArea.true', {
                  flag: 'visible-thirdArea',
                  state: true
               } );

            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didChangeFlag.visible-secondArea.false', {
                  flag: 'visible-secondArea',
                  state: false
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends the current valid flag on beginLifecycleRequest (R1.4)', function() {
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didChangeFlag.visible-firstArea.true', {
                  flag: 'visible-firstArea',
                  state: true
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'makes the tab labels optionally anonymizable (R1.5)', function() {
            expect( widgetScope.model.panels[ 0 ].classes[ 'ax-anonymize-me' ] ).toBeTruthy();
            expect( widgetScope.model.panels[ 1 ].classes[ 'ax-anonymize-me' ] ).toBeFalsy();
            expect( widgetScope.model.panels[ 2 ].classes[ 'ax-anonymize-me' ] ).toBeTruthy();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'shows the panel validity based on a configured flag (R1.6)', function() {
            expect( widgetScope.model.panels[ 1 ].classes.error ).toBeFalsy();

            testEventBus.publish( 'didChangeFlag.secondResourceValid.false', {
               flag: 'secondResourceValid',
               state: false
            } );
             testEventBus.flush();

            expect( widgetScope.model.panels[ 1 ].classes.error ).toBeTruthy();

            testEventBus.publish( 'didChangeFlag.secondResourceValid.true', {
               flag: 'secondResourceValid',
               state: true
            } );
             testEventBus.flush();

            expect( widgetScope.model.panels[ 1 ].classes.error ).toBeFalsy();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'shows the panel disabled state based on a configured flag (R1.7)', function() {
            expect( widgetScope.model.panels[ 1 ].classes.disabled ).toBeFalsy();

            testEventBus.publish( 'didChangeFlag.secondPanelDisabled.true', {
               flag: 'secondPanelDisabled',
               state: true
            } );
             testEventBus.flush();

            expect( widgetScope.model.panels[ 1 ].classes.disabled ).toBeTruthy();

            testEventBus.publish( 'didChangeFlag.secondPanelDisabled.false', {
               flag: 'secondPanelDisabled',
               state: false
            } );
             testEventBus.flush();

            expect( widgetScope.model.panels[ 1 ].classes.disabled ).toBeFalsy();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'prevents from selecting a disabled panel (R1.7)', function() {
            widgetScope.model.onBeforeActivate( 1 );
             testEventBus.flush();
            expect( widgetScope.model.selectedPanel ).toEqual( 1 );

            testEventBus.publish( 'didChangeFlag.secondPanelDisabled.true', {
               flag: 'secondPanelDisabled',
               state: true
            } );
             testEventBus.flush();
            widgetScope.model.onBeforeActivate( 1 );
             testEventBus.flush();
            expect( widgetScope.model.selectedPanel ).not.toEqual( 2 );

            testEventBus.publish( 'didChangeFlag.secondPanelDisabled.false', {
               flag: 'secondPanelDisabled',
               state: false
            } );
             testEventBus.flush();
            widgetScope.model.onBeforeActivate( 2 );
             testEventBus.flush();
            expect( widgetScope.model.selectedPanel ).toEqual( 2 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sets a is-tagged class based on a configured flag (R1.8)', function() {
            expect( widgetScope.model.panels[ 0 ].classes[ 'is-tagged' ] ).toBeFalsy();

            testEventBus.publish( 'didChangeFlag.dogtag.true', {
               flag: 'dogtag',
               state: true
            } );
             testEventBus.flush();

            expect( widgetScope.model.panels[ 0 ].classes[ 'is-tagged' ] ).toBeTruthy();

            testEventBus.publish( 'didChangeFlag.dogtag.false', {
               flag: 'dogtag',
               state: false
            } );
             testEventBus.flush();

            expect( widgetScope.model.panels[ 0 ].classes[ 'is-tagged' ] ).toBeFalsy();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'responds to visibility requests for the provided areas (R1.9)', function() {
            // selected area:
            testEventBus.publish(
               'changeAreaVisibilityRequest.testWidget.firstArea.true', {
                  area: 'testWidget.firstArea',
                  visible: true
               } );
            testEventBus.flush();
            expect( widgetEventBus.publish ).toHaveBeenCalledWith(
               'didChangeAreaVisibility.testWidget.firstArea.true', {
                  area: 'testWidget.firstArea',
                  visible: true
               }, jasmine.any( Object ) );

            // un-selected area:
            testEventBus.publish(
               'changeAreaVisibilityRequest.testWidget.secondArea.true', {
                  area: 'testWidget.secondArea',
                  visible: true
               } );
            testEventBus.flush();
            expect( widgetEventBus.publish ).toHaveBeenCalledWith(
               'didChangeAreaVisibility.testWidget.secondArea.false', {
                  area: 'testWidget.secondArea',
                  visible: false
               }, jasmine.any( Object ) );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'issues change-visibility-requests for affected areas on selection change (R1.10)', function() {

            // 1. make the accordion itself visible
            testEventBus.publish(
               'didChangeAreaVisibility.testArea.true', {
                  area: 'testArea',
                  visible: true
               } );
            testEventBus.flush();

            // 2. select a different area
            widgetScope.model.onBeforeActivate( 1 );
            testEventBus.flush();

            expect( widgetEventBus.publishAndGatherReplies )
               .toHaveBeenCalledWith( 'changeAreaVisibilityRequest.testWidget.firstArea.false', {
                  area: 'testWidget.firstArea',
                  visible: false
               }, jasmine.any( Object ) );

            expect( widgetEventBus.publishAndGatherReplies )
               .toHaveBeenCalledWith( 'changeAreaVisibilityRequest.testWidget.secondArea.true', {
                  area: 'testWidget.secondArea',
                  visible: true
               }, jasmine.any( Object ) );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'the selected tab is highlighted (R1.14)', function() {
            widgetScope.model.onBeforeActivate( 0 );
             testEventBus.flush();
            expect( widgetScope.model.panels[ 0 ].classes.active ).toBe( true );
            expect( widgetScope.model.panels[ 1 ].classes.active ).toBe( false );

            widgetScope.model.onBeforeActivate( 1 );
             testEventBus.flush();

            expect( widgetScope.model.panels[ 0 ].classes.active ).toBe( false );
            expect( widgetScope.model.panels[ 1 ].classes.active ).toBe( true );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'suspends selections for a moment (to implement visibility) when no selection request action is defined (R2.2)', function() {
            widgetScope.model.onBeforeActivate( 0 );
             testEventBus.flush();
            expect( widgetScope.model.onBeforeActivate( 1 ) ).toBe( false );
             testEventBus.flush();
            expect( widgetScope.model.onBeforeActivate( 1 ) ).toBe( true );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured selection action', function() {
         var configuration = {
            areas: [
               {
                  name:  'firstArea',
                  i18nHtmlLabel: 'First Area'
               },
               {
                  name:  'secondArea',
                  i18nHtmlLabel: 'Second Area',
                  selection: {
                     action: 'selectionDone'
                  }
               },
               {
                  name:  'thirdArea',
                  i18nHtmlLabel: 'Second Area'
               }
            ]
         };
         createSetup( configuration );
         beforeEach( function() {
            axMocks.triggerStartupEvents();
         } );

         beforeEach( function() {
            // Simulate the initial activation triggered by the accordion directive
            widgetScope.model.onBeforeActivate( 0 );
            testEventBus.flush();
            widgetScope.model.onBeforeActivate( 0 );
            testEventBus.flush();
            widgetScope.model.onBeforeActivate( 1 );
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends the configured action after successful selection (R1.16)', function() {
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'takeActionRequest.selectionDone', {
                  action: 'selectionDone'
               } );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with configured selection request action', function() {
         var configuration =  {
            areas: [
               {
                  name:  'firstArea',
                  i18nHtmlLabel: 'First Area'
               },
               {
                  name:  'secondArea',
                  i18nHtmlLabel: 'Second Area',
                  selectionRequest: {
                     action: 'selectionRequested'
                  }
               },
               {
                  name:  'thirdArea',
                  i18nHtmlLabel: 'Third Area',
                  selectionRequest: {
                     action: 'selectionRequested',
                     confirmationAction: 'selectionConfirmed'
                  }
               }
            ]
         };
         createSetup( configuration );
         beforeEach( function() {
            axMocks.triggerStartupEvents();
         } );

         beforeEach( function() {
            // Simulate the initial activation and subsequent watcher reaction by the accordion directive
            widgetScope.model.onBeforeActivate( 0 );
            testEventBus.flush();
            widgetScope.model.onBeforeActivate( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'suspends selections instead of selecting it (R2.3)', function() {
            expect( widgetScope.model.onBeforeActivate( 1 ) ).toBe( false );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes the action configured for feature selectionRequest (R2.3)', function() {
            widgetScope.model.onBeforeActivate( 1 );
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'takeActionRequest.selectionRequested', {
                  action: 'selectionRequested'
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when a confirmation action is configured', function() {

            it( 'selects the panel when the confirmation action is received (R2.4)', function() {
               widgetScope.model.onBeforeActivate( 2 );
                testEventBus.flush();

               expect( widgetScope.model.selectedPanel ).toEqual( 0 );

               testEventBus.publish( 'takeActionRequest.selectionConfirmed', {
                  action: 'selectionConfirmed'
               } );
                testEventBus.flush();

               expect( widgetScope.model.selectedPanel ).toEqual( 2 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'ignores (but logs) confirmation without preceeding request (R2.5)', function() {
               spyOn( ax.log, 'debug' );

               testEventBus.publish( 'takeActionRequest.selectionConfirmed', {
                  action: 'selectionConfirmed'
               } );
                testEventBus.flush();

               expect( widgetScope.model.selectedPanel ).toEqual( 0 );
               expect( ax.log.debug ).toHaveBeenCalled();
            } );


         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured selectionRequestTrigger action', function() {
         var configuration =  {
            areas: [
               {
                  name:  'firstArea',
                  i18nHtmlLabel: { 'de': 'Erster Bereich', 'en': 'First Area' }
               },
               {
                  name:  'secondArea',
                  i18nHtmlLabel: { 'de': 'Erster Bereich', 'en': 'First Area' },
                  selectionRequestTrigger: {
                     onActions: [
                        'pleasePleaseSelectSecondArea'
                     ]
                  }
               },
               {
                  name:  'thirdArea',
                  i18nHtmlLabel: { 'de': 'Erster Bereich', 'en': 'First Area' },
                  selectionRequest: {
                     action: 'selectionRequested'
                  },
                  selectionRequestTrigger: {
                     onActions: [
                        'pleasePleaseSelectThirdArea'
                     ]
                  }
               }
            ]
         };
         createSetup( configuration );
         beforeEach( function() {
            axMocks.triggerStartupEvents();
         } );

         beforeEach( function() {
            // Simulate the initial activation triggered by the accordion directive
            widgetScope.model.onBeforeActivate( 0 );

            testEventBus.publish( 'takeActionRequest.pleasePleaseSelectThirdArea',{
               action: 'pleasePleaseSelectThirdArea'
            } );
             testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'emits a selectionRequest action on receipt of a trigger action (R3.1)', function() {
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'takeActionRequest.selectionRequested', {
                  action: 'selectionRequested'
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'but without selectionRequest action', function() {

            beforeEach( function() {
               testEventBus.publish( 'takeActionRequest.pleasePleaseSelectSecondArea',{
                  action: 'pleasePleaseSelectSecondArea'
               } );
                testEventBus.flush();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'immediately selects the according area (R3.2)', function() {
               expect( widgetScope.model.selectedPanel ).toEqual( 1 );
            } );

         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with configured i18n feature', function() {
         var configuration =  {
            areas: [
               {
                  name:  'firstArea',
                  i18nHtmlLabel: { 'de_DE': 'Erster Bereich', 'en_US': 'First Area' }
               },
               {
                  name:  'secondArea',
                  i18nHtmlLabel: { 'de_DE': 'Zweiter Bereich', 'en_US': 'Second Area' }
               }
            ],
            i18n: {
               locale: 'myLocale'
            }
         };
         createSetup( configuration );
         beforeEach( function() {
            axMocks.triggerStartupEvents();
         } );

         it( 'uses the configured locale (R4.1)', function() {

            testEventBus.publish( 'didChangeLocale.myLocale',
               { locale: 'myLocale', languageTag: 'en_US' }
            );
             testEventBus.flush();
            expect( widgetScope.i18n.locale ).toBe( 'myLocale' );
            expect( widgetScope.i18n.tags.myLocale ).toBe( 'en_US' );

            testEventBus.publish( 'didChangeLocale.myLocale',
               { locale: 'myLocale', languageTag: 'de_DE' }
            );
             testEventBus.flush();
            expect( widgetScope.i18n.locale ).toBe( 'myLocale' );
            expect( widgetScope.i18n.tags.myLocale ).toBe( 'de_DE' );
         } );

      } );

   } );

} );
