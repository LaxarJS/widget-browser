/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

import { module } from 'angular';
import 'angular-sanitize';
import { resources } from 'laxar-patterns';

Controller.$inject = [ '$scope', '$sce' ];

function Controller( $scope, $sce ) {
   $scope.resources = {
      display: null
   };
   $scope.model = {
      url: ''
   };
   resources.handlerFor( $scope ).registerResourceFromFeature( 'display', () => {
      if( $scope.resources.display && $scope.resources.display.repository ) {
         $scope.model.url = stripGitFromUrl( $scope.resources.display.repository );
      }

      if( typeof $scope.model.url === 'string' ) {
         $scope.model.url = $sce.trustAsHtml( $scope.model.url );
      }
      else {
         $scope.model.url = '';
      }
   } );

   function stripGitFromUrl( repository ) {
      if( repository === undefined || typeof ( repository.url ) !== 'string' ) {
         return '';
      }
      if( repository.type !== 'git' ) {
         return repository.url;
      }
      return repository.url.replace(/(^git\+)|(\.git$)/g, '');
   }
}

export const name = module( 'artifactRepositoryLinkWidget', [ 'ngSanitize' ] )
   .controller( 'ArtifactRepositoryLinkWidgetController', Controller ).name;
