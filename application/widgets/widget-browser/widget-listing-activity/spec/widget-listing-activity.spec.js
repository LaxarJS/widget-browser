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
   let widgetScope;
   let testEventBus;
   let $httpBackend;
   let exampleWidgetListResource;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createSetup( widgetConfiguration ) {

      beforeEach( axMocks.setupForWidget() );

      beforeEach( () => {
         axMocks.widget.configure( widgetConfiguration );

         axMocks.widget.whenServicesAvailable( () => {
            angular.mock.inject( $injector => {
               $httpBackend = $injector.get( '$httpBackend' );
            } );
         } );
      } );

      beforeEach( axMocks.widget.load );

      beforeEach( () => {
         widgetScope = axMocks.widget.$scope;
         widgetEventBus = axMocks.widget.axEventBus;
         testEventBus = axMocks.eventBus;
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   beforeEach( () => {
      exampleWidgetListResource = ax.object.deepClone( exampleWidgetListResourceOriginal );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   afterEach( () => {
      axMocks.tearDown();
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with a configured feature fileListing', () => {

      describe( 'with a configured resource', () => {

         const widgetConfiguration = {
            fileListing: {
               resource: 'myFileListing'
            },
            widgetListing: {
               resource: 'widgetListing'
            }
         };

         createSetup( widgetConfiguration );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         beforeEach( () => {
            axMocks.triggerStartupEvents();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'acts as slave for the according resource (R1.1)', () => {
            expect( widgetEventBus.subscribe )
               .toHaveBeenCalledWith( 'didReplace.myFileListing', jasmine.any( Function ) );
            expect( widgetEventBus.subscribe )
               .toHaveBeenCalledWith( 'didUpdate.myFileListing', jasmine.any( Function ) );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when a didReplace event with applicationUrl and fileListingPath is sent', () => {

            beforeEach( () => {
               $httpBackend.when( 'GET', 'http://myApp:8000/listings/widgets.json' )
                  .respond( 200, widgetListing.widgetListingMyIncludes );
               testEventBus.publish( 'didReplace.myFileListing', {
                  resource: 'myFileListing',
                  data: {
                     applicationUrl: 'http://myApp:8000/',
                     fileListingPath: 'listings/widgets.json'
                  }
               } );

            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'makes a GET request using the combined information as url and extracts all information ' +
                'from there (R1.2, R1.3)', () => {
               $httpBackend.expectGET( 'http://myApp:8000/listings/widgets.json' );
               testEventBus.flush();
               expect( $httpBackend.flush ).not.toThrow();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'when a didUpdate event changing the url is sent afterwards', () => {

               beforeEach( () => {
                  $httpBackend.when( 'GET', 'http://myOtherApp:8666/listings/widgets.json' )
                     .respond( 200, widgetListing.widgetListingMyIncludes );
                  testEventBus.publish( 'didUpdate.myFileListing', {
                     resource: 'myFileListing',
                     patches: [
                        {
                           op: 'replace',
                           path: '/applicationUrl',
                           value: 'http://myOtherApp:8666/'
                        }
                     ]
                  } );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'makes a GET request using the url (R1.2)', () => {
                  $httpBackend.expectGET( 'http://myOtherApp:8666/listings/widgets.json' );
                  testEventBus.flush();
                  expect( $httpBackend.flush ).not.toThrow();
               } );
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'if an error occurs when reading the file listing', () => {

            beforeEach( () => {
               $httpBackend.when( 'GET', 'http://myApp:8000/listings/error_widgets.json' )
                  .respond( 404, { value: 'Not Found' } );
               testEventBus.publish( 'didReplace.myFileListing', {
                  resource: 'myFileListing',
                  data: {
                     applicationUrl: 'http://myApp:8000/',
                     fileListingPath: 'listings/error_widgets.json'
                  }
               } );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'emits a didValidate event with error message for the resource (R1.4)', () => {
               $httpBackend.expectGET( 'http://myApp:8000/listings/error_widgets.json' );
               spyOn( ax.log, 'error' );
               testEventBus.flush();
               $httpBackend.flush();
               expect( widgetEventBus.publish ).toHaveBeenCalledWith( 'didValidate.widgetListing', {
                  resource: 'widgetListing',
                  outcome: 'ERROR',
                  data: [ {
                     htmlMessage: 'Failed to load file listing from ' +
                                  'http://myApp:8000/listings/error_widgets.json',
                     level: 'ERROR'
                  } ]
               } );
               expect( ax.log.error ).toHaveBeenCalled();
            } );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

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

         createSetup( widgetConfiguration );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'combines the each file path with the application url and makes for each a GET requests ' +
             '(R1.5, R1.6)', () => {
            $httpBackend.when( 'GET', 'http://localhost:8000/var/listing/includes_portal_widgets.json' )
               .respond( 200, widgetListing.bowerComponentsWidgetListing );
            $httpBackend.when( 'GET', 'http://localhost:8000/var/listing/includes_system_widgets.json' )
               .respond( 200, widgetListing.systemWidgetListing );

            $httpBackend.expectGET( 'http://localhost:8000/var/listing/includes_portal_widgets.json' );
            $httpBackend.expectGET( 'http://localhost:8000/var/listing/includes_system_widgets.json' );
            axMocks.triggerStartupEvents();
            testEventBus.flush();
            expect( $httpBackend.flush ).not.toThrow();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'emits a didValidate event with error message for the resource (R1.4)', () => {
            $httpBackend.when( 'GET', 'http://localhost:8000/var/listing/includes_portal_widgets.json' )
               .respond( 200, widgetListing.bowerComponentsWidgetListing );
            $httpBackend.when( 'GET', 'http://localhost:8000/var/listing/includes_system_widgets.json' )
               .respond( 404, { value: 'Not Found' } );
            spyOn( ax.log, 'error' );
            axMocks.triggerStartupEvents();
            expect( $httpBackend.flush ).not.toThrow();
            expect( widgetEventBus.publish ).toHaveBeenCalledWith( 'didValidate.widgetListing', {
               resource: 'widgetListing',
               outcome: 'ERROR',
               data: [ {
                  htmlMessage: 'Failed to load file listing from ' +
                               'http://localhost:8000/var/listing/includes_system_widgets.json',
                  level: 'ERROR'
               } ]
            } );
            expect( ax.log.error ).toHaveBeenCalled();
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
         createSetup( widgetConfiguration );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'reads the file listing from the application in which it is embedded out (R1.6)', () => {
            $httpBackend.when( 'GET', 'var/listing/includes_portal_widgets.json' )
               .respond( 200, widgetListing.bowerComponentsWidgetListing );
            expect( $httpBackend.flush ).not.toThrow();
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured feature widgetListing', () => {

         describe( 'when the extracted information changes', () => {

            const widgetConfiguration = {
               fileListing: {
                  'resource': 'myFileListing'
               },
               widgetListing: {
                  resource: 'widgetListing'
               }
            };
            createSetup( widgetConfiguration );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            beforeEach( () => {
               $httpBackend.when( 'GET', 'http://myApp:8000/listings/widgets.json' )
                  .respond( 200, widgetListing.widgetListingMyIncludes );

               axMocks.triggerStartupEvents();
               testEventBus.publish( 'didReplace.myFileListing', {
                  resource: 'myFileListing',
                  data: {
                     applicationUrl: 'http://myApp:8000/',
                     fileListingPath: 'listings/widgets.json'
                  }
               } );
               testEventBus.flush();
               $httpBackend.flush();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'propagates the new, sorted list via didReplace event (R2.1, R2.2, R2.3)', () => {
               expect( widgetEventBus.publish ).toHaveBeenCalledWith( 'didReplace.widgetListing', {
                  resource: 'widgetListing',
                  data: {
                     widgets: buildListing( 'http://myApp:8000/', exampleWidgetListResource.widgetList )
                  }
               } );

            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

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

            createSetup( widgetConfiguration );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            beforeEach( () => {
               $httpBackend.when( 'GET', 'var/listing/includes_portal_widgets.json' )
                  .respond( 200, widgetListing.bowerComponentsWidgetListing );
               $httpBackend.when( 'GET', 'var/listing/includes_system_widgets.json' )
                  .respond( 200, widgetListing.systemWidgetListing );

               testEventBus.publish( 'didReplace.myFileListing', {
                  resource: 'myFileListing',
                  data: {
                     applicationUrl: 'http://myApp:8000/',
                     fileListingPath: 'listings/widgets.json'
                  }
               } );
               testEventBus.flush();
               $httpBackend.flush();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'propagates a sorted list via didReplace event (R2.1, R2.2, R2.3)', () => {
               const widgets = buildListing(
                  '',
                  exampleWidgetListResource.bowerComponentsAndSystemWidgetList );
               expect( widgetEventBus.publish ).not.toHaveBeenCalledWith( 'didReplace.widgetListing', {
                  resource: 'widgetListing',
                  data: {
                     widgets
                  }
               } );
               axMocks.triggerStartupEvents();
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

         createSetup( widgetConfiguration );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         beforeEach( () => {
            $httpBackend.when(
               'GET', 'http://localhost:8000/widget-browser/' +
                      'var/listing/includes_portal_widgets.json' )
               .respond( 200, widgetListing.bowerComponentsWidgetListing );
            $httpBackend.when( 'GET', 'http://localhost:8000/widget-browser/' +
                                      'var/listing/includes_system_widgets.json' )
               .respond( 200, widgetListing.systemWidgetListing );
            testEventBus.publish( 'didReplace.myFileListing', {
               resource: 'myFileListing',
               data: {
                  applicationUrl: 'http://myApp:8000/',
                  fileListingPath: 'listings/widgets.json'
               }
            } );
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'uses the URL to get the file listing', () => {
            expect( $httpBackend.flush ).not.toThrow();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'combines the widget path with the application URL to the widget URL', () => {
            const widgets = buildListing(
               'http://localhost:8000/widget-browser/',
               exampleWidgetListResource.bowerComponentsAndSystemWidgetList );
            $httpBackend.flush();
            axMocks.triggerStartupEvents();
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

         createSetup( widgetConfiguration );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         beforeEach( () => {
            $httpBackend.when( 'GET', 'http://localhost:8000/var/listing/includes_portal_widgets.json' )
               .respond( 200, widgetListing.bowerComponentsWidgetListing );
            $httpBackend.when( 'GET', 'http://localhost:8000/var/listing/includes_system_widgets.json' )
               .respond( 200, widgetListing.systemWidgetListing );

            testEventBus.publish( 'didReplace.myFileListing', {
               resource: 'myFileListing',
               data: {
                  applicationUrl: 'http://myApp:8000/',
                  fileListingPath: 'listings/widgets.json'
               }
            } );
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'uses the URL to get the file listing', () => {
            expect( $httpBackend.flush ).not.toThrow();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'combines the widget path with the application URL to the widget URL', () => {
            const widgets = buildListing( 'http://localhost:8000/',
               exampleWidgetListResource.bowerComponentsAndSystemWidgetList );
            $httpBackend.flush();
            axMocks.triggerStartupEvents();
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

         createSetup( widgetConfiguration );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         beforeEach( () => {
            $httpBackend.when( 'GET', 'var/listing/includes_portal_widgets.json' )
               .respond( 200, widgetListing.bowerComponentsWidgetListing );
            $httpBackend.when( 'GET', 'var/listing/includes_system_widgets.json' )
               .respond( 200, widgetListing.systemWidgetListing );

            testEventBus.publish( 'didReplace.myFileListing', {
               resource: 'myFileListing',
               data: {
                  applicationUrl: 'http://myApp:8000/',
                  fileListingPath: 'listings/widgets.json'
               }
            } );
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'uses the URL to get the file listing', () => {
            expect( $httpBackend.flush ).not.toThrow();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'combines the widget path with the application URL to the widget URL', () => {
            const widgets = buildListing( '', exampleWidgetListResource.bowerComponentsAndSystemWidgetList );
            $httpBackend.flush();
            axMocks.triggerStartupEvents();
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
            return widget;
         } );
      }
   } );
} );

