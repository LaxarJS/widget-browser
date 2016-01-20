/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'angular',
   'laxar',
   'laxar-patterns',
   './iframe-resize-directive',
   './iframe-integration-directive'
], function( ng, ax, patterns, iframeResizeDirective, iframeIntegrationDirective ) {
   'use strict';

   var moduleName = 'axMediaWidget';
   var module     = ng.module( moduleName, [] );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var CLASS_SIZE_TO_CONTENT = 'ax-local-size-to-content';
   var CLASS_SIZE_TO_CONTAINER = 'ax-local-size-to-container';

   var TYPE_FALLBACK = 'fallback';
   var TYPE_IMAGE = 'image';
   var TYPE_WEBSITE = 'website';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function parseUrl( url ) {
      // For MSIE <= 8: We cannot simply createElement('a')
      var div = document.createElement( 'div' );
      div.innerHTML = '<a></a>';
      div.firstChild.href = url;

      // For MSIE <= 8: force re-parsing URL
      // noinspection SillyAssignmentJS
      div.innerHTML = div.innerHTML;

      return div.firstChild;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function isSameOrigin( url ) {
      var frameLoc = parseUrl( url );
      var loc = window.location;

      // For MSIE <= 8: handle local paths correctly
      var isLocal = frameLoc.hostname === '' && frameLoc.port === '';
      return isLocal || (
         frameLoc.hostname === loc.hostname &&
         frameLoc.port === loc.port &&
         frameLoc.protocol === loc.protocol );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Controller.$inject = [ '$scope', '$sce' ];

   function Controller( $scope, $sce ) {
      var localize = patterns.i18n.handlerFor( $scope ).scopeLocaleFromFeature( 'i18n', {
         onChange: updateLocalization
      } ).localizer();

      var showMedia = true;
      var onActions = $scope.features.medium.onActions;
      if( onActions ) {
         // DEPRECATION: remove backwards-compatibility (string value) in an upcoming major release
         if( typeof onActions === 'string' ) {
            onActions = [ onActions ];
         }
         showMedia = !onActions.length;
         onActions.forEach( function( action ) {
            $scope.eventBus.subscribe( 'takeActionRequest.' + action, function handleTakeActionRequest() {
               showMedia = true;
               updateModel();
            } );
         } );
      }

      $scope.resources = {};
      $scope.model = {
         mediaType: null,
         showTitle: false,
         showCaption: false,
         isSameOrigin: false,
         layoutClass: CLASS_SIZE_TO_CONTAINER,
         integration: $scope.features.integration || { name: '' },
         fallback: {
            i18nHtmlText: $scope.features.fallback.i18nHtmlText
         }
      };

      patterns.resources.handlerFor( $scope ).registerResourceFromFeature( 'medium', {
         onUpdateReplace: [ updateLocalization, updateModel ]
      } );


      ///////////////////////////////////////////////////////////////////////////////////////////////////////////

      function updateLocalization() {
         var medium = $scope.resources.medium;
         if( !medium || !showMedia ) {
            return;
         }
         if( medium.i18nName ) {
            medium.name = localize( medium.i18nName );
         }
         if( medium.i18nDescription ) {
            medium.description = localize( medium.i18nDescription );
         }
      }

      ///////////////////////////////////////////////////////////////////////////////////////////////////////////

      function updateModel() {
         var medium = $scope.resources.medium;
         if( !medium || !showMedia ) {
            return;
         }

         if( !(medium.mimeType in mediaTypeByMimeType) ) {
            ax.log.warn( 'AxMediaWidget: Unsupported mimeType: [0]', medium.mimeType );
         }

         var model = $scope.model;

         // feature: medium
         model.mediaType = mediaTypeByMimeType[ medium.mimeType ];
         model.showTitle = !!$scope.features.medium.showTitle && !!medium.name;
         model.showCaption = !!$scope.features.medium.showCaption && !!medium.description;

         // feature: layout
         var sizeToContentRequested = $scope.features.layout && $scope.features.layout.sizeToContent;
         var isImage = model.mediaType === TYPE_IMAGE;
         var isPdf = medium.mimeType === 'application/pdf';
         var sameOrigin = isSameOrigin( medium.location );
         var hasExplicitSize = medium.mediaInformation &&
                               medium.mediaInformation.pixelHeight !== null &&
                               medium.mediaInformation.pixelWidth !== null;

         var canBeMeasured = isImage;
         var problems = '';
         if( model.mediaType === TYPE_WEBSITE ) {
            canBeMeasured = sameOrigin;
            if( !sameOrigin ) {
               problems += '- Content is cross-domain.\n';
            }
            if( isPdf ) {
               canBeMeasured = false;
               problems += '- PDF-Content cannot be measured.\n';
            }
         }
         if( sizeToContentRequested && !canBeMeasured && !hasExplicitSize ) {
            problems += '- mediaInformation is missing';
            var message =
               'AxMediaWidget "[0]" cannot use sizeToContent: ' + problems;
            ax.log.warn( message, $scope.id() );
         }

         if( isPdf ) {
            var platform = navigator.platform;
            if( platform === 'iPad' || platform === 'iPhone' || platform === 'iPod' ) {
               // There is no way to display a PDF of unknown height using an iframe on iOS (no scrolling).
               model.mediaType = TYPE_FALLBACK;
            }
         }

         model.layoutClass = ( sizeToContentRequested && (canBeMeasured || hasExplicitSize) ) ?
            CLASS_SIZE_TO_CONTENT :
            CLASS_SIZE_TO_CONTAINER;

         model.canBeMeasured = canBeMeasured;
         model.isSameOrigin = sameOrigin;

         // We trust every kind of urls from the resource
         if( typeof medium.location === 'string' ) {
            medium.location = $sce.trustAsResourceUrl( medium.location );
         }
      }

      var mediaTypeByMimeType = {
         'image/png': TYPE_IMAGE,
         'image/jpeg': TYPE_IMAGE,
         'image/gif': TYPE_IMAGE,
         'application/xhtml+xml': TYPE_WEBSITE,
         'text/html': TYPE_WEBSITE,
         'application/pdf': TYPE_WEBSITE
      };
   }

   module.controller( 'AxMediaWidgetController', Controller );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   // because of duplicate requests of IE in iframes. ngSrc is not working correctly here.
   // See https://github.com/angular/angular.js/issues/9843
   var axMediaSrcDirective = 'axMediaSrc';
   module.directive( axMediaSrcDirective, function() {
      return {
         priority: 99,
         restrict: 'A',
         link: function( scope, element, attr ) {
            attr.$observe( axMediaSrcDirective, function( value ) {
               if( value ) {
                  attr.$set( 'src', value );
               }
            } );
         }
      };
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   iframeResizeDirective.define( module );
   iframeIntegrationDirective.define( module );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return module;

} );
