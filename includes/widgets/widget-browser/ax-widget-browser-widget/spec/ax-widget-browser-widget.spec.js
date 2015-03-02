/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   '../ax-widget-browser-widget',
   'laxar/laxar_testing',
   'angular-mocks',
   'jquery',
   './fixtures',
   'text!laxar-path-widgets/widget-browser/ax-widget-browser-widget/default.theme/ax-widget-browser-widget.html',
   'json!laxar-path-widgets/widget-browser/ax-widget-browser-widget/widget.json',
   'json!laxar-path-widgets/widget-browser/ax-widget-browser-widget/bower.json'
], function( widgetModule, ax, ngMocks, $, specData, widgetMarkup, widgetInformation, widgetBower ) {
   'use strict';

   describe( 'An AxWidgetBrowserWidget', function() {
      var testBed;
      var $widget;
      var $httpBackend;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function setupHttpMockData( $injector ) {
         $httpBackend = $injector.get( '$httpBackend' );
         $httpBackend.when( 'GET', 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/widget.json' )
            .respond( 200, widgetInformation );
         $httpBackend.when( 'GET', 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/bower.json' )
            .respond( 200, widgetBower );
         $httpBackend.when( 'HEAD', 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/SPECIFICATION.md' )
            .respond( 200, {} );
         $httpBackend.when( 'HEAD', 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/README.md' )
            .respond( 404, { value: 'Not Found' } );
         $httpBackend.when( 'HEAD', 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/DOCUMENTATION.md' )
            .respond( 404, { value: 'Not Found' } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function setupHttpMockData404( $injector ) {
         $httpBackend = $injector.get( '$httpBackend' );
         $httpBackend.when( 'GET', 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/widget.json' )
            .respond( 404, { value: 'Not Found' } );
         $httpBackend.when( 'GET', 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/bower.json' )
            .respond( 404, { value: 'Not Found' } );
         $httpBackend.when( 'HEAD', 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/SPECIFICATION.md' )
            .respond( 404, { value: 'Not Found' } );
         $httpBackend.when( 'HEAD', 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/README.md' )
            .respond( 404, { value: 'Not Found' } );
         $httpBackend.when( 'HEAD', 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/DOCUMENTATION.md' )
            .respond( 404, { value: 'Not Found' } );
      }
      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function constructAbsoluteUrl( place, optionalParameters ) {
         return 'http://localhost:8000/index.html#/widgetBrowser/' +
                optionalParameters[ testBed.scope.features.select.parameter ];
      }
      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function constructAbsoluteUrlWithAdditionalParameters( place, optionalParameters ) {
         var additionalParameters = '';
         if( optionalParameters.anchor === undefined ) {
            additionalParameters = additionalParameters + '/references';
         }
         if( optionalParameters.userId === undefined ) {
            additionalParameters = additionalParameters + '/03804';
         }
         if( optionalParameters.processId === undefined ) {
            additionalParameters = additionalParameters + '/73929';
         }
         return 'http://localhost:8000/index.html#/widgetBrowser/' +
                optionalParameters[ testBed.scope.features.select.parameter ] + additionalParameters;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function setup( features, onBeforeControllerCreationFunction, constructAbsoluteUrl  ) {
         testBed = ax.testing.portalMocksAngular.createControllerTestBed( 'widget-browser/ax-widget-browser-widget' );
         testBed.useWidgetJson();
         testBed.injections = {
            axFlowService: {
               constructAbsoluteUrl: constructAbsoluteUrl
            }
         };
         testBed.featuresMock = features;
         testBed.setup( {
            onBeforeControllerCreation: onBeforeControllerCreationFunction
         } );
         ngMocks.inject( function( $compile ) {
            $( '#container' ).remove();
            $widget = $( '<div id="container"></div>' ).html( widgetMarkup );
            $compile( $widget )( testBed.scope );
            $widget.appendTo( 'body' );
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         testBed.tearDown();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured list resource', function() {

         beforeEach( function() {
            var features = {
               list: {
                  resource: 'listResource'
               },
               select: {
                  parameter: 'widgetId'
               }

            };
            setup( features, function() {}, constructAbsoluteUrl );
            testBed.eventBusMock.publish( 'didReplace.listResource', {
               resource: 'listResource',
               data: specData.listResource
            } );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'acts as a slave of the list resource (R1.1)', function() {
            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didReplace.listResource', jasmine.any( Function ) );
            expect( testBed.scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didUpdate.listResource', jasmine.any( Function ) );
            expect( testBed.scope.resources.list ).toEqual( specData.listResource );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'displays a selectable list with all widgets and activities (R1.2)', function() {
            expect( testBed.scope.model.list ).toEqual( specData.browserList );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'after the user has made a selection', function() {

         describe( 'and bookmarked the site and entered the site through the bookmark', function() {

            beforeEach( function() {
               var features = {
                  list: {
                     resource: 'listResource'
                  },
                  select: {
                     parameter: 'widgetId',
                     parameterList: [ 'anchor', 'userId' ],
                     information: {
                        resource: 'information'
                     }
                  }
               };
               setup( features, function( $injector ) {
                  $httpBackend = $injector.get( '$httpBackend' );
                  $httpBackend.when( 'GET', /.*/ )
                     .respond( 200, widgetInformation );
               }, constructAbsoluteUrlWithAdditionalParameters );
               testBed.eventBusMock.publish( 'didReplace.listResource', {
                  resource: 'listResource',
                  data: specData.listResource
               } );
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'selects the widget in relation to the place parameter (R2.1)', function() {
               expect( testBed.scope.model.selectedWidgetName ).toEqual( null );
               testBed.eventBusMock.publish( 'didNavigate._self', {
                  data: {
                     widgetId: 'AxWidgetBrowserWidget'
                  }
               } );
               jasmine.Clock.tick( 0 );
               expect( testBed.scope.model.selectedWidgetName ).toEqual( 'AxWidgetBrowserWidget' );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'the links in the widget list only have the not excluded parameters (R2.2)', function() {
               testBed.eventBusMock.publish( 'didNavigate._self', {
                  data: {
                     widgetId: 'AxWidgetBrowserWidget',
                     anchor: 'references',
                     userId: '03804',
                     processId: '73929'
                  }
               } );
               jasmine.Clock.tick( 0 );
               expect( testBed.scope.model.list ).toEqual( specData.browserListWithParameters );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'and with a new resource list without the bookmarked widget and with a configured information resource', function() {

               beforeEach( function() {
                  testBed.eventBusMock.publish( 'didReplace.listResource', {
                     resource: 'listResource',
                     data: specData.smallerListResource
                  } );
                  jasmine.Clock.tick( 0 );
                  testBed.eventBusMock.publish( 'didNavigate._self', {
                     data: {
                        widgetId: 'AxWidgetBrowserWidget'
                     }
                  } );
                  jasmine.Clock.tick( 0 );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'doesn\'t try to get any widget information data and doesn\'t publish any resource (R2.3)', function() {
                  $httpBackend.verifyNoOutstandingRequest();
                  expect( testBed.scope.eventBus.publish )
                     .not.toHaveBeenCalledWith( jasmine.any( String ), jasmine.any( Object ), jasmine.any( Object ) );
                  expect( testBed.scope.eventBus.publish )
                     .not.toHaveBeenCalledWith( jasmine.any( String ), jasmine.any( Object ) );
               } );
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and with a configured information resource', function() {

            beforeEach( function() {
               var features = {
                  list: {
                     resource: 'listResource'
                  },
                  select: {
                     parameter: 'widgetId',
                     information: {
                        resource: 'information'
                     }
                  }
               };
               setup( features, setupHttpMockData, constructAbsoluteUrl );
               testBed.eventBusMock.publish( 'didReplace.listResource', {
                  resource: 'listResource',
                  data: specData.listResource
               } );
               jasmine.Clock.tick( 0 );
               testBed.eventBusMock.publish( 'didNavigate._self', {
                  data: {
                     widgetId: 'AxWidgetBrowserWidget'
                  }
               } );
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'publishes a resource with the widget.json content of the selected widget (R2.3)', function() {
               $httpBackend.flush();
               jasmine.Clock.tick( 0 );
               expect( testBed.scope.eventBus.publish )
                  .toHaveBeenCalledWith( 'didReplace.information', {
                     resource: 'information',
                     data: widgetInformation
                  }, {
                     deliverToSender: false
                  } );
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and with a configured bower resource', function() {

            beforeEach( function() {
               var features = {
                  list: {
                     resource: 'listResource'
                  },
                  select: {
                     parameter: 'widgetId',
                     bower: {
                        resource: 'bower'
                     }
                  }
               };
               setup( features, setupHttpMockData, constructAbsoluteUrl );
               testBed.eventBusMock.publish( 'didReplace.listResource', {
                  resource: 'listResource',
                  data: specData.listResource
               } );
               jasmine.Clock.tick( 0 );
               testBed.eventBusMock.publish( 'didNavigate._self', {
                  data: {
                     widgetId: 'AxWidgetBrowserWidget'
                  }
               } );
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'publishes a resource with the bower.json content of the selected widget (R2.4)', function() {
               $httpBackend.flush();
               jasmine.Clock.tick( 0 );
               expect( testBed.scope.eventBus.publish )
                  .toHaveBeenCalledWith( 'didReplace.bower', {
                     resource: 'bower',
                     data: widgetBower
                  }, {
                     deliverToSender: false
                  } );
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and with a configured documentation resource and a configured file name list', function() {

            beforeEach( function() {
               var features = {
                  list: {
                     resource: 'listResource'
                  },
                  select: {
                     parameter: 'widgetId',
                     documentation: {
                        resource: 'documentation',
                        sources: [ 'README.md', 'SPECIFICATION.md', 'DOCUMENTATION.md' ]
                     }
                  }
               };
               setup( features, function( $injector ) {
                  $httpBackend = $injector.get( '$httpBackend' );
                  $httpBackend.when( 'HEAD', 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/README.md' )
                     .respond( 404, {value: 'Not Found'} );
                  $httpBackend.when( 'HEAD', 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/SPECIFICATION.md' )
                     .respond( 200, {} );
                  $httpBackend.when( 'HEAD', 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/DOCUMENTATION.md' )
                     .respond( 404, {value: 'Not Found'} );
               }, constructAbsoluteUrl );
               testBed.eventBusMock.publish( 'didReplace.listResource', {
                  resource: 'listResource',
                  data: specData.listResource
               } );
               jasmine.Clock.tick( 0 );
               testBed.eventBusMock.publish( 'didNavigate._self', {
                  data: {
                     widgetId: 'AxWidgetBrowserWidget'
                  }
               } );
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'tests the file names until one exists (R2.5)', function() {
               $httpBackend.flush( 2 );
               $httpBackend.verifyNoOutstandingRequest();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'publishes a resource with the link to the document of the selected widget (R2.5)', function() {
               $httpBackend.flush();
               jasmine.Clock.tick( 0 );
               expect( testBed.scope.eventBus.publish )
                  .toHaveBeenCalledWith( 'didReplace.documentation', {
                     resource: 'documentation',
                     data: {
                        _links: {
                           markdown: {
                              href: 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/SPECIFICATION.md'
                           }
                        }
                     }
                  },
                  {
                     deliverToSender: false
                  } );
               expect( testBed.scope.eventBus.publish )
                  .not.toHaveBeenCalledWith( 'didEncounterError.HTTP_HEAD', {
                     code: 'HTTP_HEAD',
                     data: {
                        resource: 'documentation'
                     },
                     message: jasmine.any( String )
                  } );
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and with a configured test runner resource', function() {

            beforeEach( function() {
               var features = {
                  list: {
                     resource: 'listResource'
                  },
                  select: {
                     parameter: 'widgetId',
                     testRunner: {
                        resource: 'testRunner'
                     }
                  }
               };
               setup( features, setupHttpMockData, constructAbsoluteUrl );
               testBed.eventBusMock.publish( 'didReplace.listResource', {
                  resource: 'listResource',
                  data: specData.listResource
               } );
               jasmine.Clock.tick( 0 );
               testBed.eventBusMock.publish( 'didNavigate._self', {
                  data: {
                     widgetId: 'AxWidgetBrowserWidget'
                  }
               } );
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'publishes a resource with the link to the spec_runner.html (R2.6)', function() {
               expect( testBed.scope.eventBus.publish )
                  .toHaveBeenCalledWith( 'didReplace.testRunner', {
                     resource: 'testRunner',
                     data: {
                        mimeType: 'text/html',
                        location: 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/spec/spec_runner.html',
                        name: 'Spec Test'
                     }
                  }, {
                     deliverToSender: false
                  } );
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and with a configured information resource but the loading process fails', function() {

            beforeEach( function() {
               var features = {
                  list: {
                     resource: 'listResource'
                  },
                  select: {
                     parameter: 'widgetId',
                     information: {
                        resource: 'information'
                     }
                  }
               };
               setup( features, setupHttpMockData404, constructAbsoluteUrl );
               testBed.eventBusMock.publish( 'didReplace.listResource', {
                  resource: 'listResource',
                  data: specData.listResource
               } );
               jasmine.Clock.tick( 0 );
               testBed.eventBusMock.publish( 'didNavigate._self', {
                  data: {
                     widgetId: 'AxWidgetBrowserWidget'
                  }
               } );
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'emits a didEncounterError event with an error message and replaces the resource with an empty object (R2.7)', function() {
               $httpBackend.flush();
               jasmine.Clock.tick( 0 );

               expect( testBed.scope.eventBus.publish )
                  .toHaveBeenCalledWith( 'didEncounterError.HTTP_GET', {
                     code: 'HTTP_GET',
                     data: {
                        resource: 'information',
                        location: 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/widget.json'
                     },
                     message: jasmine.any( String )
                  } );
               expect( testBed.scope.eventBus.publish )
                  .toHaveBeenCalledWith( 'didReplace.information', {
                     resource: 'information',
                     data: {}
                  }, {
                     deliverToSender: false
                  } );
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and with a configured bower resource but the loading process fails', function() {

            beforeEach( function() {
               var features = {
                  list: {
                     resource: 'listResource'
                  },
                  select: {
                     parameter: 'widgetId',
                     bower: {
                        resource: 'bower'
                     }
                  }
               };
               setup( features, setupHttpMockData404, constructAbsoluteUrl );
               testBed.eventBusMock.publish( 'didReplace.listResource', {
                  resource: 'listResource',
                  data: specData.listResource
               } );
               jasmine.Clock.tick( 0 );
               testBed.eventBusMock.publish( 'didNavigate._self', {
                  data: {
                     widgetId: 'AxWidgetBrowserWidget'
                  }
               } );
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'emits a didEncounterError event with an error message and replaces the resource with an empty object (R2.7)', function() {
               $httpBackend.flush();
               jasmine.Clock.tick( 0 );

               expect( testBed.scope.eventBus.publish )
                  .toHaveBeenCalledWith( 'didEncounterError.HTTP_GET', {
                     code: 'HTTP_GET',
                     data: {
                        resource: 'bower',
                        location: 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/bower.json'
                     },
                     message: jasmine.any( String )
                  } );
               expect( testBed.scope.eventBus.publish )
                  .toHaveBeenCalledWith( 'didReplace.bower', {
                     resource: 'bower',
                     data: {}
                  }, {
                     deliverToSender: false
                  } );
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and with a configured documentation resource but the loading process fails', function() {

            beforeEach( function() {
               var features = {
                  list: {
                     resource: 'listResource'
                  },
                  select: {
                     parameter: 'widgetId',
                     documentation: {
                        resource: 'documentation'
                     }
                  }
               };
               setup( features, setupHttpMockData404, constructAbsoluteUrl );
               testBed.eventBusMock.publish( 'didReplace.listResource', {
                  resource: 'listResource',
                  data: specData.listResource
               } );
               jasmine.Clock.tick( 0 );
               testBed.eventBusMock.publish( 'didNavigate._self', {
                  data: {
                     widgetId: 'AxWidgetBrowserWidget'
                  }
               } );
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'emits a didEncounterError event with an error message and replaces the resource with an empty link (R2.7)', function() {
               $httpBackend.flush();
               jasmine.Clock.tick( 0 );

               expect( testBed.scope.eventBus.publish )
                  .toHaveBeenCalledWith( 'didEncounterError.HTTP_GET', {
                     code: 'HTTP_GET',
                     data: {
                        resource: 'documentation'
                     },
                     message: jasmine.any( String )
                  } );
               expect( testBed.scope.eventBus.publish )
                  .toHaveBeenCalledWith( 'didReplace.documentation', {
                     resource: 'documentation',
                     data: {
                        _links: {
                           markdown: {
                              href: null
                           }
                        }
                     }
                  },
                  {
                     deliverToSender: false
                  } );
            } );
         } );
      } );
   } );
} );
