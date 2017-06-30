/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * https://laxarjs.org/license
 */

import * as axMocks from 'laxar-mocks';
import angular from 'angular';
import 'angular-mocks';
import { data } from './data/fixtures';
import * as widgetInformation from '../widget.json';
import * as widgetPackage from './data/package.json';

describe( 'A widget-browser-widget', () => {
   let $httpBackend;
   let widgetEventBus;
   let widgetScope;
   let testEventBus;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createSetup( widgetConfiguration, constructAbsoluteUrl ) {

      beforeEach( axMocks.setupForWidget() );

      beforeEach( () => {
         axMocks.widget.configure( widgetConfiguration );

         axMocks.widget.whenServicesAvailable( services => {
            services.axFlowService.constructAbsoluteUrl
               .and.callFake( constructAbsoluteUrl );
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

   afterEach( axMocks.tearDown );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with a configured list resource', () => {

      const widgetConfiguration = {
         list: {
            resource: 'listResource'
         },
         select: {
            parameter: 'widgetId'
         }
      };

      createSetup( widgetConfiguration, constructAbsoluteUrl );

      beforeEach( () => {
         axMocks.triggerStartupEvents();
         testEventBus.publish( 'didReplace.listResource', {
            resource: 'listResource',
            data: data.listResource
         } );
         testEventBus.flush();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'acts as a slave of the list resource (R1.1)', () => {
         expect( widgetEventBus.subscribe )
            .toHaveBeenCalledWith( 'didReplace.listResource', jasmine.any( Function ) );
         expect( widgetEventBus.subscribe )
            .toHaveBeenCalledWith( 'didUpdate.listResource', jasmine.any( Function ) );
         expect( widgetScope.resources.list ).toEqual( data.listResource );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'displays a selectable list with all widgets and activities (R1.2)', () => {
         expect( widgetScope.model.list ).toEqual( data.browserList );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'after the user has made a selection', () => {

      describe( 'and bookmarked the site and entered the site through the bookmark', () => {
         const widgetConfiguration = {
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

         beforeEach( () => {
            $httpBackend.when( 'GET', /.*/ ).respond( 200, widgetInformation );
            axMocks.triggerStartupEvents();
            testEventBus.publish( 'didReplace.listResource', {
               resource: 'listResource',
               data: data.listResource
            } );
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'selects the widget in relation to the place parameter (R2.1)', () => {
            expect( widgetScope.model.selectedWidgetName ).toEqual( null );
            testEventBus.publish( 'didNavigate._self', {
               data: {
                  widgetId: 'widget-browser-widget'
               }
            } );
            testEventBus.flush();
            expect( widgetScope.model.selectedWidgetName ).toEqual( 'widget-browser-widget' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'the links in the widget list only have the not excluded parameters (R2.2)', () => {
            testEventBus.publish( 'didNavigate._self', {
               data: {
                  widgetId: 'widget-browser-widget',
                  anchor: 'references',
                  userId: '03804',
                  processId: '73929'
               }
            } );
            testEventBus.flush();
            expect( widgetScope.model.list ).toEqual( data.browserListWithParameters );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'and with a new resource list without the bookmarked widget and with a configured ' +
                   'information resource', () => {

            beforeEach( () => {
               testEventBus.publish( 'didReplace.listResource', {
                  resource: 'listResource',
                  data: data.smallerListResource
               } );
               testEventBus.flush();
               testEventBus.publish( 'didNavigate._self', {
                  data: {
                     widgetId: 'widget-browser-widget'
                  }
               } );
               testEventBus.flush();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'doesn\'t try to get any widget information data and replaces the resource with ' +
                'an empty object (R2.3)', () => {
               $httpBackend.verifyNoOutstandingRequest();
               expect( widgetEventBus.publish )
                  .toHaveBeenCalledWith(
                     'didReplace.information',
                     { resource: 'information', data: null },
                     { deliverToSender: false }
                  );
            } );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'and with a configured information resource', () => {

         const widgetConfiguration = {
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

         beforeEach( () => {
            setupHttpMockData( $httpBackend );
            axMocks.triggerStartupEvents();
            testEventBus.publish( 'didReplace.listResource', {
               resource: 'listResource',
               data: data.listResource
            } );
            testEventBus.flush();
            testEventBus.publish( 'didNavigate._self', {
               data: {
                  widgetId: 'widget-browser-widget'
               }
            } );
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes a resource with the widget.json content of the selected widget (R2.3)', () => {
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

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'and with a configured package resource', () => {

         const widgetConfiguration = {
            list: {
               resource: 'listResource'
            },
            select: {
               parameter: 'widgetId',
               package: {
                  resource: 'package'
               }
            }
         };

         createSetup( widgetConfiguration, constructAbsoluteUrl );

         beforeEach( () => {
            setupHttpMockData( $httpBackend );
            axMocks.triggerStartupEvents();
            testEventBus.publish( 'didReplace.listResource', {
               resource: 'listResource',
               data: data.listResource
            } );
            testEventBus.flush();
            testEventBus.publish( 'didNavigate._self', {
               data: {
                  widgetId: 'widget-browser-widget'
               }
            } );
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes a resource with the package.json content of the selected widget (R2.4)', () => {
            $httpBackend.flush();
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didReplace.package', {
                  resource: 'package',
                  data: widgetPackage
               }, {
                  deliverToSender: false
               } );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'and with a configured documentation resource and a configured file name list', () => {

         const widgetConfiguration = {
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

         beforeEach( () => {
            setupHttpMockData( $httpBackend );
            axMocks.triggerStartupEvents();
            testEventBus.publish( 'didReplace.listResource', {
               resource: 'listResource',
               data: data.listResource
            } );
            testEventBus.flush();
            testEventBus.publish( 'didNavigate._self', {
               data: {
                  widgetId: 'widget-browser-widget'
               }
            } );
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes a resource with the link to the document of the selected widget (R2.5)', () => {
            $httpBackend.flush();
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didReplace.documentation', {
                  resource: 'documentation',
                  data: {
                     _links: {
                        markdown: {
                           href: 'myIncludes/widgets/widget-browser/widget-browser-widget/README.md'
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

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'and with a configured test runner resource', () => {

         const widgetConfiguration = {
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

         beforeEach( () => {
            setupHttpMockData( $httpBackend );
            axMocks.triggerStartupEvents();
            testEventBus.publish( 'didReplace.listResource', {
               resource: 'listResource',
               data: data.listResource
            } );
            testEventBus.flush();
            testEventBus.publish( 'didNavigate._self', {
               data: {
                  widgetId: 'widget-browser-widget'
               }
            } );
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes a resource with the link to the spec_runner.html (R2.6)', () => {
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didReplace.testRunner', {
                  resource: 'testRunner',
                  data: {
                     mimeType: 'text/html',
                     location: 'myIncludes/widgets/widget-browser/widget-browser-widget/' +
                               'spec/spec_runner.html?folderDepth=5',
                     name: 'Spec Test'
                  }
               }, {
                  deliverToSender: false
               } );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'and with a configured information resource but the loading process fails', () => {

         const widgetConfiguration = {
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

         beforeEach( () => {
            setupHttpMockData404( $httpBackend );

            axMocks.triggerStartupEvents();
            testEventBus.publish( 'didReplace.listResource', {
               resource: 'listResource',
               data: data.listResource
            } );
            testEventBus.flush();
            testEventBus.publish( 'didNavigate._self', {
               data: {
                  widgetId: 'widget-browser-widget'
               }
            } );
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'emits a didEncounterError event with an error message and replaces the resource with ' +
             'an empty object (R2.7)', () => {
            $httpBackend.flush();

            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didEncounterError.HTTP_GET', {
                  code: 'HTTP_GET',
                  data: {
                     resource: 'information',
                     location: 'myIncludes/widgets/widget-browser/widget-browser-widget/widget.json'
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

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'and with a configured package resource but the loading process fails', () => {

         const widgetConfiguration = {
            list: {
               resource: 'listResource'
            },
            select: {
               parameter: 'widgetId',
               package: {
                  resource: 'package'
               }
            }
         };

         createSetup( widgetConfiguration, constructAbsoluteUrl );

         beforeEach( () => {
            setupHttpMockData404( $httpBackend );
            axMocks.triggerStartupEvents();
            testEventBus.publish( 'didReplace.listResource', {
               resource: 'listResource',
               data: data.listResource
            } );
            testEventBus.flush();
            testEventBus.publish( 'didNavigate._self', {
               data: {
                  widgetId: 'widget-browser-widget'
               }
            } );
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'emits a didEncounterError event with an error message and replaces the resource with ' +
             'an empty object (R2.7)', () => {
            $httpBackend.flush();

            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didEncounterError.HTTP_GET', {
                  code: 'HTTP_GET',
                  data: {
                     resource: 'package',
                     location: 'myIncludes/widgets/widget-browser/widget-browser-widget/package.json'
                  },
                  message: jasmine.any( String )
               } );
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didReplace.package', {
                  resource: 'package',
                  data: {}
               }, {
                  deliverToSender: false
               } );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'and with a configured documentation resource but the loading process fails', () => {

         const widgetConfiguration = {
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

         beforeEach( () => {
            setupHttpMockData404( $httpBackend );

            axMocks.triggerStartupEvents();
            testEventBus.publish( 'didReplace.listResource', {
               resource: 'listResource',
               data: data.listResource
            } );
            testEventBus.flush();
            testEventBus.publish( 'didNavigate._self', {
               data: {
                  widgetId: 'widget-browser-widget'
               }
            } );
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'emits a didEncounterError event with an error message and replaces the resource with ' +
             'an empty link (R2.7)', () => {
            $httpBackend.flush();

            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didEncounterError.HTTP_GET', {
                  code: 'HTTP_GET',
                  data: {
                     resource: 'documentation',
                     location: 'myIncludes/widgets/widget-browser/widget-browser-widget/README.md'
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

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function setupHttpMockData( $httpBackend ) {
      $httpBackend.when( 'GET', 'myIncludes/widgets/widget-browser/widget-browser-widget/widget.json' )
         .respond( 200, widgetInformation );

      $httpBackend.when( 'GET', 'myIncludes/widgets/widget-browser/widget-browser-widget/package.json' )
         .respond( 200, widgetPackage );

      $httpBackend.when( 'HEAD', 'myIncludes/widgets/widget-browser/widget-browser-widget/README.md' )
         .respond( 200, {} );

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function setupHttpMockData404( $httpBackend ) {
      $httpBackend.when( 'GET', 'myIncludes/widgets/widget-browser/widget-browser-widget/widget.json' )
         .respond( 404, { value: 'Not Found' } );

      $httpBackend.when( 'GET', 'myIncludes/widgets/widget-browser/widget-browser-widget/package.json' )
         .respond( 404, { value: 'Not Found' } );

      $httpBackend.when( 'HEAD', 'myIncludes/widgets/widget-browser/widget-browser-widget/README.md' )
         .respond( 404, { value: 'Not Found' } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function constructAbsoluteUrl( place, optionalParameters ) {
      return `http://localhost:8000/index.html#/widgetBrowser/${
             optionalParameters[ widgetScope.features.select.parameter ]}`;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function constructAbsoluteUrlWithAdditionalParameters( place, optionalParameters ) {
      let additionalParameters = '';
      if( optionalParameters.anchor === undefined ) {
         additionalParameters = `${additionalParameters}/references`;
      }
      if( optionalParameters.userId === undefined ) {
         additionalParameters = `${additionalParameters}/03804`;
      }
      if( optionalParameters.processId === undefined ) {
         additionalParameters = `${additionalParameters}/73929`;
      }
      return `http://localhost:8000/index.html#/widgetBrowser/${
             optionalParameters[ widgetScope.features.select.parameter ]}${additionalParameters}`;
   }
} );

