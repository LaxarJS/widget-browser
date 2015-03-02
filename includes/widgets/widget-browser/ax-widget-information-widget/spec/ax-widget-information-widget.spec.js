/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   '../ax-widget-information-widget',
   'laxar/laxar_testing',
   './data/widget_information_old_flavor_without_version.widget.json',
   './data/widget_information_old_flavor.widget.json',
   './data/widget_bower_manifest.bower.json',
   './data/widget_information_schema4.widget.json'
], function( controller,
             ax,
             widgetInformationWithoutVersion,
             widgetInformationWithVersion,
             widgetBowerConfiguration,
             widgetInformationSchema04 ) {
   'use strict';

   describe( 'A AxWidgetInformationWidget', function() {

      var testBed;

      var resourceId_ = 'theWidget';
      var bowerResourceId_ = 'theBower';

      describe( 'with a configured widget resource', function() {

         it( 'loads widget information from the configured resource (R1.1)', function() {
            setup( { widget: { resource: resourceId_ } } );

            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didReplace.' + resourceId_, jasmine.any( Function ) );
            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didUpdate.' + resourceId_, jasmine.any( Function ) );

            testBed.eventBusMock.publish( 'beginLifecycleRequest' );
            jasmine.Clock.tick( 0 );

            expect( testBed.scope.resources.widget ).toBeNull();
            replace( resourceId_, widgetInformationWithVersion );
            expect( testBed.scope.resources.widget ).not.toBeNull();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'interprets the resource as a widget.json descriptor (R1.2)', function() {
            setup( { widget: { resource: resourceId_ } } );

            replace( resourceId_, widgetInformationWithoutVersion );
            expect( testBed.scope.resources.widget.name ).toEqual( widgetInformationWithoutVersion.name );

            var features = testBed.scope.resources.widget.features;
            update( resourceId_, [ { op: 'replace', path: '/name', value: 'SomeOtherWidget' } ] );
            expect( testBed.scope.resources.widget.name ).toEqual( 'SomeOtherWidget' );
            expect( testBed.scope.resources.widget.features ).toEqual( features );

            replace( resourceId_, widgetInformationWithVersion );
            expect( testBed.scope.resources.widget.name ).toEqual( widgetInformationWithVersion.name );
            expect( testBed.scope.resources.widget.features ).not.toEqual( features );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'displays name, description and version (R1.3)', function() {
            setup( { widget: { resource: resourceId_ } } );

            replace( resourceId_, widgetInformationWithVersion );
            expect( testBed.scope.resources.widget.name ).toEqual( widgetInformationWithVersion.name );
            expect( testBed.scope.model.version ).toEqual( widgetInformationWithVersion.version.spec );
            expect( testBed.scope.resources.widget.description )
               .toEqual( widgetInformationWithVersion.description );

            replace( resourceId_, widgetInformationWithoutVersion );
            expect( testBed.scope.resources.widget.name ).toEqual( widgetInformationWithoutVersion.name );
            expect( testBed.scope.model.version ).toEqual( 'Unspecified' );
            expect( testBed.scope.resources.widget.description )
               .toEqual( widgetInformationWithoutVersion.description );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'displays the integration technology and type (R1.4)', function() {
            setup( { widget: { resource: resourceId_ } } );

            replace( resourceId_, widgetInformationWithVersion );
            expect( testBed.scope.resources.widget.integration )
               .toEqual( widgetInformationWithVersion.integration );

            replace( resourceId_, widgetInformationWithoutVersion );
            expect( testBed.scope.resources.widget.integration )
               .toEqual( widgetInformationWithoutVersion.integration );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'displays the list of features (R1.5)', function() {
            setup( { widget: { resource: resourceId_ } } );

            replace( resourceId_, widgetInformationWithVersion );
            expect( testBed.scope.model.widget.features.properties )
               .toEqual( widgetInformationWithVersion.features );

            update( resourceId_, [ {
               op: 'replace', path: '/features', value: widgetInformationWithoutVersion.features }
            ] );
            expect( testBed.scope.model.widget.features.properties ).
               toEqual( widgetInformationWithoutVersion.features );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'displays the list of features of a json schema 04 formatted file (R1.5)', function() {
            setup( { widget: { resource: resourceId_ } } );

            replace( resourceId_, widgetInformationSchema04 );
            expect( testBed.scope.model.widget.features ).toEqual( widgetInformationSchema04.features );

         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured bower resource', function() {

         beforeEach( function() {
            setup(
               {
                  widget: {
                     resource: resourceId_
                  },
                  bower: {
                     resource: bowerResourceId_
                  }
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'loads bower information from the configured resource (R2.1)', function() {
            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didReplace.' + bowerResourceId_, jasmine.any( Function ) );
            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didUpdate.' + bowerResourceId_, jasmine.any( Function ) );

            testBed.eventBusMock.publish( 'beginLifecycleRequest' );
            jasmine.Clock.tick( 0 );
            expect( testBed.scope.resources.bower ).toBeNull();

            replace( bowerResourceId_, widgetBowerConfiguration );
            expect( testBed.scope.resources.bower ).not.toBeNull();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'display the version number of the widget from the bower.json (R2.2)', function() {
            testBed.eventBusMock.publish( 'beginLifecycleRequest' );
            jasmine.Clock.tick( 0 );
            replace( bowerResourceId_, widgetBowerConfiguration );
            replace( resourceId_, widgetInformationWithVersion );

            expect( testBed.scope.model.version ).toEqual( widgetBowerConfiguration.version );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'displays the dependencies (R2.3)', function() {
            replace( bowerResourceId_, widgetBowerConfiguration );
            expect( testBed.scope.resources.bower.dependencies ).toEqual( widgetBowerConfiguration.dependencies );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         testBed.tearDown();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function replace( resourceId, content ) {
         testBed.eventBusMock.publish( 'didReplace.' + resourceId, { resource: resourceId, data: content } );
         jasmine.Clock.tick( 0 );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function update( resourceId, patches ) {
         testBed.eventBusMock.publish( 'didUpdate.' + resourceId, {
            resource: resourceId,
            patches: patches
         } );
         jasmine.Clock.tick( 0 );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function setup( features ) {
         testBed = ax.testing.portalMocksAngular
            .createControllerTestBed( 'widget-browser/ax-widget-information-widget' );
         testBed.useWidgetJson();
         testBed.featuresMock = features;
         testBed.setup();
         jasmine.Clock.tick( 0 );
      }

   } );
} );
