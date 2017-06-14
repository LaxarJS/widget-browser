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

   var moduleName = 'axWidgetListingActivity';
   var module     = ng.module( moduleName, [] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var WIDGET_JSON = 'widget.json';

   Controller.$inject = [ '$scope', '$http', '$q', '$sce', 'axLog' ];

   function Controller( $scope, $http, $q, $sce, log ) {
      $scope.resources = {};
      $scope.model = {
         widgets: [],
         applicationUrl: applicationUrl()
      };

      var publishResource = $q.defer();
      $scope.eventBus.subscribe( 'beginLifecycleRequest', function() {
         publishResource.resolve();
      } );

      if( $scope.features.fileListing.resource ) {
         patterns.resources.handlerFor( $scope )
            .registerResourceFromFeature( 'fileListing', {
               onUpdateReplace: onUpdateReplace
            } );
      }
      else if( $scope.features.fileListing.list ) {
         var urls = $scope.features.fileListing.list.map( function( url ) {
            return $scope.model.applicationUrl + url;
         } );
         getWidgetList( urls );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function onUpdateReplace() {
         $scope.model.applicationUrl = applicationUrl();
         var url = $scope.model.applicationUrl + $scope.resources.fileListing.fileListingPath;
         getWidgetList( [ url ] );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function getWidgetList( urls ) {
         var promises = [];
         var widgets = [];
         urls.forEach( function( url ) {
            promises.push( $http.get( $sce.trustAsResourceUrl( url ) )
               .then( function( resp ) {
                  return resp;
               }, function( e ) {
                  return $q.reject( {
                     message: 'Failed to load file listing from ' + url,
                     error: e
                  } );
               } ) );
         } );
         promises.push( publishResource.promise );
         $q.all( promises )
            .then( function( results ) {
               results.pop();
               results.forEach( function( resp ) {
                  widgets = widgets.concat( findWidgets( resp.data ) );
               } );
               sortWidgets( widgets );
               $scope.eventBus.publish( 'didReplace.' + $scope.features.widgetListing.resource, {
                  resource: $scope.features.widgetListing.resource,
                  data: {
                     widgets: widgets
                  }
               } );
            }, function( e ) {
               $scope.eventBus.publish( 'didValidate.' + $scope.features.widgetListing.resource, {
                  resource: $scope.features.widgetListing.resource,
                  outcome: 'ERROR',
                  data: [ {
                     htmlMessage: e.message,
                     level: 'ERROR'
                  } ]
               } );
               log.error( '[0]. Error: [1:%o]', e.message, e.error );
            } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function findWidgets( data ) {
         var widgets = [];
         findAndAddWidget( widgets, data, '' );
         return widgets;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function findAndAddWidget( widgets, directory, path ) {
         if( directory.hasOwnProperty( WIDGET_JSON ) ) {
            widgets.push( createWidgetEntry( path.slice( 0, -1 ) ) );
         }
         else if( typeof( directory ) === 'object' ) {
            ng.forEach( directory, function( property, propertyName ) {
               findAndAddWidget( widgets, property, path + propertyName + '/' );
            } );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function createWidgetEntry( widgetPath ) {
         var widgetName = widgetPath.substring( widgetPath.lastIndexOf( '/' ) + 1 );
         var widgetUrl;
         if( !$scope.model.applicationUrl ) {
            widgetUrl = widgetPath;
         }
         else {
            widgetUrl = $scope.model.applicationUrl + widgetPath;
         }
         return {
            name: widgetName,
            specification: widgetUrl + '/' + WIDGET_JSON
         };
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function sortWidgets( widgets ) {
         widgets.sort( function( widgetA, widgetB ) {
            return strCompare( widgetA.name, widgetB.name );
         } );

         function strCompare( a, b ) {
            return a < b ? -1 : ( a > b ? 1 : 0 );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function applicationUrl() {
         var url = ax.object.path(
               $scope.resources,
               'fileListing.applicationUrl',
               $scope.features.fileListing.applicationUrl ) || '';
         if( url.length && url.charAt( url.length - 1 ) !== '/' ) {
            return url + '/';
         }
         return url;
      }

   }

   module.controller( 'AxWidgetListingActivityController', Controller );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );
