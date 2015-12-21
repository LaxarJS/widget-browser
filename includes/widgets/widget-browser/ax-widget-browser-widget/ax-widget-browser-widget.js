/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'angular',
   'laxar',
   'laxar-patterns'
], function( ng, ax, patterns ) {
   'use strict';

   var moduleName = 'axWidgetBrowserWidget';
   var module = ng.module( moduleName, [ 'ngSanitize' ] );

   var ERROR_MESSAGES = {
      WIDGET_INFORMATION: 'Failed to load widget information from ',
      WIDGET_BOWER: 'Failed to load bower configuration of widget from ',
      WIDGET_DOCUMENTATION: 'Failed to find documentation of widget from ',
      TEST_RUNNER: 'Failed to evaluate url of Test Runner.'
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Controller.$inject = ['$scope', '$http', 'axFlowService' ];

   function Controller( $scope, $http, flowService ) {
      var features = $scope.features;
      $scope.resources = {};
      var resources = $scope.resources;
      $scope.model = {
         list: [],
         selectedWidgetName: null
      };
      var model = $scope.model;

      var informationResourceName = ax.object.path( features, 'select.information.resource', null );
      var bowerResourceName = ax.object.path( features, 'select.bower.resource', null );
      var documentationResourceName = ax.object.path( features, 'select.documentation.resource', null );
      var testRunnerResourceName = ax.object.path( features, 'select.testRunner.resource', null );

      patterns.resources.handlerFor( $scope ).registerResourceFromFeature( 'list', {
         onUpdateReplace: [ createList, publishSelectedWidget ]
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.eventBus.subscribe( 'didNavigate', function( event ) {
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
         var widget = $scope.model.list.filter( function( widget ) {
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
         $http.get( url )
            .then( function( resp ) {
               $scope.eventBus.publish( 'didReplace.' + resourceName, {
                  resource: resourceName,
                  data: resp.data
               }, {
                  deliverToSender: false
               } );
            }, function() {
               $scope.eventBus.publish( 'didEncounterError.HTTP_GET', {
                  code: 'HTTP_GET',
                  data: {
                     resource: resourceName,
                     location: url
                  },
                  message: errorMessage + url
               } );
               $scope.eventBus.publish( 'didReplace.' + resourceName, {
                  resource: resourceName,
                  data: {}
               }, {
                  deliverToSender: false
               } );
            } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function publishBowerResource( bowerResourceName, widget, errorMessage ) {
         var url = widget.specification.split( '/' );
         url[ url.length - 1 ] = 'bower.json';
         url = url.join( '/' );
         getDataAndPublishResource( url, bowerResourceName, errorMessage );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function publishDocumentationResource( documentationResourceName, widget, errorMessage ) {
         var promises = [];
         var urlListString = '';
         var urls = [];
         features.select.documentation.sources.forEach( function( source ) {
            var urlSegments = widget.specification.split( '/' );
            urlSegments[ urlSegments.length - 1 ] = source;
            var url = urlSegments.join( '/' );
            promises.push( function(){ return $http.head( url ); } );
            urls.push( url );
            urlListString = urlListString + ', ' + url;
         } );

         tryNextDocumentation( 0 );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         function tryNextDocumentation( n ) {
            promises[ n ]()
               .then( function() {
                  $scope.eventBus.publish( 'didReplace.' + documentationResourceName, {
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
               }, function() {
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
            $scope.eventBus.publish( 'didReplace.' + documentationResourceName, {
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
         var url = widget.specification.split( '/' );
         url[ url.length - 1 ] = 'spec/spec_runner.html';
         url = url.join( '/' );
         $scope.eventBus.publish( 'didReplace.' + testRunnerResourceName, {
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
         model.list = resources.list.widgets.map( function( widget ) {
            var name = widget.name;
            var placeParameters = {};
            placeParameters[ $scope.features.select.parameter ] =  name;
            $scope.features.select.parameterList.forEach( function( parameter ) {
               placeParameters[ parameter ] =  '';
            } );
            return {
               name: name,
               href: flowService.constructAbsoluteUrl( '_self', placeParameters ),
               specification: widget.specification
            };
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function resetWidgetResources() {
         if( informationResourceName ) {
            $scope.eventBus.publish( 'didReplace.' + informationResourceName, {
               resource: informationResourceName,
               data: null
            }, {
               deliverToSender: false
            } );
         }

         if( bowerResourceName ) {
            $scope.eventBus.publish( 'didReplace.' + bowerResourceName, {
               resource: bowerResourceName,
               data: null
            }, {
               deliverToSender: false
            } );
         }

         if( documentationResourceName ) {
            $scope.eventBus.publish( 'didReplace.' + documentationResourceName, {
               resource: documentationResourceName,
               data: null
            }, {
               deliverToSender: false
            } );
         }

         if( testRunnerResourceName ) {
            $scope.eventBus.publish( 'didReplace.' + testRunnerResourceName, {
               resource: testRunnerResourceName,
               data: null
            }, {
               deliverToSender: false
            } );
         }
      }
   }

   module.controller( 'AxWidgetBrowserWidgetController', Controller );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   module.filter( 'axWidgetBrowserHighlight', function() {
      return function( widgetName, searchTerm ) {
         if( searchTerm === '' ) {
            return widgetName;
         }
         var reg = new RegExp( '(' + searchTerm + ')', 'gi' );
         return widgetName.replace( reg, '<span class="ax-widget-browser-highlight">$1</span>' );
      };
   } );

   return module;
} );
