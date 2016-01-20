/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'angular',
   'jquery',
   'laxar',
   'laxar-patterns',
   'marked/lib/marked',
   'URIjs/src/URI'
], function( ng, $, ax, patterns, marked, URI ) {
   'use strict';

   var moduleName = 'axMarkdownDisplayWidget';
   var module = ng.module( moduleName, [] );

   var MARKDOWN_DISPLAY_SCROLL = 'markdownDisplayScroll';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Controller.$inject = ['$scope', '$http', '$sce', 'axFlowService' ];

   function Controller( $scope, $http, $sce, flowService ) {
      var publishError = patterns.errors.errorPublisherForFeature( $scope, 'messages', {
         localizer: patterns.i18n.handlerFor( $scope ).scopeLocaleFromFeature( 'i18n' ).localizer()
      } );
      var defaultRenderer = new marked.Renderer();
      var renderer = new marked.Renderer();
      renderer.image = renderImage;
      renderer.link = renderLink;

      $scope.eventBus.subscribe( 'didNavigate.' + '_self', function( event ) {
         var path = 'data.' + $scope.features.markdown.parameter;
         $scope.model.anchor = ax.object.path( event, path, '' );
         $scope.$emit( MARKDOWN_DISPLAY_SCROLL );
      } );

      $scope.model = {
         html: ''
      };

      $scope.resources = {};

      loadMarkdown();

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      if( $scope.features.markdown.resource ) {
         patterns.resources.handlerFor( $scope )
            .registerResourceFromFeature( 'markdown', {
               onUpdateReplace: loadMarkdown
            } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      $scope.navigate = function( id ) {
         if( id !== $scope.model.anchor ) {
            $scope.eventBus.publish( 'navigateRequest._self', {
               target: '_self',
               data: {
                  anchor: id
               }
            } );
         }
         else {
            $scope.$emit( MARKDOWN_DISPLAY_SCROLL );
         }
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function loadMarkdown() {
         $scope.model.html = '';
         if( $scope.resources.markdown ) {
            if( $scope.features.markdown.attribute ) {
               var markdown = ax.object.path( $scope.resources.markdown, $scope.features.markdown.attribute );
               if( typeof( markdown ) === 'string' ) {
                  $scope.model.html =  markdownToHtml( markdown );
               }
               else {
                  ax.log.warn( 'No markdown content available' );
               }
            }
            else {
               var location =  ax.object.path( $scope.resources.markdown, '_links.markdown.href', null );
               if( location ) {
                  loadMarkdownFromUrl( location );
               }
               else {
                  ax.log.warn( 'No content URL available' );
               }
            }
         }
         else if( $scope.features.markdown.url ) {
            loadMarkdownFromUrl( $scope.features.markdown.url );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function loadMarkdownFromUrl( location ) {
         $http.get( location )
            .success( function( data ) {
               $scope.model.html =  markdownToHtml( data );
            } )
            .error( function( data, status, headers ) {
               publishError( 'HTTP_GET', 'i18nFailedLoadingResource', {
                  url: location
               }, {
                  data: data,
                  status: status,
                  headers: headers
               } );
            } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function markdownToHtml( mdText ) {
         return $sce.trustAsHtml( marked( mdText, {
            renderer: renderer,
            sanitize: true,
            headerPrefix: $scope.id( '' )
         } ) );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function renderImage( href, title, text ) {
         var uri = new URI( href );
         if( uri.is( 'absolute' ) || uri.scheme() !== '' ) {
            return defaultRenderer.image( href, title, text );
         }
         else {
            var markdownSourceUrl = markdownUrl();
            if( !markdownSourceUrl ) {
               return defaultRenderer.image( uri.unicode(), title, text );
            }
            return defaultRenderer.image( uri.unicode().absoluteTo( markdownSourceUrl ), title, text );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function renderLink( href, title, text ) {
         var uri = new URI( href );
         if( uri.is( 'absolute' ) || uri.scheme() !== '' ) {
            return defaultRenderer.link( href, title, text );
         }
         else {
            if( href.charAt( 0 ) === '#' && uri.fragment() !== '' ) {
               var placeParameters = {};
               placeParameters[ $scope.features.markdown.parameter ] = $scope.id( uri.fragment() );
               var anchorHref = flowService.constructAbsoluteUrl( '_self', placeParameters );
               return '<a href="' + anchorHref + '">' + text + '</a>';
            }
            else {
               var markdownSourceUrl = markdownUrl();
               if( !markdownSourceUrl ) {
                  return defaultRenderer.link( uri.unicode(), title, text );
               }
               return defaultRenderer.link( uri.unicode().absoluteTo( markdownSourceUrl ), title, text );
            }
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function markdownUrl(){
         return ax.object.path( $scope.resources.markdown, '_links.markdown.href', $scope.features.markdown.url );
      }
   }

   module.controller( 'AxMarkdownDisplayWidgetController', Controller );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   module.directive( 'axMarkdownDisplayHtml', [ '$compile', '$sce', function( $compile, $sce ) {
      return {
         restrict: 'A',
         replace: true,
         link: function( scope, element, attrs ) {

            scope.$watch( attrs.axMarkdownDisplayHtml, function( html ) {
               element.html( $sce.getTrustedHtml( html ) );
               $compile( element.contents() )( scope );
               scrollToAnchor( scope.model.anchor );
            } );
            scope.$on( MARKDOWN_DISPLAY_SCROLL, function() {
               scrollToAnchor( scope.model.anchor );
            } );
            scope.$watch( 'model.anchor', function( id ) {
               scrollToAnchor( id );
            } );

            function scrollToAnchor( id ) {
               if( !id ) { return; }
               var offset = $( '#' + id ).offset();
               if( offset ) {
                  window.scrollTo( offset.left, offset.top );
               }
            }
         }
      };
   } ] );

   return module;

} );
