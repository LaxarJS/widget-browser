/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license
 * www.laxarjs.org
 */
define( [
   'json!../widget.json',
   'laxar',
   'laxar-mocks',
   'angular-mocks'
], function( descriptor, ax, axMocks, ngMocks ) {
   'use strict';

   describe( 'The ax-details-layer-widget', function() {

      beforeEach( axMocks.createSetupForWidget( descriptor, {
         knownMissingResources: []
      } ) );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      beforeEach( function() {
         axMocks.widget.configure( {
            open: { onActions: [ 'open1', 'open2' ] },
            close: { onActions: [ 'close1', 'close2' ] },
            animateFrom: { actionSelectorPath: 'data.selector' },
            navigation: {
               parameterName: 'thePlace',
               parameterValue: 'testContent'
            }
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      var anyFunc = jasmine.any( Function );
      var registerAreaSpy;
      var widgetDom;
      var widgetEventBus;
      var widgetScope;
      beforeEach( axMocks.widget.load );
      beforeEach( function() {
         registerAreaSpy = jasmine.createSpy( 'registerArea' );
         ngMocks.inject( function( axPageService ) {
            spyOn( axPageService, 'controllerForScope' ).and.callFake( function() {
               return { areas: { register: registerAreaSpy } };
            } );
         } );

         if( widgetDom ) {
            document.body.removeChild( widgetDom );
            document.body.removeChild( document.getElementById( 'the-button' ) );
         }
         widgetDom = axMocks.widget.render();
         document.body.appendChild( widgetDom );
         var button = document.createElement( 'button' );
         button.id = 'the-button';
         document.body.appendChild( button );

         widgetEventBus = axMocks.widget.axEventBus;
         widgetScope = axMocks.widget.$scope;
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( axMocks.tearDown );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to the configured open actions', function() {
         expect( widgetEventBus.subscribe ).toHaveBeenCalledWith( 'takeActionRequest.open1', anyFunc );
         expect( widgetEventBus.subscribe ).toHaveBeenCalledWith( 'takeActionRequest.open2', anyFunc );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to for the configured close actions', function() {
         expect( widgetEventBus.subscribe ).toHaveBeenCalledWith( 'takeActionRequest.close1', anyFunc );
         expect( widgetEventBus.subscribe ).toHaveBeenCalledWith( 'takeActionRequest.close2', anyFunc );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'is initially closed', function() {
         expect( widgetScope.model.isOpen ).toBe( false );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the open action is received', function() {

         try {
            /*jshint -W031:false */
            new window.TransitionEvent( 'change' );
         }
         catch( e ) {
            it( 'the current browser does not support DOM Level 4 events', function() {
               window.console.log( 'The current browser does not support DOM Level 4 events.' );
               window.console.log( 'There won\'t be any hacky workarounds for legacy APIs here.' );
               expect( true ).toBe( true );
            } );
            return;
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         beforeEach( function() {
            axMocks.eventBus.publish( 'takeActionRequest.open1', {
               action: 'open1',
               data: {
                  selector: '#the-button'
               }
            } );
            axMocks.eventBus.flush();
            // fake transition being finished
            widgetDom.querySelector( '.ax-details-layer' )
               .dispatchEvent( new window.TransitionEvent( 'transitionend' ) );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sets the layer to open', function() {
            expect( widgetScope.model.isOpen ).toBe( true );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'reads the source element selector from the event', function() {
            expect( widgetScope.model.sourceElementSelector ).toEqual( '#the-button' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'by default cannot be closed by a close icon', function() {
            expect( widgetDom.querySelector( 'button' ) ).toEqual( null );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'adds a bootstrap css class on the body element', function() {
            expect( [].slice.call( document.body.classList ) ).toContain( 'modal-open' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes a navigateRequest event for the configured place parameter', function() {
            expect( widgetEventBus.publish ).toHaveBeenCalledWith( 'navigateRequest._self', {
               target: '_self',
               data: {
                  thePlace: 'testContent'
               }
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and again a close action is received', function() {

            beforeEach( function() {
               axMocks.eventBus.publish( 'takeActionRequest.close2', { action: 'close2' } );
               axMocks.eventBus.flush();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'sets the layer to closed', function() {
               expect( widgetScope.model.isOpen ).toBe( false );
            } );

            /////////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'removes the bootstrap css class on the body element', function() {
               expect( [].slice.call( document.body.classList ) ).not.toContain( 'modal-open' );
            } );

         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when a didNavigate event is received', function() {

         describe( 'without the configured place parameter', function() {

            beforeEach( function() {
               axMocks.eventBus.publish( 'didNavigate._self', {} );
               axMocks.eventBus.flush();
            } );

            ///////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'does not open the layer', function() {
               expect( widgetScope.model.isOpen ).toBe( false );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'matching the configured place parameter, but not the value', function() {

            beforeEach( function() {
               axMocks.eventBus.publish( 'didNavigate._self', {
                  data: { thePlace: 'otherContent' }
               } );
               axMocks.eventBus.flush();
            } );

            ///////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'does not open the layer', function() {
               expect( widgetScope.model.isOpen ).toBe( false );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'matching the configured place parameter and value', function() {

            beforeEach( function() {
               axMocks.eventBus.publish( 'didNavigate._self', {
                  data: { thePlace: 'testContent' }
               } );
               axMocks.eventBus.flush();
            } );

            ///////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'opens the layer', function() {
               expect( widgetScope.model.isOpen ).toBe( true );
            } );

         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'if configured to be closeable by close icon and then opened', function() {

         beforeEach( function() {
            axMocks.widget.configure( 'closeIcon.enabled', true );
         } );

         beforeEach( axMocks.widget.load );
         beforeEach( function() {
            widgetEventBus = axMocks.widget.axEventBus;
            widgetScope = axMocks.widget.$scope;

            axMocks.eventBus.publish( 'takeActionRequest.open1', { action: 'open1' } );
            axMocks.eventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'it is closed when activating the close icon', function() {
            widgetScope.functions.close();

            expect( widgetScope.model.isOpen ).toBe( false );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with configured log tag feature', function() {

         beforeEach( function() {
            spyOn( ax.log, 'setTag' );
            spyOn( ax.log, 'removeTag' );
            axMocks.widget.configure( 'logTag.name', 'PPUP' );
            axMocks.widget.configure( 'logTag.value', 'registration' );
         } );

         beforeEach( axMocks.widget.load );
         beforeEach( function() {
            widgetEventBus = axMocks.widget.axEventBus;
            widgetScope = axMocks.widget.$scope;

            axMocks.eventBus.publish( 'takeActionRequest.open1', { action: 'open1' } );
            axMocks.eventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sets the log tag when openend', function() {
            expect( ax.log.setTag ).toHaveBeenCalledWith( 'PPUP', 'registration' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when closed again', function() {

            beforeEach( function() {
               axMocks.eventBus.publish( 'takeActionRequest.close2', { action: 'close2' } );
               axMocks.eventBus.flush();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'removes the log tag', function() {
               expect( ax.log.removeTag ).toHaveBeenCalledWith( 'PPUP' );
            } );

         } );

      } );

   } );

} );
