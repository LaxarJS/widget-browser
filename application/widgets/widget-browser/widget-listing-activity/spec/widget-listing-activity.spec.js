/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * https://laxarjs.org/license
 */

import * as axMocks from 'laxar-mocks';
import * as ax from 'laxar';
import angular from 'angular';
import 'angular-mocks';
import { widgetListing } from './data/widget_listing';
import { exampleWidgetListResourceOriginal } from './data/widget_listing_resource';

describe( 'A widget-listing-activity', () => {
   let widgetEventBus;
   let testEventBus;
   let $httpBackend;
   let exampleWidgetListResource;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createSetup( widgetConfiguration, httpRequests ) {

      beforeEach( () => {
         exampleWidgetListResource = ax.object.deepClone( exampleWidgetListResourceOriginal );
      } );

      beforeEach( axMocks.setupForWidget() );

      beforeEach( () => {
         axMocks.widget.configure( widgetConfiguration );

         axMocks.widget.whenServicesAvailable( () => {
            angular.mock.inject( $injector => {
               $httpBackend = $injector.get( '$httpBackend' );
            } );
            httpRequests.forEach( request => {
               $httpBackend.when( request.operation, request.url )
                  .respond( request.code, request.response );
            } );
         } );

      } );

      beforeEach( axMocks.widget.load );

      beforeEach( () => {
         widgetEventBus = axMocks.widget.axEventBus;
         testEventBus = axMocks.eventBus;
      } );

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   afterEach( axMocks.tearDown );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with a configured feature fileListing', () => {

      describe( 'with a configured list with URLs', () => {

         const widgetConfiguration = {
            fileListing: {
               list: [
                  'var/listing/includes_portal_widgets.json',
                  'var/listing/includes_system_widgets.json'
               ],
               applicationUrl: 'http://localhost:8000/'
            },
            widgetListing: {
               resource: 'widgetListing'
            }
         };

         describe( 'all sources are available', () => {

            const httpRequests = [
               {
                  operation: 'GET',
                  url: 'http://localhost:8000/var/listing/includes_portal_widgets.json',
                  code: 200,
                  response: widgetListing.widgetListNodeModules
               },
               {
                  operation: 'GET',
                  url: 'http://localhost:8000/var/listing/includes_system_widgets.json',
                  code: 200,
                  response: widgetListing.widgetListMyApplicationWidgets
               }
            ];
            createSetup( widgetConfiguration, httpRequests );

            it( 'combines the each file path with the application url and makes for each a GET requests ' +
                '(R1.1, 1.3)', () => {
               axMocks.triggerStartupEvents();
               expect($httpBackend.flush).not.toThrow();
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'one list source file is not available', () => {

            const httpRequests = [
               {
                  operation: 'GET',
                  url: 'http://localhost:8000/var/listing/includes_portal_widgets.json',
                  code: 200,
                  response: widgetListing.widgetListMyApplicationWidgets
               },
               {
                  operation: 'GET',
                  url: 'http://localhost:8000/var/listing/includes_system_widgets.json',
                  code: 404,
                  response: { value: 'Not Found' }
               }
            ];
            createSetup( widgetConfiguration, httpRequests );

            it( 'emits a didValidate event with error message for the resource (R1.2)', () => {
               axMocks.triggerStartupEvents();
               expect($httpBackend.flush).not.toThrow();
               expect( widgetEventBus.publish ).toHaveBeenCalledWith( 'didValidate.widgetListing', {
                  resource: 'widgetListing',
                  outcome: 'ERROR',
                  data: [ {
                     htmlMessage: 'Failed to load file listing from ' +
                                  'http://localhost:8000/var/listing/includes_system_widgets.json',
                     level: 'ERROR'
                  } ]
               } );
               expect( axMocks.widget.axLog.error ).toHaveBeenCalled();
            } );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured list with URLs but no application url configured', () => {

         const widgetConfiguration = {
            fileListing: {
               list: [
                  'var/listing/includes_portal_widgets.json'
               ]
            },
            widgetListing: {
               resource: 'widgetListing'
            }
         };
         const httpRequests = [
            {
               operation: 'GET',
               url: 'var/listing/includes_portal_widgets.json',
               code: 200,
               response: widgetListing.widgetListMyApplicationWidgets
            }
         ];
         createSetup( widgetConfiguration, httpRequests );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'reads the file listing from the application in which it is embedded out (R1.3)', () => {
            axMocks.triggerStartupEvents();
            expect( $httpBackend.flush ).not.toThrow();
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured feature widgetListing', () => {

         describe( 'and with a configured list with several urls', () => {
            const widgetConfiguration = {
               fileListing: {
                  list: [
                     'var/listing/includes_portal_widgets.json',
                     'var/listing/includes_system_widgets.json'
                  ]
               },
               widgetListing: {
                  resource: 'widgetListing'
               }
            };

            const httpRequests = [
               {
                  operation: 'GET',
                  url: 'var/listing/includes_portal_widgets.json',
                  code: 200,
                  response: widgetListing.widgetListNodeModules
               },
               {
                  operation: 'GET',
                  url: 'var/listing/includes_system_widgets.json',
                  code: 200,
                  response: widgetListing.widgetListMyApplicationWidgets
               }
            ];

            createSetup( widgetConfiguration, httpRequests );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'propagates a sorted list via didReplace event (R2.1, R2.2, R2.3)', () => {

               const widgets = buildListing(
                  '',
                  exampleWidgetListResource.nodeModulesAndMyApplicationWidgetList );

               expect( widgetEventBus.publish ).not.toHaveBeenCalledWith( 'didReplace.widgetListing', {
                  resource: 'widgetListing',
                  data: {
                     widgets
                  }
               } );
               axMocks.triggerStartupEvents();
               expect($httpBackend.flush).not.toThrow();
               testEventBus.flush();
               expect( widgetEventBus.publish ).toHaveBeenCalledWith( 'didReplace.widgetListing', {
                  resource: 'widgetListing',
                  data: {
                     widgets
                  }
               } );
            } );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with an absolute application URL', () => {

         const widgetConfiguration = {
            fileListing: {
               list: [
                  'var/listing/includes_portal_widgets.json',
                  'var/listing/includes_system_widgets.json'
               ],
               'applicationUrl': 'http://localhost:8000/widget-browser/'
            },
            widgetListing: {
               resource: 'widgetListing'
            }
         };

         const httpRequests = [
            {
               operation: 'GET',
               url: 'http://localhost:8000/widget-browser/' +
                    'var/listing/includes_portal_widgets.json',
               code: 200,
               response: widgetListing.widgetListNodeModules
            },
            {
               operation: 'GET',
               url: 'http://localhost:8000/widget-browser/' +
                    'var/listing/includes_system_widgets.json',
               code: 200,
               response: widgetListing.widgetListMyApplicationWidgets
            }
         ];

         createSetup( widgetConfiguration, httpRequests );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( ' uses the URL to get the file listing (R1.3)', () => {
            axMocks.triggerStartupEvents();
            expect( $httpBackend.flush ).not.toThrow();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'combines the widget path with the application URL to the widget URL (R1.3)', () => {
            const widgets = buildListing(
               'http://localhost:8000/widget-browser/',
               exampleWidgetListResource.nodeModulesAndMyApplicationWidgetList );
            axMocks.triggerStartupEvents();
            expect( $httpBackend.flush ).not.toThrow();
            expect( widgetEventBus.publish ).toHaveBeenCalledWith( 'didReplace.widgetListing', {
               resource: 'widgetListing',
               data: {
                  widgets
               }
            } );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with an absolute application URL without a trailing slash', () => {

         const widgetConfiguration = {
            fileListing: {
               list: [
                  'var/listing/includes_portal_widgets.json',
                  'var/listing/includes_system_widgets.json'
               ],
               'applicationUrl': 'http://localhost:8000'
            },
            widgetListing: {
               resource: 'widgetListing'
            }
         };

         const httpRequests = [
            {
               operation: 'GET',
               url: 'http://localhost:8000/var/listing/includes_portal_widgets.json',
               code: 200,
               response: widgetListing.widgetListNodeModules
            },
            {
               operation: 'GET',
               url: 'http://localhost:8000/var/listing/includes_system_widgets.json',
               code: 200,
               response: widgetListing.widgetListMyApplicationWidgets
            }
         ];

         createSetup( widgetConfiguration, httpRequests );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'uses the URL to get the file listing', () => {
            axMocks.triggerStartupEvents();
            expect( $httpBackend.flush ).not.toThrow();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'combines the widget path with the application URL to the widget URL', () => {
            const widgets = buildListing( 'http://localhost:8000/',
               exampleWidgetListResource.nodeModulesAndMyApplicationWidgetList );
            axMocks.triggerStartupEvents();
            expect( $httpBackend.flush ).not.toThrow();
            expect( widgetEventBus.publish ).toHaveBeenCalledWith( 'didReplace.widgetListing', {
               resource: 'widgetListing',
               data: {
                  widgets
               }
            } );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a relative application URL', () => {

         const widgetConfiguration = {
            fileListing: {
               list: [
                  'var/listing/includes_portal_widgets.json',
                  'var/listing/includes_system_widgets.json'
               ]
            },
            widgetListing: {
               resource: 'widgetListing'
            }
         };

         const httpRequests = [
            {
               operation: 'GET',
               url: 'var/listing/includes_portal_widgets.json',
               code: 200,
               response: widgetListing.widgetListNodeModules
            },
            {
               operation: 'GET',
               url: 'var/listing/includes_system_widgets.json',
               code: 200,
               response: widgetListing.widgetListMyApplicationWidgets
            }
         ];

         createSetup( widgetConfiguration, httpRequests );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'uses the URL to get the file listing', () => {
            axMocks.triggerStartupEvents();
            expect( $httpBackend.flush ).not.toThrow();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'combines the widget path with the application URL to the widget URL', () => {
            const widgets = buildListing( '',
               exampleWidgetListResource.nodeModulesAndMyApplicationWidgetList );
            axMocks.triggerStartupEvents();
            expect( $httpBackend.flush ).not.toThrow();
            expect( widgetEventBus.publish ).toHaveBeenCalledWith( 'didReplace.widgetListing', {
               resource: 'widgetListing',
               data: {
                  widgets
               }
            } );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function buildListing( prefix, widgetListing ) {
         return widgetListing.widgets.map( widget => {
            widget.specification = prefix + widget.specification;
            widget.url = prefix + widget.url;
            return widget;
         } );
      }
   } );
} );

