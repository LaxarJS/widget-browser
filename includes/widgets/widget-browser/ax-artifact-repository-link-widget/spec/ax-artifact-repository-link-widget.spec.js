/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org
 */
define( [
   '../ax-artifact-repository-link-widget',
   'laxar/laxar_testing',
   './data/widget_bower_manifest'
], function( widgetModule, ax, widgetBowerManifest ) {
   'use strict';

   describe( 'An AxArtifactRepositoryLinkWidget', function() {

      var testBed;

      function setup( features ) {
         testBed = ax.testing.portalMocksAngular.createControllerTestBed( 'widget-browser/ax-artifact-repository-link-widget' );
         testBed.featuresMock = features;

         testBed.useWidgetJson();
         testBed.setup();
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         testBed.tearDown();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured feature display', function() {

         beforeEach( function() {
            setup( {
               'display': {
                  'resource': 'bowerResourceId'
               }
            } );
            testBed.eventBusMock.publish( 'beginLifecycleRequest' );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'acts as slave for the configured resource (R1.1)', function() {
            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didReplace.bowerResourceId', jasmine.any( Function ) );
            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didUpdate.bowerResourceId', jasmine.any( Function ) );
            expect( testBed.scope.resources.display ).toBeNull();

            testBed.eventBusMock.publish( 'didReplace.bowerResourceId', { resource: 'bowerResourceId', data: widgetBowerManifest } );
            jasmine.Clock.tick( 0 );

            expect( testBed.scope.resources.display ).not.toBeNull();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'gets the url of the artifact from the configured resource (R1.2)', function() {
            testBed.eventBusMock.publish( 'didReplace.bowerResourceId', { resource: 'bowerResourceId', data: widgetBowerManifest } );
            jasmine.Clock.tick( 0 );

            expect( testBed.scope.resources.display.repository.url ).toEqual( widgetBowerManifest.repository.url );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured feature display and configured link text', function() {

         it( 'allows to configure the link text (R1.3)', function() {
            setup( {
               'display': {
                  'resource': 'bowerResourceId',
                  'i18nHtmlText': 'Browse artifact repository'
               }
            } );
         } );
      } );
   } );
} );
