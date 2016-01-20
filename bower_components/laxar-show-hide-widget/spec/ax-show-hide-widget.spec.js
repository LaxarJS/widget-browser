/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'json!../widget.json',
   'laxar-mocks'

], function( descriptor, axMocks ) {
   'use strict';

   var widgetEventBus;
   var widgetScope;
   var testEventBus;

   function createSetup( widgetConfiguration ) {

      beforeEach( axMocks.createSetupForWidget( descriptor, {
         knownMissingResources: [ 'ax-button-list-control.css', 'ax-show-hide-widget.css' ]
      } ) );

      beforeEach( function() {
         axMocks.widget.configure( widgetConfiguration );
      } );

      beforeEach( axMocks.widget.load );

      beforeEach( function() {
         widgetScope = axMocks.widget.$scope;
         widgetEventBus = axMocks.widget.axEventBus;
         testEventBus = axMocks.eventBus;
         axMocks.triggerStartupEvents();
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'An ax-show-hide-widget', function() {

      describe( 'with a configured feature area and a name for it', function() {

         createSetup( {
            area: {
               name: 'toggleMe'
            }
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'exports a widget area whose visibility is toggled (R1.1)', function() {
            expect( widgetScope.model.contentArea ).toEqual( 'toggleMe' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured feature area without name', function() {

         createSetup( {
            area: { }
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'names the widget area "content" (R1.2)', function() {
            expect( widgetScope.model.contentArea ).toEqual( 'content' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured feature show', function() {

         createSetup( {
            show: {
               onActions: [ 'showAreaRequest' ]
            }
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'shows the area for a configured action (R2.1)', function() {
            expect( widgetScope.model.areaShowing ).toBe( false );
            testEventBus.publish( 'takeActionRequest.showAreaRequest', {
               action: 'showAreaRequest'
            } );
            testEventBus.flush();
            expect( widgetScope.model.areaShowing ).toBe( true );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends willTakeAction and didTakeAction events when the action takes place (R2.1)', function() {
            testEventBus.publish( 'takeActionRequest.showAreaRequest', {
               action: 'showAreaRequest'
            } );
            testEventBus.flush();
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'willTakeAction.showAreaRequest', { action: 'showAreaRequest' } );
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didTakeAction.showAreaRequest', { action: 'showAreaRequest' } );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured feature hide', function() {

         createSetup( {
            hide: {
               onActions: [ 'hideAreaRequest' ]
            }
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         beforeEach( function() {
            widgetScope.model.areaShowing = true;
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'hides the area for a configured action (R3.1)', function() {
            expect( widgetScope.model.areaShowing ).toBe( true );
            testEventBus.publish( 'takeActionRequest.hideAreaRequest', {
               action: 'hideAreaRequest'
            } );
            testEventBus.flush();
            expect( widgetScope.model.areaShowing ).toBe( false );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends willTakeAction and didTakeAction events when the action takes place (R3.1)', function() {
            testEventBus.publish( 'takeActionRequest.hideAreaRequest', {
               action: 'hideAreaRequest'
            } );
            testEventBus.flush();
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'willTakeAction.hideAreaRequest', { action: 'hideAreaRequest' } );
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didTakeAction.hideAreaRequest', { action: 'hideAreaRequest' } );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured feature visibility', function() {

         createSetup( {
            show: {
               onActions: [ 'showAreaRequest' ]
            },
            hide: {
               onActions: [ 'hideAreaRequest' ]
            },
            visibility: {
               flag: 'visibleArea',
               toggleOn: 'mustShowContent'
            }
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes the visibility (showing) of the content via flag (R4.1)', function() {
            testEventBus.publish( 'takeActionRequest.showAreaRequest', {
               action: 'showAreaRequest'
            } );
            testEventBus.flush();
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didChangeFlag.visibleArea.true', {
                  flag: 'visibleArea',
                  state: true
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes the visibility (hiding) of the content via flag (R4.1)', function() {
            widgetScope.model.areaShowing = true;
            testEventBus.publish( 'takeActionRequest.hideAreaRequest', {
               action: 'hideAreaRequest'
            } );
            testEventBus.flush();
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didChangeFlag.visibleArea.false', {
                  flag: 'visibleArea',
                  state: false
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'initially publishes the flag state on didNavigate (R4.2)', function() {
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didChangeFlag.visibleArea.false', {
                  flag: 'visibleArea',
                  state: false
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'can be shown via flag (R4.3)', function() {
            expect( widgetScope.model.areaShowing ).toBe( false );
            testEventBus.publish( 'didChangeFlag.mustShowContent.true', {
               flag: 'mustShowContent',
               state: true
            } );
            testEventBus.flush();
            expect( widgetScope.model.areaShowing ).toBe( true );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'can be hidden via flag (R4.3)', function() {
            widgetScope.model.areaShowing = true;
            testEventBus.publish( 'didChangeFlag.mustShowContent.false', {
               flag: 'mustShowContent',
               state: false
            } );
            testEventBus.flush();
            expect( widgetScope.model.areaShowing ).toBe( false );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'processes change requests for the visibility of the provided areas (R4.4)', function() {
            expect( widgetEventBus.subscribe ).toHaveBeenCalledWith(
               'changeAreaVisibilityRequest.testWidget', jasmine.any( Function )
            );

            testEventBus.publish( 'changeAreaVisibilityRequest.testWidget.content.true', {
               area: 'testWidget.content',
               visible: true
            } );
            testEventBus.flush();
            expect( widgetEventBus.publish ).toHaveBeenCalledWith(
               'didChangeAreaVisibility.testWidget.content.false', {
                  area: 'testWidget.content',
                  visible: false
               }, jasmine.any( Object )
            );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when shown', function() {

            beforeEach( function() {
               testEventBus.publish( 'didChangeAreaVisibility.testArea.true', {
                  area: 'testArea',
                  visible: true
               } );
               testEventBus.publish( 'takeActionRequest.showAreaRequest', {
                  action: 'showAreaRequest'
               } );
               testEventBus.flush();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'triggers change requests for the visibility of the provided areas (R4.5)', function() {
               expect( widgetEventBus.publishAndGatherReplies ).toHaveBeenCalledWith(
                  'changeWidgetVisibilityRequest.testWidget.true', {
                     widget: 'testWidget',
                     visible: true
                  }, jasmine.any( Object )
               );

               testEventBus.publish( 'changeAreaVisibilityRequest.testWidget.content.true', {
                  area: 'testWidget.content',
                  visible: true
               } );
               testEventBus.flush();
               expect( widgetEventBus.publish ).toHaveBeenCalledWith(
                  'didChangeAreaVisibility.testWidget.content.true', {
                     area: 'testWidget.content',
                     visible: true
                  }, jasmine.any( Object )
               );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'and hidden again', function() {

               beforeEach( function() {
                  testEventBus.publish( 'didChangeAreaVisibility.testArea.false', {
                     area: 'testArea',
                     visible: false
                  } );
                  testEventBus.publish( 'changeAreaVisibilityRequest.testWidget.content.true', {
                     area: 'testWidget.content',
                     visible: true
                  } );
                  testEventBus.flush();
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'triggers change requests for the visibility of the provided areas (R4.5)', function() {
                  expect( widgetEventBus.publish ).toHaveBeenCalledWith(
                     'didChangeAreaVisibility.testWidget.content.false', {
                        area: 'testWidget.content',
                        visible: false
                     }, jasmine.any( Object )
                  );
               } );
            } );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured feature visibility with a configured inverted flag', function() {

         createSetup( {
            show: {
               onActions: [ 'showAreaRequest' ]
            },
            hide: {
               onActions: [ 'hideAreaRequest' ]
            },
            visibility: {
               flag: 'visibleArea',
               toggleOn: '!mustHideContent'
            }
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'can be toggled via inverted flag (R4.3)', function() {
            testEventBus.publish( 'didChangeFlag.mustHideContent.false', {
               flag: 'mustHideContent',
               state: false
            } );
            testEventBus.flush();
            expect( widgetScope.model.areaShowing ).toBe( true );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with visibility set initially to true', function() {

         createSetup( {
            show: {
               onActions: [ 'showAreaRequest' ]
            },
            hide: {
               onActions: [ 'hideAreaRequest' ]
            },
            visibility: {
               flag: 'visibleArea',
               toggleOn: 'mustShowContent',
               initially: true
            }
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'starts in the visible state (R4.4)', function() {
            testEventBus.flush();
            expect( widgetScope.model.areaShowing ).toBe( true );
         } );
      } );
   } );
} );
