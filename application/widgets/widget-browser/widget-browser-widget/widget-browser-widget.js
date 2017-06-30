/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

import * as ng from 'angular';
import 'angular-sanitize';
import * as ax from 'laxar';
import * as patterns from 'laxar-patterns';

const ERROR_MESSAGES = {
   WIDGET_INFORMATION: 'Failed to load widget information from ',
   WIDGET_PACKAGE: 'Failed to load package configuration of widget from ',
   WIDGET_DOCUMENTATION: 'Failed to find documentation of widget from ',
   TEST_RUNNER: 'Failed to evaluate url of Test Runner.'
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Controller.$inject = [ '$scope', '$http', 'axFlowService' ];

function Controller( $scope, $http, flowService ) {
   const features = $scope.features;
   $scope.resources = {};
   const resources = $scope.resources;
   $scope.model = {
      list: [],
      selectedWidgetName: null
   };
   const model = $scope.model;

   const informationResourceName = ax.object.path( features, 'select.information.resource', null );
   const packageResourceName = ax.object.path( features, 'select.package.resource', null );
   const documentationResourceName = ax.object.path( features, 'select.documentation.resource', null );
   const testRunnerResourceName = ax.object.path( features, 'select.testRunner.resource', null );

   patterns.resources.handlerFor( $scope ).registerResourceFromFeature( 'list', {
      onUpdateReplace: [ createList, publishSelectedWidget ]
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   $scope.eventBus.subscribe( 'didNavigate', event => {
      if( !event.data[ $scope.features.select.parameter ] ) {
         resetWidgetResources();
         model.selectedWidgetName = null;
         return;
      }
      model.selectedWidgetName = event.data[ $scope.features.select.parameter ];
      publishSelectedWidget();
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function publishSelectedWidget() {
      if( !model.selectedWidgetName ) {
         return;
      }
      const widget = $scope.model.list.filter( widget => {
         return widget.name === model.selectedWidgetName;
      } )[ 0 ];
      if( !widget ) {
         // Widget list has not been received yet
         return;
      }

      if( informationResourceName ) {
         getDataAndPublishResource(
            widget.specification,
            informationResourceName,
            ERROR_MESSAGES.WIDGET_INFORMATION
         );
      }

      if( packageResourceName ) {
         publishPackageResource( packageResourceName, widget, ERROR_MESSAGES.WIDGET_PACKAGE );
      }

      if( documentationResourceName ) {
         publishDocumentationResource(
            documentationResourceName,
            widget,
            ERROR_MESSAGES.WIDGET_DOCUMENTATION
         );
      }

      if( testRunnerResourceName ) {
         publishTestRunnerResource( testRunnerResourceName, widget, ERROR_MESSAGES.TEST_RUNNER );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function getDataAndPublishResource( url, resourceName, errorMessage ) {
      $http.get( url )
         .then( resp => {
            $scope.eventBus.publish( `didReplace.${resourceName}`, {
               resource: resourceName,
               data: resp.data
            }, {
               deliverToSender: false
            } );
         }, () => {
            $scope.eventBus.publish( 'didEncounterError.HTTP_GET', {
               code: 'HTTP_GET',
               data: {
                  resource: resourceName,
                  location: url
               },
               message: errorMessage + url
            } );
            $scope.eventBus.publish( `didReplace.${resourceName}`, {
               resource: resourceName,
               data: {}
            }, {
               deliverToSender: false
            } );
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function publishPackageResource( packageResourceName, widget, errorMessage ) {
      const url = `${widget.widgetUrl}/package.json`;
      getDataAndPublishResource( url, packageResourceName, errorMessage );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function publishDocumentationResource( documentationResourceName, widget, errorMessage ) {
      const url = `${widget.widgetUrl}/README.md`;
      $http.head( url )
         .then( () => {
            $scope.eventBus.publish( `didReplace.${documentationResourceName}`, {
               resource: documentationResourceName,
               data: {
                  _links: {
                     markdown: {
                        href: url
                     }
                  }
               }
            }, {
               deliverToSender: false
            } );
         }, () => {
            $scope.eventBus.publish( 'didEncounterError.HTTP_GET', {
               code: 'HTTP_GET',
               data: {
                  resource: documentationResourceName,
                  location: url
               },
               message: errorMessage + url
            } );
            $scope.eventBus.publish( `didReplace.${documentationResourceName}`, {
               resource: documentationResourceName,
               data: {
                  _links: {
                     markdown: {
                        href: null
                     }
                  }
               }
            }, {
               deliverToSender: false
            } );
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function publishTestRunnerResource( testRunnerResourceName, widget ) {
      let url = widget.specification.split( '/' );
      url[ url.length - 1 ] = `spec/spec_runner.html?folderDepth=${url.length}`;
      url = url.join( '/' );
      $scope.eventBus.publish( `didReplace.${testRunnerResourceName}`, {
         resource: testRunnerResourceName,
         data: {
            mimeType: 'text/html',
            location: url,
            name: 'Spec Test'
         }
      }, {
         deliverToSender: false
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createList() {
      model.list = resources.list.widgets.map( widget => {
         const name = widget.name || '';
         const specification = widget.specification || '';
         const widgetUrl = widget.url || '';
         const placeParameters = {};
         placeParameters[ $scope.features.select.parameter ] = name;
         $scope.features.select.parameterList.forEach( parameter => {
            placeParameters[ parameter ] = '';
         } );
         const url = flowService.constructAbsoluteUrl( '_self', placeParameters );
         return {
            name,
            href: url,
            widgetUrl,
            specification
         };
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function resetWidgetResources() {
      if( informationResourceName ) {
         $scope.eventBus.publish( `didReplace.${informationResourceName}`, {
            resource: informationResourceName,
            data: null
         }, {
            deliverToSender: false
         } );
      }

      if( packageResourceName ) {
         $scope.eventBus.publish( `didReplace.${packageResourceName}`, {
            resource: packageResourceName,
            data: null
         }, {
            deliverToSender: false
         } );
      }

      if( documentationResourceName ) {
         $scope.eventBus.publish( `didReplace.${documentationResourceName}`, {
            resource: documentationResourceName,
            data: null
         }, {
            deliverToSender: false
         } );
      }

      if( testRunnerResourceName ) {
         $scope.eventBus.publish( `didReplace.${testRunnerResourceName}`, {
            resource: testRunnerResourceName,
            data: null
         }, {
            deliverToSender: false
         } );
      }
   }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const name = ng.module( 'widgetBrowserWidget', [ 'ngSanitize' ] )
   .controller( 'WidgetBrowserWidgetController', Controller )
   .filter( 'widgetBrowserHighlight', () => {
      return function( widgetName, searchTerm ) {
         if( searchTerm === '' ) {
            return widgetName;
         }
         const reg = new RegExp( `(${searchTerm})`, 'gi' );
         return widgetName.replace( reg, '<span class="ax-widget-browser-highlight">$1</span>' );
      };
   } ).name;
