/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

import * as ng from 'angular';
import * as ax from 'laxar';
import * as patterns from 'laxar-patterns';

Controller.$inject = [ '$scope' ];

function Controller( $scope ) {
   $scope.resources = {
      widget: null,
      package: null
   };

   $scope.model = {};

   $scope.display = { expanded: { } };

   patterns.resources.handlerFor( $scope ).registerResourceFromFeature( 'widget', {
      onUpdateReplace: [ updateWidgetModel, updateModel, createDependenciesList ]
   } );

   if( $scope.features.package.resource ) {
      patterns.resources.handlerFor( $scope ).registerResourceFromFeature( 'package', {
         onUpdateReplace: [ updatePackageModel, updateModel, createDependenciesList ]
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function updateWidgetModel() {
      if( !$scope.resources.widget ){
         $scope.model.widget = {};
         return;
      }

      $scope.model.widget = ax.object.deepClone( $scope.resources.widget );
      if( ax.object.path( $scope.resources, 'widget.features.$schema', false ) ) {
         $scope.model.widget.features = $scope.resources.widget.features;
      }
      else {
         $scope.model.widget.features = {};
         $scope.model.widget.features.properties = ax.object.deepClone( $scope.resources.widget.features );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function updatePackageModel() {
      if( !$scope.resources.package ){
         $scope.model.package = {};
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function updateModel() {
      if( !$scope.resources.widget && !$scope.resources.package ) {
         $scope.model = {};
         return;
      }
      $scope.model.version = ax.object.path( $scope.resources, 'package.version' );
      if( $scope.model.version === undefined ) {
         $scope.model.version = ax.object.path( $scope.resources, 'widget.version.spec', 'Unspecified');
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createDependenciesList() {
      if( $scope.resources.package === null || $scope.resources.package.dependencies === undefined ) {
         $scope.model.dependencies = false;
         return;
      }
      $scope.model.dependencies = [];
      ng.forEach( $scope.resources.package.dependencies, ( version, library ) => {
         const dependence = {
            axLibrary: library,
            axVersion: version
         };
         const hashPos = version.search( '#' );
         if( hashPos !== -1 ) {
            dependence.axVersion = version.substring( hashPos + 1 );
         }
         $scope.model.dependencies.push( dependence );
      } );
   }

}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const name = ng.module( 'widgetInformationWidget', [] )
   .controller( 'WidgetInformationWidgetController', Controller ).name;
