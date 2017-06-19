/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'json!../widget.json',
   'laxar-mocks',
   './data/widget_information_old_flavor_without_version.widget.json',
   './data/widget_information_old_flavor.widget.json',
   './data/widget_bower_manifest.bower.json',
   './data/widget_information_schema4.widget.json'
], function( descriptor,
             axMocks,
             widgetInformationWithoutVersion,
             widgetInformationWithVersion,
             widgetBowerConfiguration,
             widgetInformationSchema04 ) {
   'use strict';

   describe( 'An ax-widget-information-widget', function() {
      var widgetEventBus;
      var widgetScope;
      var testEventBus;
      var resourceId_ = 'theWidget';
      var bowerResourceId_ = 'theBower';

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
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         axMocks.tearDown();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured widget resource', function() {

         var widgetConfiguration = { widget: { resource: resourceId_ } };

         createSetup( widgetConfiguration );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         beforeEach( function() {
            axMocks.triggerStartupEvents();
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'loads widget information from the configured resource (R1.1)', function() {
            expect( widgetEventBus.subscribe )
               .toHaveBeenCalledWith( 'didReplace.' + resourceId_, jasmine.any( Function ) );
            expect( widgetEventBus.subscribe )
               .toHaveBeenCalledWith( 'didUpdate.' + resourceId_, jasmine.any( Function ) );

           testEventBus.publish( 'beginLifecycleRequest' );
             testEventBus.flush();

            expect( widgetScope.resources.widget ).toBeNull();
            replace( resourceId_, widgetInformationWithVersion );
            expect( widgetScope.resources.widget ).not.toBeNull();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'interprets the resource as a widget.json descriptor (R1.2)', function() {
            replace( resourceId_, widgetInformationWithoutVersion );
            expect( widgetScope.resources.widget.name ).toEqual( widgetInformationWithoutVersion.name );

            var features = widgetScope.resources.widget.features;
            update( resourceId_, [ { op: 'replace', path: '/name', value: 'SomeOtherWidget' } ] );
            expect( widgetScope.resources.widget.name ).toEqual( 'SomeOtherWidget' );
            expect( widgetScope.resources.widget.features ).toEqual( features );

            replace( resourceId_, widgetInformationWithVersion );
            expect( widgetScope.resources.widget.name ).toEqual( widgetInformationWithVersion.name );
            expect( widgetScope.resources.widget.features ).not.toEqual( features );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'displays name, description and version (R1.3)', function() {
            replace( resourceId_, widgetInformationWithVersion );
            expect( widgetScope.resources.widget.name ).toEqual( widgetInformationWithVersion.name );
            expect( widgetScope.model.version ).toEqual( widgetInformationWithVersion.version.spec );
            expect( widgetScope.resources.widget.description )
               .toEqual( widgetInformationWithVersion.description );

            replace( resourceId_, widgetInformationWithoutVersion );
            expect( widgetScope.resources.widget.name ).toEqual( widgetInformationWithoutVersion.name );
            expect( widgetScope.model.version ).toEqual( 'Unspecified' );
            expect( widgetScope.resources.widget.description )
               .toEqual( widgetInformationWithoutVersion.description );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'displays the integration technology and type (R1.4)', function() {
            replace( resourceId_, widgetInformationWithVersion );
            expect( widgetScope.resources.widget.integration )
               .toEqual( widgetInformationWithVersion.integration );

            replace( resourceId_, widgetInformationWithoutVersion );
            expect( widgetScope.resources.widget.integration )
               .toEqual( widgetInformationWithoutVersion.integration );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'displays the list of features (R1.5)', function() {
            replace( resourceId_, widgetInformationWithVersion );
            expect( widgetScope.model.widget.features.properties )
               .toEqual( widgetInformationWithVersion.features );

            update( resourceId_, [ {
               op: 'replace', path: '/features', value: widgetInformationWithoutVersion.features }
            ] );
            expect( widgetScope.model.widget.features.properties ).
               toEqual( widgetInformationWithoutVersion.features );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'displays the list of features of a json schema 04 formatted file (R1.5)', function() {
            replace( resourceId_, widgetInformationSchema04 );
            expect( widgetScope.model.widget.features ).toEqual( widgetInformationSchema04.features );

         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured bower resource', function() {

         var widgetConfiguration = {
               widget: {
                  resource: resourceId_
               },
               bower: {
                  resource: bowerResourceId_
               }
            };

         createSetup( widgetConfiguration );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         beforeEach( function() {
            axMocks.triggerStartupEvents();
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'loads bower information from the configured resource (R2.1)', function() {

            expect( widgetEventBus.subscribe )
               .toHaveBeenCalledWith( 'didReplace.' + bowerResourceId_, jasmine.any( Function ) );
            expect( widgetEventBus.subscribe )
               .toHaveBeenCalledWith( 'didUpdate.' + bowerResourceId_, jasmine.any( Function ) );

           testEventBus.publish( 'beginLifecycleRequest' );
             testEventBus.flush();
            expect( widgetScope.resources.bower ).toBeNull();

            replace( bowerResourceId_, widgetBowerConfiguration );
            expect( widgetScope.resources.bower ).not.toBeNull();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'display the version number of the widget from the bower.json (R2.2)', function() {
           testEventBus.publish( 'beginLifecycleRequest' );
             testEventBus.flush();
            replace( bowerResourceId_, widgetBowerConfiguration );
            replace( resourceId_, widgetInformationWithVersion );

            expect( widgetScope.model.version ).toEqual( widgetBowerConfiguration.version );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'displays the dependencies (R2.3)', function() {
            replace( bowerResourceId_, widgetBowerConfiguration );
            expect( widgetScope.resources.bower.dependencies ).toEqual( widgetBowerConfiguration.dependencies );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         axMocks.tearDown();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function replace( resourceId, content ) {
        testEventBus.publish( 'didReplace.' + resourceId, { resource: resourceId, data: content } );
          testEventBus.flush();
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function update( resourceId, patches ) {
        testEventBus.publish( 'didUpdate.' + resourceId, {
            resource: resourceId,
            patches: patches
         } );
          testEventBus.flush();
      }
   } );
} );
