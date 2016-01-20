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

   describe( 'An AxPopupWidget', function() {

      var widgetEventBus;
      var widgetScope;
      var testEventBus;

      var layoutLoader;
      var modalService;
      var replies;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function createSetup( widgetConfiguration ) {

         beforeEach( axMocks.createSetupForWidget( descriptor, {
            knownMissingResources: [ 'ax-layer-control.css' ]
         } ) );

         beforeEach( function() {
            axMocks.widget.configure( widgetConfiguration );
         } );

         beforeEach( axMocks.widget.load );

         beforeEach( function() {
            ngMocks.inject( function( axLayoutLoader, _modalService_ ) {
               layoutLoader = axLayoutLoader;
               modalService = _modalService_;
            } );

            layoutLoader.load = function( layout ) {
               return {
                  html: '',
                  css: '',
                  className: ''
               };
            };
            modalService.setClassOnBody = function(){};
            modalService.unsetClassOnBody = function(){};

            widgetScope = axMocks.widget.$scope;
            widgetEventBus = axMocks.widget.axEventBus;
            testEventBus = axMocks.eventBus;

            axMocks.triggerStartupEvents();
         } );
      }


      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function defaultFeatures() {
         return  {
            open: {
               onActions: [ 'myOpenAction', 'myOtherOpenAction' ]
            },
            close: {
               onActions: [ 'myCloseAction', 'myOtherCloseAction' ]
            },
            content: {
               layout: 'popup_layout'
            },
            visibility: {
               flag: 'visible-popup'
            }
         };
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         axMocks.tearDown();
      } );

      describe( 'with a configured onActions property of open feature', function() {

         createSetup( defaultFeatures() );

         function publishTakeActionRequestWithAction( action ) {
            testEventBus
               .publishAndGatherReplies( 'takeActionRequest.' + action, {
                  action: action,
                  anchorDomElement: 'popup_layer'
               } ).then( function( arg ) {
                  replies = arg;
               } );
            testEventBus.flush();
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sets the class "modal-open" on body (R1.4)', function() {
            spyOn( modalService , 'setClassOnBody' );
            publishTakeActionRequestWithAction( 'myOpenAction' );

            expect( modalService.setClassOnBody ).toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'reads the anchor element from the according takeActionRequest (R3.1)', function() {
            publishTakeActionRequestWithAction( 'myOpenAction' );
            expect( widgetScope.model.anchorElementId ).toEqual( 'popup_layer' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'responds with a didTakeAction event to the first configured open action (R3.1)', function() {
            publishTakeActionRequestWithAction( 'myOpenAction' );

            expect( replies[ 0 ].meta.name ).toEqual( 'didTakeAction.myOpenAction' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'responds with a didTakeAction event to the second configured open action (R3.1)', function() {
            publishTakeActionRequestWithAction( 'myOtherOpenAction' );

            expect( replies[ 0 ].meta.name ).toEqual( 'didTakeAction.myOtherOpenAction' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does nothing for the wrong open action (R3.1)', function() {
            publishTakeActionRequestWithAction( 'myFalseOpenAction' );

            expect( replies.length ).toEqual( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does nothing on successive events', function() {
            publishTakeActionRequestWithAction( 'myOpenAction' );
            publishTakeActionRequestWithAction( 'myOpenAction' );

            expect( replies.length ).toEqual( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends a flag indicating its visibility (R4.1)', function() {
            var mySpy = jasmine.createSpy();
            testEventBus.subscribe( 'didChangeFlag', mySpy );
            publishTakeActionRequestWithAction( 'myOpenAction' );


            expect( mySpy.calls.argsFor( 0 )[ 1 ].name ).toEqual( 'didChangeFlag.visible-popup.true' );
            expect( mySpy.calls.argsFor( 0 )[ 0 ].flag ).toEqual( 'visible-popup' );
            expect( mySpy.calls.argsFor( 0 )[ 0 ].state ).toEqual( true );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'processes change requests for the visibility of the provided areas (R4.3)', function() {
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

         it( 'triggers change requests for the visibility of the provided areas when opened/closed (R4.4)', function() {
            publishTakeActionRequestWithAction( 'myOpenAction' );
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


            publishTakeActionRequestWithAction( 'myCloseAction' );

            expect( widgetEventBus.publishAndGatherReplies ).toHaveBeenCalledWith(
               'changeWidgetVisibilityRequest.testWidget.false', {
                  widget: 'testWidget',
                  visible: false
               }, jasmine.any( Object )
            );

            testEventBus.publish( 'changeAreaVisibilityRequest.testWidget.content.false', {
               area: 'testWidget.content',
               visible: false
            } );
            testEventBus.flush();
            expect( widgetEventBus.publish ).toHaveBeenCalledWith(
               'didChangeAreaVisibility.testWidget.content.false', {
                  area: 'testWidget.content',
                  visible: false
               }, jasmine.any( Object )
            );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured onActions property of close feature', function() {

         function publishTakeActionRequestWithAction( action ) {
            testEventBus
               .publishAndGatherReplies( 'takeActionRequest.' + action, {
                  action: action
               } ).then( function( arg ) {
                  replies = arg;
               } );
            testEventBus.flush();
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         var features = defaultFeatures();
         features.forcedClose = {
            action: 'closedByUser'
         };
         features.closeIcon = {
            enabled: true
         };
         features.backdropClose = {
            enabled: true
         };

         createSetup( features );

         beforeEach( function() {
            testEventBus.publish( 'takeActionRequest.myOpenAction', {
               action: 'myOpenAction',
               anchorDomElement: 'anchorElementThingy'
            } );
            testEventBus.flush();
            spyOn( widgetScope.model.layerConfiguration, 'whenClosed' ).and.callThrough();
            spyOn( widgetScope, '$broadcast' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'removes the class "modal-open" on body (R1.4)', function() {
            spyOn( modalService, 'unsetClassOnBody' );
            publishTakeActionRequestWithAction( 'myCloseAction' );

            expect( modalService.unsetClassOnBody ).toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends a flag indicating its visibility (R4.1)', function() {
            var mySpy = jasmine.createSpy();
            testEventBus.subscribe( 'didChangeFlag', mySpy );
            publishTakeActionRequestWithAction( 'myCloseAction' );

            expect( mySpy.calls.argsFor( 0 )[ 1 ].name ).toEqual( 'didChangeFlag.visible-popup.false' );
            expect( mySpy.calls.argsFor( 0 )[ 0 ].flag ).toEqual( 'visible-popup' );
            expect( mySpy.calls.argsFor( 0 )[ 0 ].state ).toEqual( false );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'responds with a didTakeAction event to the first configured close action (R5.1)', function() {
            publishTakeActionRequestWithAction( 'myCloseAction' );

            expect( replies[0].meta.name ).toEqual( 'didTakeAction.myCloseAction' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'responds with a didTakeAction event to the second configured close action (R5.1)', function() {
            publishTakeActionRequestWithAction( 'myOtherCloseAction' );

            expect( replies[0].meta.name ).toEqual( 'didTakeAction.myOtherCloseAction' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does nothing for the wrong close action action (R5.1)', function() {
            publishTakeActionRequestWithAction( 'myFalseCloseAction' );

            expect( replies.length ).toEqual( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'on close icon click triggers a forced close (R6.3)', function() {
            widgetScope.model.handleCloseIconClicked();

            expect( widgetScope.$broadcast ).toHaveBeenCalledWith( 'closeLayerForced' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends a configured action in the takeActionRequest event when closed by force (R7.1)', function() {
            var mySpy = jasmine.createSpy();
            testEventBus.subscribe( 'takeActionRequest', mySpy );

            widgetScope.model.layerConfiguration.whenClosed( true );
            testEventBus.flush();

            expect( mySpy.calls.argsFor( 0 )[ 1 ].name ).toEqual( 'takeActionRequest.closedByUser' );
            expect( mySpy.calls.argsFor( 0 )[ 0 ].action ).toEqual( 'closedByUser' );
            expect( mySpy.calls.argsFor( 0 )[ 0 ].anchorDomElement ).toEqual( 'anchorElementThingy' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'backdrop click triggers a forced close (R12.1)', function() {
            widgetScope.model.handleBackdropClicked();

            expect( widgetScope.$broadcast ).toHaveBeenCalledWith( 'closeLayerForced' );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature preventBodyScrolling enabled', function() {

         var features = defaultFeatures();
         features.preventBodyScrolling = {
            enabled: true
         };

         createSetup(features);

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'simply forwards a truthy enabled value to the layer (R11.1)', function() {
            testEventBus.publish( 'takeActionRequest.myOpenAction', {
               action: 'myOpenAction',
               anchorDomElement: 'anchorElementThingy'
            } );
            testEventBus.flush();

            expect( widgetScope.model.layerConfiguration.preventBodyScrolling ).toBe( true );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with feature preventBodyScrolling not enabled', function() {

         var features = defaultFeatures();
         features.preventBodyScrolling = {
            enabled: false
         };

         createSetup(features);

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'simply forwards a falsy enabled value to the layer (R11.1)', function() {
            testEventBus.publish( 'takeActionRequest.myOpenAction', {
               action: 'myOpenAction',
               anchorDomElement: 'anchorElementThingy'
            } );
            testEventBus.flush();

            expect( widgetScope.model.layerConfiguration.preventBodyScrolling ).toBe( false );
         } );

      } );

   } );

} );
