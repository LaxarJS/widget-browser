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
   WIDGET_BOWER: 'Failed to load bower configuration of widget from ',
   WIDGET_DOCUMENTATION: 'Failed to find documentation of widget from ',
   TEST_RUNNER: 'Failed to evaluate url of Test Runner.'
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Controller.$inject = [ '$scope', '$http', '$sce', 'axFlowService' ];

function Controller( $scope, $http, $sce, flowService ) {
   const features = $scope.features;
   $scope.resources = {};
   const resources = $scope.resources;
   $scope.model = {
      list: [],
      selectedWidgetName: null
   };
   const model = $scope.model;

   const informationResourceName = ax.object.path( features, 'select.information.resource', null );
   const bowerResourceName = ax.object.path( features, 'select.bower.resource', null );
   const documentationResourceName = ax.object.path( features, 'select.documentation.resource', null );
   const testRunnerResourceName = ax.object.path( features, 'select.testRunner.resource', null );

   patterns.resources.handlerFor( $scope ).registerResourceFromFeature( 'list', {
      onUpdateReplace: [ createList, publishSelectedWidget ]
   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   $scope.eventBus.subscribe( 'didNavigate', event => {
      if( !event.data[ $scope.features.select.parameter ] ) {
         resetWidgetResources();
         model.selectedWidgetName = null;
         return;
      }
      model.selectedWidgetName = event.data[ $scope.features.select.parameter ];
      publishSelectedWidget();
   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

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

      if( bowerResourceName ) {
         publishBowerResource( bowerResourceName, widget, ERROR_MESSAGES.WIDGET_BOWER );
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

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   function getDataAndPublishResource( url, resourceName, errorMessage ) {
      $http.get( $sce.trustAsResourceUrl( url ) )
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

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   function publishBowerResource( bowerResourceName, widget, errorMessage ) {
      let url = widget.specification.split( '/' );
      url[ url.length - 1 ] = 'bower.json';
      url = url.join( '/' );
      getDataAndPublishResource( url, bowerResourceName, errorMessage );
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   function publishDocumentationResource( documentationResourceName, widget, errorMessage ) {
      const promises = [];
      let urlListString = '';
      const urls = [];
      features.select.documentation.sources.forEach( source => {
         const urlSegments = widget.specification.split( '/' );
         urlSegments[ urlSegments.length - 1 ] = source;
         const url = urlSegments.join( '/' );
         promises.push( () => { return $http.head( url ); } );
         urls.push( url );
         urlListString = `${urlListString}, ${url}`;
      } );

      tryNextDocumentation( 0 );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      function tryNextDocumentation( n ) {
         promises[ n ]()
            .then( () => {
               $scope.eventBus.publish( `didReplace.${documentationResourceName}`, {
                  resource: documentationResourceName,
                  data: {
                     _links: {
                        markdown: {
                           href: urls[ n ]
                        }
                     }
                  }
               }, {
                  deliverToSender: false
               } );
            }, () => {
               if( n + 1 < promises.length ) {
                  tryNextDocumentation( n + 1 );
               }
               else {
                  handleMissingDocumentation();
               }
            } );
      }

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      function handleMissingDocumentation() {
         urlListString = urlListString.substring( 1 );
         $scope.eventBus.publish( 'didEncounterError.HTTP_GET', {
            code: 'HTTP_GET',
            data: {
               resource: documentationResourceName
            },
            message: errorMessage + urlListString
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
      }
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

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

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createList() {
      model.list = resources.list.widgets.map( widget => {
         const name = widget.name;
         const placeParameters = {};
         placeParameters[ $scope.features.select.parameter ] = name;
         $scope.features.select.parameterList.forEach( parameter => {
            placeParameters[ parameter ] = '';
         } );
         return {
            name,
            href: flowService.constructAbsoluteUrl( '_self', placeParameters ),
            specification: widget.specification
         };
      } );
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   function resetWidgetResources() {
      if( informationResourceName ) {
         $scope.eventBus.publish( `didReplace.${informationResourceName}`, {
            resource: informationResourceName,
            data: null
         }, {
            deliverToSender: false
         } );
      }

      if( bowerResourceName ) {
         $scope.eventBus.publish( `didReplace.${bowerResourceName}`, {
            resource: bowerResourceName,
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

export const name = ng.module( 'axWidgetBrowserWidget', [] )
   .controller( 'AxWidgetBrowserWidgetController', Controller )
   .filter( 'axWidgetBrowserHighlight', () => {
      return function( widgetName, searchTerm ) {
         if( searchTerm === '' ) {
            return widgetName;
         }
         const reg = new RegExp( `(${searchTerm})`, 'gi' );
         return widgetName.replace( reg, '<span class="ax-widget-browser-highlight">$1</span>' );
      };
   } ).name;
