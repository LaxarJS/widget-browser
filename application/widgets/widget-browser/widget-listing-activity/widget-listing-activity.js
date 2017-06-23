/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

import * as ng from 'angular';
import * as ax from 'laxar';
import * as patterns from 'laxar-patterns';

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

const WIDGET_JSON = 'widget.json';

Controller.$inject = [ '$scope', '$http', '$q', '$sce', 'axLog' ];

function Controller( $scope, $http, $q, $sce, log ) {
   $scope.resources = {};
   $scope.model = {
      widgets: [],
      applicationUrl: applicationUrl()
   };

   const publishResource = $q.defer();
   $scope.eventBus.subscribe( 'beginLifecycleRequest', () => {
      publishResource.resolve();
   } );

   if( $scope.features.fileListing.resource ) {
      patterns.resources.handlerFor( $scope )
         .registerResourceFromFeature( 'fileListing', {
            onUpdateReplace
         } );
   }
   else if( $scope.features.fileListing.list ) {
      const urls = $scope.features.fileListing.list.map( url => {
         return $scope.model.applicationUrl + url;
      } );
      getWidgetList( urls );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function onUpdateReplace() {
      $scope.model.applicationUrl = applicationUrl();
      const url = $scope.model.applicationUrl + $scope.resources.fileListing.fileListingPath;
      getWidgetList( [ url ] );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function getWidgetList( urls ) {
      const promises = [];
      let widgets = [];
      urls.forEach( url => {
         promises.push( $http.get( $sce.trustAsResourceUrl( url ) )
            .then( resp => {
               return resp;
            }, e => {
               return $q.reject( {
                  message: `Failed to load file listing from ${url}`,
                  error: e
               } );
            } ) );
      } );
      promises.push( publishResource.promise );
      $q.all( promises )
         .then( results => {
            results.pop();
            results.forEach( resp => {
               widgets = widgets.concat( findWidgets( resp.data ) );
            } );
            sortWidgets( widgets );
            $scope.eventBus.publish( `didReplace.${$scope.features.widgetListing.resource}`, {
               resource: $scope.features.widgetListing.resource,
               data: {
                  widgets
               }
            } );
         }, e => {
            $scope.eventBus.publish( `didValidate.${$scope.features.widgetListing.resource}`, {
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

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function findWidgets( data ) {
      if( !Array.isArray( data ) ) { return []; }
      return data.map( widget => {
         return createWidgetEntry( widget );
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createWidgetEntry( widgetPath ) {
      const widgetName = widgetPath.substring( widgetPath.lastIndexOf( '/' ) + 1 );
      const widgetUrl = $scope.model.applicationUrl + 'assets/widgets/' + widgetPath;
      console.log($scope.model.applicationUrl)
      return {
         name: widgetName,
         url: widgetUrl,
         specification: `${widgetUrl}/${WIDGET_JSON}`
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function sortWidgets( widgets ) {
      widgets.sort( ( widgetA, widgetB ) => {
         return strCompare( widgetA.name, widgetB.name );
      } );

      function strCompare( a, b ) {
         if( a < b ) {
            return -1;
         }
         if( a > b ) {
            return 1;
         }
         return 0;
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function applicationUrl() {
      const url = ax.object.path(
            $scope.resources,
            'fileListing.applicationUrl',
            $scope.features.fileListing.applicationUrl ) || '';
      if( url.length && url.charAt( url.length - 1 ) !== '/' ) {
         return `${url}/`;
      }
      return url;
   }

}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const name = ng.module( 'widgetListingActivity', [] )
   .controller( 'WidgetListingActivityController', Controller ).name;
