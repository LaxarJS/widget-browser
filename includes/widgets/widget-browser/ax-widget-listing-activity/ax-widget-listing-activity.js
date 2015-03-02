/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'angular',
   'laxar',
   'laxar_patterns'
], function( ng, ax, patterns ) {
   'use strict';

   var moduleName = 'axWidgetListingActivity';
   var module     = ng.module( moduleName, [] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var WIDGET_JSON = 'widget.json';

   Controller.$inject = [ '$scope', '$http', '$q' ];

   function Controller( $scope, $http, $q ) {
      var applicationUrl = ax.object.path( $scope, 'features.fileListing.applicationUrl', '' );
      $scope.resources = {};
      $scope.model = {
         widgets: []
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
            return applicationUrl + url;
         } );
         getWidgetList( urls );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function onUpdateReplace() {
         applicationUrl = ax.object.path( $scope, 'resources.fileListing.applicationUrl', '' );
         var url = applicationUrl + $scope.resources.fileListing.fileListingPath;
         getWidgetList( [ url ] );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function getWidgetList( urls ) {
         var promises = [];
         var widgets = [];
         urls.forEach( function( url ) {
            promises.push( $http.get( url )
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
            } )
            .then( null, function( e ) {
               $scope.eventBus.publish( 'didValidate.' + $scope.features.widgetListing.resource, {
                  resource: $scope.features.widgetListing.resource,
                  outcome: 'ERROR',
                  data: [ {
                     htmlMessage: e.message,
                     level: 'ERROR'
                  } ]
               } );
               ax.log.error( '[0]. Error: [1:%o]', e.message, e.error );
            } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function findWidgets( data ) {
         var widgets = [];
         findAndAddWidget( widgets, data, '' );
         return widgets;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function findAndAddWidget( widgets, obj, path ) {
         if( obj.hasOwnProperty( WIDGET_JSON ) ) {
            widgets.push( createWidgetEntry( path ) );
         }
         else {
            if( typeof( obj ) === 'object' ) {
               ng.forEach( obj, function( property, propertyName ) {
                  findAndAddWidget( widgets, property, path + '/' + propertyName );
               } );
            }
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function createWidgetEntry( widgetPath ) {
         var widgetName = widgetPath.substring( widgetPath.lastIndexOf( '/' ) + 1 );
         var fullWidgetUrl = urlWithoutTrailingSlash( applicationUrl ) + widgetPath;
         return {
            name: widgetName,
            specification: fullWidgetUrl + '/' + WIDGET_JSON
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

      function urlWithoutTrailingSlash( urlWithSlash ) {
         return urlWithSlash.replace( /\/$/, '' );
      }

   }

   module.controller( 'AxWidgetListingActivityController', Controller );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );
