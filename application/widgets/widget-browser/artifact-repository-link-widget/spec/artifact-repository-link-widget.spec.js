/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

import * as axMocks from 'laxar-mocks';
import { widgetBowerManifest } from './data/widget_bower_manifest';


describe( 'A artifact-repository-link-widget', () => {
   let widgetEventBus;
   let widgetScope;
   let testEventBus;

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
         axMocks.triggerStartupEvents();
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   afterEach( axMocks.tearDown );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with a configured feature display', () => {

      const widgetConfiguration = {
         'display': {
            'resource': 'bowerResourceId'
         }
      };

      createSetup( widgetConfiguration );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'acts as slave for the configured resource (R1.1)', () => {
         expect( widgetEventBus.subscribe )
            .toHaveBeenCalledWith( 'didReplace.bowerResourceId', jasmine.any( Function ) );
         expect( widgetEventBus.subscribe )
            .toHaveBeenCalledWith( 'didUpdate.bowerResourceId', jasmine.any( Function ) );
         expect( widgetScope.resources.display ).toBeNull();

         testEventBus.publish(
            'didReplace.bowerResourceId', { resource: 'bowerResourceId', data: widgetBowerManifest } );
         testEventBus.flush();

         expect( widgetScope.resources.display ).not.toBeNull();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'gets the url of the artifact from the configured resource (R1.2)', () => {
         testEventBus.publish( 'didReplace.bowerResourceId',
            { resource: 'bowerResourceId', data: widgetBowerManifest } );
         testEventBus.flush();

         expect( widgetScope.resources.display.repository.url ).toEqual( widgetBowerManifest.repository.url );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with a configured feature display and configured link text', () => {

      const widgetConfiguration = {
         'display': {
            'resource': 'bowerResourceId',
            'i18nHtmlText': 'Link to the repository'
         }
      };

      createSetup( widgetConfiguration );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'allows to configure the link text (R1.3)', () => {
         expect( widgetScope.features.display.i18nHtmlText ).toEqual( 'Link to the repository' );
      } );
   } );
} );
