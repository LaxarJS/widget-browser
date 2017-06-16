/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'angular',
   'laxar',
   'laxar-patterns'
], function( ng, ax, patterns, undefined ) {
   'use strict';

   var moduleName = 'axWidgetInformationWidget';
   var module     = ng.module( moduleName, [] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

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

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

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

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function updatePackageModel() {
         if( !$scope.resources.package ){
            $scope.model.package = {};
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

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

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function createDependenciesList() {
         if( $scope.resources.package === null || $scope.resources.package.dependencies === undefined ) {
            $scope.model.dependencies = false;
            return;
         }
         $scope.model.dependencies = [];
         ng.forEach( $scope.resources.package.dependencies, function( version, library ) {
            var dependence =  {
               axLibrary: library,
               axVersion: version
            };
            var hashPos = version.search( '#' );
            if( hashPos !== -1 ) {
               dependence.axVersion = version.substring( hashPos + 1 );
            }
            $scope.model.dependencies.push( dependence );
         } );
      }

   }

   module.controller( 'AxWidgetInformationWidgetController', Controller );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );
