/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   '../ax-widget-listing-activity',
   'laxar/laxar_testing',
   './widget_listing',
   './widget_listing_resource'
], function( controller, ax, widgetListing, exampleWidgetListResourceOriginal ) {
   'use strict';

   describe( 'A WidgetListingActivity', function() {

      var testBed;
      var $httpBackend;

      var exampleWidgetListResource;

      beforeEach( function() {
         exampleWidgetListResource = ax.object.deepClone( exampleWidgetListResourceOriginal );
         testBed = ax.testing.portalMocksAngular.createControllerTestBed( 'widget-browser/ax-widget-listing-activity' );
         testBed.useWidgetJson();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured feature fileListing', function() {

         describe( 'with a configured resource', function() {

            beforeEach( function() {
               testBed.featuresMock = {
                  fileListing: {
                     resource: 'myFileListing'
                  },
                  widgetListing: {
                     resource: 'widgetListing'
                  }
               };
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'acts as slave for the according resource (R1.1)', function() {
               testBed.setup();
               expect( testBed.scope.eventBus.subscribe )
                  .toHaveBeenCalledWith( 'didReplace.myFileListing', jasmine.any( Function ) );
               expect( testBed.scope.eventBus.subscribe )
                  .toHaveBeenCalledWith( 'didUpdate.myFileListing', jasmine.any( Function ) );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'when a didReplace event with applicationUrl and fileListingPath is sent', function() {

               beforeEach( function() {
                  testBed.setup( {
                     onBeforeControllerCreation: function( $injector ) {
                        $httpBackend = $injector.get( '$httpBackend' );
                        $httpBackend.when( 'GET', 'http://myApp:8000/listings/widgets.json' )
                           .respond( 200, widgetListing.widgetListingMyIncludes );
                     }
                  } );
                  testBed.eventBusMock.publish( 'didReplace.myFileListing', {
                     resource: 'myFileListing',
                     data: {
                        applicationUrl: 'http://myApp:8000/',
                        fileListingPath: 'listings/widgets.json'
                     }
                  } );
                  jasmine.Clock.tick( 0 );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'makes a GET request using the combined information as url and extracts all information from there (R1.2, R1.3)', function() {
                  $httpBackend.flush();
                  jasmine.Clock.tick( 0 );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               describe( 'when a didUpdate event changing the url is sent afterwards', function() {

                  beforeEach( function() {
                     testBed.setup( {
                        onBeforeControllerCreation: function( $injector ) {
                           $httpBackend = $injector.get( '$httpBackend' );
                           $httpBackend.when( 'GET', 'http://myOtherApp:8666/listings/widgets.json' )
                              .respond( 200, widgetListing.widgetListingMyIncludes );
                        }
                     } );
                     testBed.eventBusMock.publish( 'didUpdate.myFileListing', {
                        resource: 'myFileListing',
                        patches: [
                           {
                              op: 'replace',
                              path: '/applicationUrl',
                              value: 'http://myOtherApp:8666/'
                           }
                        ]
                     } );
                     jasmine.Clock.tick( 0 );
                  } );

                  ////////////////////////////////////////////////////////////////////////////////////////////

                  it( 'makes a GET request using the url (R1.2)', function() {
                     $httpBackend.flush();
                     jasmine.Clock.tick( 0 );
                  } );
               } );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'if an error occurs when reading the file listing', function() {

               beforeEach( function() {
                  testBed.setup( {
                     onBeforeControllerCreation: function( $injector ) {
                        $httpBackend = $injector.get( '$httpBackend' );
                        $httpBackend.when( 'GET', 'http://myApp:8000/listings/error_widgets.json' )
                           .respond( 404, {value: 'Not Found'} );
                     }
                  } );
                  testBed.eventBusMock.publish( 'didReplace.myFileListing', {
                     resource: 'myFileListing',
                     data: {
                        applicationUrl: 'http://myApp:8000/',
                        fileListingPath: 'listings/error_widgets.json'
                     }
                  } );
                  jasmine.Clock.tick( 0 );
               } );

               ////////////////////////////////////////////////////////////////////////////////////////////

               it( 'emits a didValidate event with error message for the resource (R1.4)', function() {
                  ax.log.info( 'Expect error message' );
                  $httpBackend.flush();
                  jasmine.Clock.tick( 0 );
                  expect( testBed.scope.eventBus.publish ).toHaveBeenCalledWith( 'didValidate.widgetListing', {
                     resource: 'widgetListing',
                     outcome: 'ERROR',
                     data: [{
                        htmlMessage: 'Failed to load file listing from http://myApp:8000/listings/error_widgets.json',
                        level: 'ERROR'
                     }]
                  } );
               } );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'with a configured list with URLs', function() {

            beforeEach( function() {
               testBed.featuresMock = {
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
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'combines the each file path with the application url and makes for each a GET requests (R1.5, R1.6)', function() {
               testBed.setup( {
                  onBeforeControllerCreation: function( $injector ) {
                     $httpBackend = $injector.get( '$httpBackend' );
                     $httpBackend.when( 'GET', 'http://localhost:8000/var/listing/includes_portal_widgets.json' )
                        .respond( 200, widgetListing.bowerComponentsWidgetListing );
                     $httpBackend.when( 'GET', 'http://localhost:8000/var/listing/includes_system_widgets.json' )
                        .respond( 200, widgetListing.systemWidgetListing );
                  }
               } );
               $httpBackend.flush();
               jasmine.Clock.tick( 0 );
            } );

            ////////////////////////////////////////////////////////////////////////////////////////////

            it( 'emits a didValidate event with error message for the resource (R1.4)', function() {
               testBed.setup( {
                  onBeforeControllerCreation: function( $injector ) {
                     $httpBackend = $injector.get( '$httpBackend' );
                     $httpBackend.when( 'GET', 'http://localhost:8000/var/listing/includes_portal_widgets.json' )
                        .respond( 200, widgetListing.bowerComponentsWidgetListing );
                     $httpBackend.when( 'GET', 'http://localhost:8000/var/listing/includes_system_widgets.json' )
                        .respond( 404, {value: 'Not Found'} );
                  }
               } );
               ax.log.info( 'Expect error message' );
               $httpBackend.flush();
               jasmine.Clock.tick( 0 );
               expect( testBed.scope.eventBus.publish ).toHaveBeenCalledWith( 'didValidate.widgetListing', {
                  resource: 'widgetListing',
                  outcome: 'ERROR',
                  data: [ {
                     htmlMessage: 'Failed to load file listing from http://localhost:8000/var/listing/includes_system_widgets.json',
                     level: 'ERROR'
                  } ]
               } );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'with no application url configured', function() {

               beforeEach( function() {
                  testBed.featuresMock = {
                     fileListing: {
                        list: [
                           'var/listing/includes_portal_widgets.json'
                        ]
                     },
                     widgetListing: {
                        resource: 'widgetListing'
                     }
                  };
                  testBed.setup( {
                     onBeforeControllerCreation: function( $injector ) {
                        $httpBackend = $injector.get( '$httpBackend' );
                        $httpBackend.when( 'GET', 'var/listing/includes_portal_widgets.json' )
                           .respond( 200, widgetListing.bowerComponentsWidgetListing );
                     }
                  } );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'reads the file listing from the application in which it is embedded out (R1.6)', function() {
                  $httpBackend.flush();
                  jasmine.Clock.tick( 0 );
               } );
            } );
         } );

         ////////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'with a configured feature widgetListing', function() {

            describe( 'when the extracted information changes', function() {
               var url = 'http://myApp:8000/listings/widgets.json';

               beforeEach( function() {
                  testBed.featuresMock = {
                     fileListing: {
                        resource: 'myFileListing'
                     },
                     widgetListing: {
                        resource: 'widgetListing'
                     }
                  };
                  testBed.setup( {
                     onBeforeControllerCreation: function( $injector ) {
                        $httpBackend = $injector.get( '$httpBackend' );
                        $httpBackend.when( 'GET', url )
                           .respond( 200, widgetListing.widgetListingMyIncludes );
                     }
                  } );
                  testBed.eventBusMock.publish( 'beginLifecycleRequest', {} );
                  testBed.eventBusMock.publish( 'didReplace.myFileListing', {
                     resource: 'myFileListing',
                     data: {
                        applicationUrl: 'http://myApp:8000/',
                        fileListingPath: 'listings/widgets.json'
                     }
                  } );
                  jasmine.Clock.tick( 0 );
               } );

               //////////////////////////////////////////////////////////////////////////////////////////////////

               it( 'propagates the new, sorted list via didReplace event (R2.1, R2.2, R2.3)', function() {
                  $httpBackend.flush();
                  jasmine.Clock.tick( 0 );

                  expect( testBed.scope.eventBus.publish ).toHaveBeenCalledWith( 'didReplace.widgetListing', {
                     resource: 'widgetListing',
                     data: {
                        widgets: buildListing( 'http://myApp:8000/', exampleWidgetListResource.widgetList )
                     }
                  } );

               } );

            } );

            /////////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'and with a configured list with several urls', function() {

               beforeEach( function setup() {
                  testBed.featuresMock = {
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

                  testBed.setup( {
                     onBeforeControllerCreation: function( $injector ) {
                        $httpBackend = $injector.get( '$httpBackend' );
                        $httpBackend.when( 'GET', 'var/listing/includes_portal_widgets.json' )
                           .respond( 200, widgetListing.bowerComponentsWidgetListing );
                        $httpBackend.when( 'GET', 'var/listing/includes_system_widgets.json' )
                           .respond( 200, widgetListing.systemWidgetListing );
                     }
                  } );
               } );

               //////////////////////////////////////////////////////////////////////////////////////////////////

               it( 'propagates a sorted list via didReplace event (R2.1, R2.2, R2.3)', function() {
                  var widgets = buildListing( '', exampleWidgetListResource.bowerComponentsAndSystemWidgetList );
                  $httpBackend.flush();
                  jasmine.Clock.tick( 0 );
                  expect( testBed.scope.eventBus.publish ).not.toHaveBeenCalledWith( 'didReplace.widgetListing', {
                     resource: 'widgetListing',
                     data: {
                        widgets: widgets
                     }
                  } );
                  testBed.eventBusMock.publish( 'beginLifecycleRequest', {} );
                  jasmine.Clock.tick( 0 );
                  expect( testBed.scope.eventBus.publish ).toHaveBeenCalledWith( 'didReplace.widgetListing', {
                     resource: 'widgetListing',
                     data: {
                        widgets: widgets
                     }
                  } );
               } );
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'with an absolute application URL', function() {

            beforeEach( function() {
               testBed.featuresMock = {
                  fileListing: {
                     list: [
                        'var/listing/includes_portal_widgets.json',
                        'var/listing/includes_system_widgets.json'
                     ],
                     applicationUrl: 'http://localhost:8000/widget-browser/'
                  },
                  widgetListing: {
                     resource: 'widgetListing'
                  }
               };
               testBed.setup( {
                  onBeforeControllerCreation: function( $injector ) {
                     $httpBackend = $injector.get( '$httpBackend' );
                     $httpBackend.when( 'GET', 'http://localhost:8000/widget-browser/' + 'var/listing/includes_portal_widgets.json' )
                        .respond( 200, widgetListing.bowerComponentsWidgetListing );
                     $httpBackend.when( 'GET', 'http://localhost:8000/widget-browser/' + 'var/listing/includes_system_widgets.json' )
                        .respond( 200, widgetListing.systemWidgetListing );
                  }
               } );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'uses the URL to get the file listing', function() {
               $httpBackend.flush();
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'combines the widget path with the application URL to the widget URL', function() {
               var widgets = buildListing( 'http://localhost:8000/widget-browser/', exampleWidgetListResource.bowerComponentsAndSystemWidgetList );
               $httpBackend.flush();
               jasmine.Clock.tick( 0 )
               testBed.eventBusMock.publish( 'beginLifecycleRequest', {} );
               jasmine.Clock.tick( 0 );
               expect( testBed.scope.eventBus.publish ).toHaveBeenCalledWith( 'didReplace.widgetListing', {
                  resource: 'widgetListing',
                  data: {
                     widgets: widgets
                  }
               } );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'with an absolute application URL without a trailing slash', function() {

            beforeEach( function() {
               testBed.featuresMock = {
                  fileListing: {
                     list: [
                        'var/listing/includes_portal_widgets.json',
                        'var/listing/includes_system_widgets.json'
                     ],
                     applicationUrl: 'http://localhost:8000'
                  },
                  widgetListing: {
                     resource: 'widgetListing'
                  }
               };
               testBed.setup( {
                  onBeforeControllerCreation: function( $injector ) {
                     $httpBackend = $injector.get( '$httpBackend' );
                     $httpBackend.when( 'GET', 'http://localhost:8000/' + 'var/listing/includes_portal_widgets.json' )
                        .respond( 200, widgetListing.bowerComponentsWidgetListing );
                     $httpBackend.when( 'GET', 'http://localhost:8000/' + 'var/listing/includes_system_widgets.json' )
                        .respond( 200, widgetListing.systemWidgetListing );
                  }
               } );
            } );


            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'uses the URL to get the file listing', function() {
               $httpBackend.flush();
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'combines the widget path with the application URL to the widget URL', function() {
               var widgets = buildListing( 'http://localhost:8000/', exampleWidgetListResource.bowerComponentsAndSystemWidgetList );
               $httpBackend.flush();
               jasmine.Clock.tick( 0 )
               testBed.eventBusMock.publish( 'beginLifecycleRequest', {} );
               jasmine.Clock.tick( 0 );
               expect( testBed.scope.eventBus.publish ).toHaveBeenCalledWith( 'didReplace.widgetListing', {
                  resource: 'widgetListing',
                  data: {
                     widgets: widgets
                  }
               } );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'with a relative application URL', function() {

            beforeEach( function() {
               testBed.featuresMock = {
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
               testBed.setup( {
                  onBeforeControllerCreation: function( $injector ) {
                     $httpBackend = $injector.get( '$httpBackend' );
                     $httpBackend.when( 'GET', 'var/listing/includes_portal_widgets.json' )
                        .respond( 200, widgetListing.bowerComponentsWidgetListing );
                     $httpBackend.when( 'GET', 'var/listing/includes_system_widgets.json' )
                        .respond( 200, widgetListing.systemWidgetListing );
                  }
               } );
            } );


            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'uses the URL to get the file listing', function() {
               $httpBackend.flush();
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'combines the widget path with the application URL to the widget URL', function() {
               var widgets = buildListing( '', exampleWidgetListResource.bowerComponentsAndSystemWidgetList );
               $httpBackend.flush();
               jasmine.Clock.tick( 0 )
               testBed.eventBusMock.publish( 'beginLifecycleRequest', {} );
               jasmine.Clock.tick( 0 );
               expect( testBed.scope.eventBus.publish ).toHaveBeenCalledWith( 'didReplace.widgetListing', {
                  resource: 'widgetListing',
                  data: {
                     widgets: widgets
                  }
               } );
            } );
         } );


         /////////////////////////////////////////////////////////////////////////////////////////////////////

         function buildListing( prefix, widgetListing ) {
            return widgetListing.widgets.map( function( widget ) {
               widget.specification = prefix + widget.specification;
               return widget;
            } );
         }
      } );
   } );
} );
