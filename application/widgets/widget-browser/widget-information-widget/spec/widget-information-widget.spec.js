/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * https://laxarjs.org/license
 */

import * as axMocks from 'laxar-mocks';
import { widgetInformationWithoutVersion } from
   './data/widget_information_old_flavor_without_version.widget.json';
import { widgetInformationWithVersion } from './data/widget_information_old_flavor.widget.json';
import { widgetPackageConfiguration } from './data/widget_package_manifest.package.json';
import { widgetInformationSchema04 } from './data/widget_information_schema4.widget.json';

describe( 'A widget-information-widget', () => {
   let widgetEventBus;
   let widgetScope;
   let testEventBus;
   const resourceId_ = 'theWidget';
   const packageResourceId_ = 'thepackage';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createSetup( widgetConfiguration ) {

      beforeEach( axMocks.setupForWidget() );

      beforeEach( () => {
         axMocks.widget.configure( widgetConfiguration );
      } );

      beforeEach( axMocks.widget.load );

      beforeEach( () => {
         widgetScope = axMocks.widget.$scope;
         widgetEventBus = axMocks.widget.axEventBus;
         testEventBus = axMocks.eventBus;
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   afterEach( axMocks.tearDown );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with a configured widget resource', () => {

      const widgetConfiguration = { widget: { resource: resourceId_ } };

      createSetup( widgetConfiguration );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      beforeEach( () => {
         axMocks.triggerStartupEvents();
         testEventBus.flush();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'loads widget information from the configured resource (R1.1)', () => {
         expect( widgetEventBus.subscribe )
            .toHaveBeenCalledWith( `didReplace.${resourceId_}`, jasmine.any( Function ) );
         expect( widgetEventBus.subscribe )
            .toHaveBeenCalledWith( `didUpdate.${resourceId_}`, jasmine.any( Function ) );

         testEventBus.publish( 'beginLifecycleRequest' );
         testEventBus.flush();

         expect( widgetScope.resources.widget ).toBeNull();
         replace( resourceId_, widgetInformationWithVersion );
         expect( widgetScope.resources.widget ).not.toBeNull();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'interprets the resource as a widget.json descriptor (R1.2)', () => {
         replace( resourceId_, widgetInformationWithoutVersion );
         expect( widgetScope.resources.widget.name ).toEqual( widgetInformationWithoutVersion.name );

         const features = widgetScope.resources.widget.features;
         update( resourceId_, [ { op: 'replace', path: '/name', value: 'SomeOtherWidget' } ] );
         expect( widgetScope.resources.widget.name ).toEqual( 'SomeOtherWidget' );
         expect( widgetScope.resources.widget.features ).toEqual( features );

         replace( resourceId_, widgetInformationWithVersion );
         expect( widgetScope.resources.widget.name ).toEqual( widgetInformationWithVersion.name );
         expect( widgetScope.resources.widget.features ).not.toEqual( features );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'displays name, description and version (R1.3)', () => {
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

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'displays the integration technology and type (R1.4)', () => {
         replace( resourceId_, widgetInformationWithVersion );
         expect( widgetScope.resources.widget.integration )
            .toEqual( widgetInformationWithVersion.integration );

         replace( resourceId_, widgetInformationWithoutVersion );
         expect( widgetScope.resources.widget.integration )
            .toEqual( widgetInformationWithoutVersion.integration );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'displays the list of features (R1.5)', () => {
         replace( resourceId_, widgetInformationWithVersion );
         expect( widgetScope.model.widget.features.properties )
            .toEqual( widgetInformationWithVersion.features );

         update( resourceId_, [ {
            op: 'replace', path: '/features', value: widgetInformationWithoutVersion.features }
         ] );
         expect( widgetScope.model.widget.features.properties )
            .toEqual( widgetInformationWithoutVersion.features );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'displays the list of features of a json schema 04 formatted file (R1.5)', () => {
         replace( resourceId_, widgetInformationSchema04 );
         expect( widgetScope.model.widget.features ).toEqual( widgetInformationSchema04.features );

      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with a configured package resource', () => {

      const widgetConfiguration = {
         widget: {
            resource: resourceId_
         },
         package: {
            resource: packageResourceId_
         }
      };

      createSetup( widgetConfiguration );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      beforeEach( () => {
         axMocks.triggerStartupEvents();
         testEventBus.flush();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'loads package information from the configured resource (R2.1)', () => {

         expect( widgetEventBus.subscribe )
            .toHaveBeenCalledWith( `didReplace.${packageResourceId_}`, jasmine.any( Function ) );
         expect( widgetEventBus.subscribe )
            .toHaveBeenCalledWith( `didUpdate.${packageResourceId_}`, jasmine.any( Function ) );

         testEventBus.publish( 'beginLifecycleRequest' );
         testEventBus.flush();
         expect( widgetScope.resources.package ).toBeNull();

         replace( packageResourceId_, widgetPackageConfiguration );
         expect( widgetScope.resources.package ).not.toBeNull();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'display the version number of the widget from the package.json (R2.2)', () => {
         testEventBus.publish( 'beginLifecycleRequest' );
         testEventBus.flush();
         replace( packageResourceId_, widgetPackageConfiguration );
         replace( resourceId_, widgetInformationWithVersion );

         expect( widgetScope.model.version ).toEqual( widgetPackageConfiguration.version );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'displays the dependencies (R2.3)', () => {
         replace( packageResourceId_, widgetPackageConfiguration );
         expect(
            widgetScope.resources.package.dependencies ).toEqual( widgetPackageConfiguration.dependencies );
      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   afterEach( axMocks.tearDown );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function replace( resourceId, content ) {
      testEventBus.publish( `didReplace.${resourceId}`, { resource: resourceId, data: content } );
      testEventBus.flush();
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function update( resourceId, patches ) {
      testEventBus.publish( `didUpdate.${resourceId}`, {
         resource: resourceId,
         patches
      } );
      testEventBus.flush();
   }
} );

