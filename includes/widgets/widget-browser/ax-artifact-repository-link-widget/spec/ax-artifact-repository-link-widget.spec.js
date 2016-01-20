/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'json!../widget.json',
   'laxar-mocks',
   './data/widget_bower_manifest'
], function( descriptor, axMocks, widgetBowerManifest ) {
   'use strict';

   describe( 'An ax-artifact-repository-link-widget', function() {
      var widgetEventBus;
      var widgetScope;
      var testEventBus;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function createSetup( widgetConfiguration ) {

         beforeEach( axMocks.createSetupForWidget( descriptor ) );

         beforeEach( function() {
            axMocks.widget.configure( widgetConfiguration );
         } );

         beforeEach( axMocks.widget.load );

         beforeEach( function() {
            widgetScope = axMocks.widget.$scope;
            widgetEventBus = axMocks.widget.axEventBus;
            testEventBus = axMocks.eventBus;
            axMocks.triggerStartupEvents();
            testEventBus.flush();
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         axMocks.tearDown();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured feature display', function() {

         var widgetConfiguration = {
            'display': {
               'resource': 'bowerResourceId'
            }
         };

         createSetup( widgetConfiguration );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'acts as slave for the configured resource (R1.1)', function() {
            expect( widgetEventBus.subscribe )
               .toHaveBeenCalledWith( 'didReplace.bowerResourceId', jasmine.any( Function ) );
            expect( widgetEventBus.subscribe )
               .toHaveBeenCalledWith( 'didUpdate.bowerResourceId', jasmine.any( Function ) );
            expect( widgetScope.resources.display ).toBeNull();

            testEventBus.publish( 'didReplace.bowerResourceId', { resource: 'bowerResourceId', data: widgetBowerManifest } );
            testEventBus.flush();

            expect( widgetScope.resources.display ).not.toBeNull();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'gets the url of the artifact from the configured resource (R1.2)', function() {
            testEventBus.publish( 'didReplace.bowerResourceId', { resource: 'bowerResourceId', data: widgetBowerManifest } );
            testEventBus.flush();

            expect( widgetScope.resources.display.repository.url ).toEqual( widgetBowerManifest.repository.url );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured feature display and configured link text', function() {

         var widgetConfiguration = {
            'display': {
               'resource': 'bowerResourceId',
               'i18nHtmlText': 'Link to the repository'
            }
         };

         createSetup( widgetConfiguration );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'allows to configure the link text (R1.3)', function() {
           expect( widgetScope.features.display.i18nHtmlText ).toEqual( 'Link to the repository' );
         } );
      } );
   } );
} );
