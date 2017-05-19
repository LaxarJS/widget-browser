/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'json!../widget.json',
   'laxar-mocks',
   'angular-mocks',
   './data/fixtures',
   'json!../widget.json',
   'json!../spec/data/bower.json'
], function( descriptor, axMocks, ngMocks, data, widgetInformation, widgetBower ) {
   'use strict';

   describe( 'An ax-widget-browser-widget', function() {
      var $httpBackend;
      var $provide;
      var widgetEventBus;
      var widgetScope;
      var testEventBus;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function createSetup( widgetConfiguration, constructAbsoluteUrl ) {

         beforeEach( function() {
            ngMocks.module( function( _$provide_ ) {
               $provide = _$provide_;
            } );
         } );

         beforeEach( axMocks.createSetupForWidget( descriptor ) );

         beforeEach( function() {
            $provide.value( 'axFlowService', {
               constructAbsoluteUrl: constructAbsoluteUrl
            } );
            axMocks.widget.configure( widgetConfiguration );
         } );

         beforeEach( axMocks.widget.load );

         beforeEach( function() {
            widgetScope = axMocks.widget.$scope;
            widgetEventBus = axMocks.widget.axEventBus;
            testEventBus = axMocks.eventBus;
            ngMocks.inject( function( $injector ) {
               $httpBackend = $injector.get( '$httpBackend' );
            } );
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         axMocks.tearDown();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured list resource', function() {

         var widgetConfiguration = {
            list: {
               resource: 'listResource'
            },
            select: {
               parameter: 'widgetId'
            }
         };

         createSetup( widgetConfiguration, constructAbsoluteUrl );

         beforeEach( function() {
            axMocks.triggerStartupEvents();
            testEventBus.publish( 'didReplace.listResource', {
                     resource: 'listResource',
                     data: data.listResource
                  } );
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'acts as a slave of the list resource (R1.1)', function() {
            expect( widgetEventBus.subscribe )
               .toHaveBeenCalledWith( 'didReplace.listResource', jasmine.any( Function ) );
            expect( widgetEventBus.subscribe )
               .toHaveBeenCalledWith( 'didUpdate.listResource', jasmine.any( Function ) );
            expect( widgetScope.resources.list ).toEqual( data.listResource );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'displays a selectable list with all widgets and activities (R1.2)', function() {
            expect( widgetScope.model.list ).toEqual( data.browserList );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'after the user has made a selection', function() {

         describe( 'and bookmarked the site and entered the site through the bookmark', function() {
            var widgetConfiguration = {
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

            createSetup( widgetConfiguration, constructAbsoluteUrlWithAdditionalParameters );

            beforeEach( function() {
               $httpBackend.when( 'GET', /.*/ ) .respond( 200, widgetInformation );
               axMocks.triggerStartupEvents();
               testEventBus.publish( 'didReplace.listResource', {
                  resource: 'listResource',
                  data: data.listResource
               } );
               testEventBus.flush();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'selects the widget in relation to the place parameter (R2.1)', function() {
               expect( widgetScope.model.selectedWidgetName ).toEqual( null );
               testEventBus.publish( 'didNavigate._self', {
                  data: {
                     widgetId: 'ax-widget-browser-widget'
                  }
               } );
               testEventBus.flush();
               expect( widgetScope.model.selectedWidgetName ).toEqual( 'ax-widget-browser-widget' );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'the links in the widget list only have the not excluded parameters (R2.2)', function() {
               testEventBus.publish( 'didNavigate._self', {
                  data: {
                     widgetId: 'ax-widget-browser-widget',
                     anchor: 'references',
                     userId: '03804',
                     processId: '73929'
                  }
               } );
               testEventBus.flush();
               expect( widgetScope.model.list ).toEqual( data.browserListWithParameters );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'and with a new resource list without the bookmarked widget and with a configured information resource', function() {

               beforeEach( function() {
                  testEventBus.publish( 'didReplace.listResource', {
                     resource: 'listResource',
                     data: data.smallerListResource
                  } );
                  testEventBus.flush();
                  testEventBus.publish( 'didNavigate._self', {
                     data: {
                        widgetId: 'ax-widget-browser-widget'
                     }
                  } );
                  testEventBus.flush();
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'doesn\'t try to get any widget information data and replaces the resource with an empty object (R2.3)', function() {
                  $httpBackend.verifyNoOutstandingRequest();
                  expect( widgetEventBus.publish )
                     .toHaveBeenCalledWith( 'didReplace.information', { resource: 'information', data: null }, { deliverToSender: false } );
               } );
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and with a configured information resource', function() {

            var widgetConfiguration = {
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

            createSetup( widgetConfiguration, constructAbsoluteUrl );

            beforeEach( function() {
               setupHttpMockData( $httpBackend );
               axMocks.triggerStartupEvents();
               testEventBus.publish( 'didReplace.listResource', {
                  resource: 'listResource',
                  data: data.listResource
               } );
               testEventBus.flush();
               testEventBus.publish( 'didNavigate._self', {
                  data: {
                     widgetId: 'ax-widget-browser-widget'
                  }
               } );
               testEventBus.flush();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'publishes a resource with the widget.json content of the selected widget (R2.3)', function() {
               $httpBackend.flush();
               expect( widgetEventBus.publish )
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

            var widgetConfiguration = {
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

            createSetup( widgetConfiguration, constructAbsoluteUrl );

            beforeEach( function() {
               setupHttpMockData( $httpBackend );
               axMocks.triggerStartupEvents();
               testEventBus.publish( 'didReplace.listResource', {
                  resource: 'listResource',
                  data: data.listResource
               } );
               testEventBus.flush();
               testEventBus.publish( 'didNavigate._self', {
                  data: {
                     widgetId: 'ax-widget-browser-widget'
                  }
               } );
               testEventBus.flush();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'publishes a resource with the bower.json content of the selected widget (R2.4)', function() {
               $httpBackend.flush();
               expect( widgetEventBus.publish )
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

            var widgetConfiguration = {
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

            createSetup( widgetConfiguration, constructAbsoluteUrl );

            beforeEach( function() {
               $httpBackend.when( 'HEAD', 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/README.md' )
                  .respond( 404, {value: 'Not Found'} );
               $httpBackend.when( 'HEAD', 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/SPECIFICATION.md' )
                  .respond( 200, {} );
               $httpBackend.when( 'HEAD', 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/DOCUMENTATION.md' )
                  .respond( 404, {value: 'Not Found'} );
               axMocks.triggerStartupEvents();
               testEventBus.publish( 'didReplace.listResource', {
                  resource: 'listResource',
                  data: data.listResource
               } );
               testEventBus.flush();
               testEventBus.publish( 'didNavigate._self', {
                  data: {
                     widgetId: 'ax-widget-browser-widget'
                  }
               } );
               testEventBus.flush();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'publishes a resource with the link to the document of the selected widget (R2.5)', function() {
               $httpBackend.flush();
               expect( widgetEventBus.publish )
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
               expect( widgetEventBus.publish )
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

            var widgetConfiguration = {
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

            createSetup( widgetConfiguration, constructAbsoluteUrl );

            beforeEach( function() {
               setupHttpMockData( $httpBackend );
               axMocks.triggerStartupEvents();
               testEventBus.publish( 'didReplace.listResource', {
                  resource: 'listResource',
                  data: data.listResource
               } );
               testEventBus.flush();
               testEventBus.publish( 'didNavigate._self', {
                  data: {
                     widgetId: 'ax-widget-browser-widget'
                  }
               } );
               testEventBus.flush();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'publishes a resource with the link to the spec_runner.html (R2.6)', function() {
               expect( widgetEventBus.publish )
                  .toHaveBeenCalledWith( 'didReplace.testRunner', {
                     resource: 'testRunner',
                     data: {
                        mimeType: 'text/html',
                        location: 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/spec/spec_runner.html?folderDepth=5',
                        name: 'Spec Test'
                     }
                  }, {
                     deliverToSender: false
                  } );
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and with a configured information resource but the loading process fails', function() {

            var widgetConfiguration = {
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

            createSetup( widgetConfiguration, constructAbsoluteUrl );

            beforeEach( function() {
               setupHttpMockData404( $httpBackend );

               axMocks.triggerStartupEvents();
               testEventBus.publish( 'didReplace.listResource', {
                  resource: 'listResource',
                  data: data.listResource
               } );
               testEventBus.flush();
               testEventBus.publish( 'didNavigate._self', {
                  data: {
                     widgetId: 'ax-widget-browser-widget'
                  }
               } );
               testEventBus.flush();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'emits a didEncounterError event with an error message and replaces the resource with an empty object (R2.7)', function() {
               $httpBackend.flush();

               expect( widgetEventBus.publish )
                  .toHaveBeenCalledWith( 'didEncounterError.HTTP_GET', {
                     code: 'HTTP_GET',
                     data: {
                        resource: 'information',
                        location: 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/widget.json'
                     },
                     message: jasmine.any( String )
                  } );
               expect( widgetEventBus.publish )
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

            var widgetConfiguration = {
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

            createSetup( widgetConfiguration, constructAbsoluteUrl );

            beforeEach( function() {
               setupHttpMockData404( $httpBackend );
               axMocks.triggerStartupEvents();
               testEventBus.publish( 'didReplace.listResource', {
                  resource: 'listResource',
                  data: data.listResource
               } );
               testEventBus.flush();
               testEventBus.publish( 'didNavigate._self', {
                  data: {
                     widgetId: 'ax-widget-browser-widget'
                  }
               } );
               testEventBus.flush();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'emits a didEncounterError event with an error message and replaces the resource with an empty object (R2.7)', function() {
               $httpBackend.flush();

               expect( widgetEventBus.publish )
                  .toHaveBeenCalledWith( 'didEncounterError.HTTP_GET', {
                     code: 'HTTP_GET',
                     data: {
                        resource: 'bower',
                        location: 'myIncludes/widgets/widget-browser/ax-widget-browser-widget/bower.json'
                     },
                     message: jasmine.any( String )
                  } );
               expect( widgetEventBus.publish )
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

            var widgetConfiguration = {
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

            createSetup( widgetConfiguration, constructAbsoluteUrl );

            beforeEach( function() {
               setupHttpMockData404( $httpBackend );

               axMocks.triggerStartupEvents();
               testEventBus.publish( 'didReplace.listResource', {
                  resource: 'listResource',
                  data: data.listResource
               } );
               testEventBus.flush();
               testEventBus.publish( 'didNavigate._self', {
                  data: {
                     widgetId: 'ax-widget-browser-widget'
                  }
               } );
               testEventBus.flush();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'emits a didEncounterError event with an error message and replaces the resource with an empty link (R2.7)', function() {
               $httpBackend.flush();

               expect( widgetEventBus.publish )
                  .toHaveBeenCalledWith( 'didEncounterError.HTTP_GET', {
                     code: 'HTTP_GET',
                     data: {
                        resource: 'documentation'
                     },
                     message: jasmine.any( String )
                  } );
               expect( widgetEventBus.publish )
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

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function setupHttpMockData( $httpBackend ) {
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

      function setupHttpMockData404( $httpBackend ) {
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
                optionalParameters[ widgetScope.features.select.parameter ];
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
                optionalParameters[ widgetScope.features.select.parameter ] + additionalParameters;
      }
   } );
} );
