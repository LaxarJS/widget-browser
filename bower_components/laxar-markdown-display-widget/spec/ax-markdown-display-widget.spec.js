/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'json!../widget.json',
   'laxar-mocks',
   'angular-mocks',
   'laxar'
], function( descriptor, axMocks, ngMocks, ax ) {
   'use strict';

   describe( 'An ax-markdown-display-widget', function() {
      var widgetEventBus;
      var widgetScope;
      var testEventBus;
      var MARKDOWN_DISPLAY_SCROLL = 'markdownDisplayScroll';
      var $httpBackend;
      var $sce;
      var flowService;

      ///////////////////////////////////////////////////////////////////////////////////////////////////////////

      function createSetup( widgetConfiguration ) {

         beforeEach( axMocks.createSetupForWidget( descriptor, {
            knownMissingResources: [ 'ax-button-list-control.css' ]
         } ) );

         beforeEach( function() {
            axMocks.widget.configure( widgetConfiguration );
         } );

         beforeEach( axMocks.widget.load );

         beforeEach( function() {
            ngMocks.inject( function( $injector ) {
               $httpBackend = $injector.get( '$httpBackend' );
               $sce = $injector.get( '$sce' );
            } );
            $sce.trustAsHtml =  function( html ) { return html; };

            ngMocks.inject( function( axFlowService ) {
               flowService = axFlowService;
            } );
            flowService.constructAbsoluteUrl = function( place, optionalParameters ) {
                        return 'http://localhost:8000/index.html#/widgetBrowser/' +
                               optionalParameters[ widgetScope.features.markdown.parameter ];
            };
         } );

         beforeEach( function() {
            widgetScope = axMocks.widget.$scope;
            widgetEventBus = axMocks.widget.axEventBus;
            testEventBus = axMocks.eventBus;
            spyOn( ax.log, 'warn' );
         } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      afterEach( function() {
         $httpBackend.verifyNoOutstandingExpectation();
         $httpBackend.verifyNoOutstandingRequest();
         axMocks.tearDown();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the site is entered through a bookmark with a parameter which refers to a section', function() {

         createSetup( {
            markdown: {
               parameter: 'anchor',
               resource: 'markdownResource',
               attribute: 'markdown'
            }
         } );

         beforeEach( function() {
            spyOn( widgetScope, '$emit' );
            testEventBus.publish( 'didNavigate._self', {
               data: {
                  anchor: 'references'
               }
            } );
            testEventBus.flush();
            testEventBus.publish( 'didReplace.markdownResource', {
               resource: 'markdownResource',
               data: {
                  'markdown': '## References*'
               }
            } );
            testEventBus.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'scrolls to the bookmarked section (R1.1)', function() {
            expect( widgetScope.$emit ).toHaveBeenCalledWith( MARKDOWN_DISPLAY_SCROLL );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured URL which refers to a Markdown-formatted text', function() {

         describe( 'with the url "test.md"', function() {

            createSetup( {
               markdown: {
                  parameter: 'anchor',
                  url: 'test.md'
               }
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'reads the file referenced by the URL via HTTP GET (R1.2)', function() {
               $httpBackend.expectGET( 'test.md' ).respond( 200, 'markdown text' );
               $httpBackend.flush();
               expect( widgetScope.model.html ).toMatch( 'markdown text' );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'if the file is not found', function() {

               it( 'publishes an error message', function() {
                  $httpBackend.expectGET( 'test.md' ).respond( 404, {value: 'Not Found'} );
                  $httpBackend.flush();
                  expect( widgetEventBus.publish ).toHaveBeenCalledWith(
                     'didEncounterError.HTTP_GET',
                     jasmine.any( Object ),
                     jasmine.any( Object )
                  );
               } );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'converts the markdown file content to HTML (R1.6)', function() {
               $httpBackend.expectGET( 'test.md' ).respond( 200, '*Emphasized*' );
               $httpBackend.flush();
               expect( widgetScope.model.html ).toMatch( /<em>Emphasized<\/em>/ );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'with the url "http://laxarjs.org/A/B/test.md"', function() {

            createSetup( {
               markdown: {
                  parameter: 'anchor',
                  url: 'http://laxarjs.org/A/B/test.md'
               }
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'resolves images with relative paths (R1.7)', function() {
               var mdText = '';
               mdText += '![Image 1](http://my.example.org/docs/images/image1.png)';
               mdText += '![Image 2](//my.example.org/docs/images/image2.png)';
               mdText += '![Image 3](file:///docs/images/image3.png)';
               mdText += '![Image 4](/docs/images/image4.png)';
               mdText += '![Image 5](docs/images/image5.png)';
               mdText += '![Image 6](./docs/images/image6.png)';
               mdText += '![Image 7](../docs/images/image7.png)';
               $httpBackend.expectGET( 'http://laxarjs.org/A/B/test.md' ).respond( 200, mdText );

               $httpBackend.flush();
               expect( widgetScope.model.html ).toMatch( '<img[^>]*\\s+src="http://my.example.org/docs/images/image1.png"[^>]*>' );
               expect( widgetScope.model.html ).toMatch( '<img[^>]*\\s+src="//my.example.org/docs/images/image2.png"[^>]*>' );
               expect( widgetScope.model.html ).toMatch( '<img[^>]*\\s+src="file:///docs/images/image3.png"[^>]*>' );
               expect( widgetScope.model.html ).toMatch( '<img[^>]*\\s+src="http://laxarjs.org/docs/images/image4.png"[^>]*>' );
               expect( widgetScope.model.html ).toMatch( '<img[^>]*\\s+src="http://laxarjs.org/A/B/docs/images/image5.png"[^>]*>' );
               expect( widgetScope.model.html ).toMatch( '<img[^>]*\\s+src="http://laxarjs.org/A/B/docs/images/image6.png"[^>]*>' );
               expect( widgetScope.model.html ).toMatch( '<img[^>]*\\s+src="http://laxarjs.org/A/docs/images/image7.png"[^>]*>|<img[^>]*\\s+src="http://laxarjs.org/A/B/../docs/images/image7.png"[^>]*>' );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'resolves hyperlinks with relative paths (R1.8)', function() {
               var mdText = '';
               mdText += '[Link 1](http://my.example.org/docs/pages/link1.html)';
               mdText += '[Link 2](//my.example.org/docs/pages/link2.html)';
               mdText += '[Link 3](file:///docs/pages/link3.html)';
               mdText += '[Link 4](/docs/pages/link4.html)';
               mdText += '[Link 5](docs/pages/link5.html)';
               mdText += '[Link 6](./docs/pages/link6.html)';
               mdText += '[Link 7](../docs/pages/link7.html)';
               mdText += '[Link 8](../docs/pages/link8.html#chapter)';
               $httpBackend.expectGET( 'http://laxarjs.org/A/B/test.md' ).respond( 200, mdText );

               $httpBackend.flush();
               expect( widgetScope.model.html ).toMatch( '<a[^>]*\\s+href="http://my.example.org/docs/pages/link1.html"[^>]*>' );
               expect( widgetScope.model.html ).toMatch( '<a[^>]*\\s+href="//my.example.org/docs/pages/link2.html"[^>]*>' );
               expect( widgetScope.model.html ).toMatch( '<a[^>]*\\s+href="file:///docs/pages/link3.html"[^>]*>' );
               expect( widgetScope.model.html ).toMatch( '<a[^>]*\\s+href="http://laxarjs.org/docs/pages/link4.html"[^>]*>' );
               expect( widgetScope.model.html ).toMatch( '<a[^>]*\\s+href="http://laxarjs.org/A/B/docs/pages/link5.html"[^>]*>' );
               expect( widgetScope.model.html ).toMatch( '<a[^>]*\\s+href="http://laxarjs.org/A/B/docs/pages/link6.html"[^>]*>' );
               expect( widgetScope.model.html ).toMatch( '<a[^>]*\\s+href="http://laxarjs.org/A/docs/pages/link7.html"[^>]*>|<a[^>]*\\s+href="http://laxarjs.org/A/B/../docs/pages/link7.html"[^>]*>' );
               expect( widgetScope.model.html ).toMatch( '<a[^>]*\\s+href="http://laxarjs.org/A/docs/pages/link8.html#chapter"[^>]*>|<a[^>]*\\s+href="http://laxarjs.org/A/B/../docs/pages/link8.html#chapter"[^>]*>' );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'resolves links to anchors of headings (R1.9)', function() {
               var mdText = '';
               mdText += '# Heading\n';
               mdText += '## Second Heading\n';
               mdText += '### Dritte Überschrift: Straße\n';
               mdText += '[Second Heading](#second-heading)\n';
               $httpBackend.expectGET( 'http://laxarjs.org/A/B/test.md' ).respond( 200, mdText );

               $httpBackend.flush();
               expect( widgetScope.model.html )
                  .toMatch( '<h1[^>]*\\s+id="' + widgetScope.id( 'heading' ) + '"[^>]*>' );
               expect( widgetScope.model.html )
                  .toMatch( '<h2[^>]*\\s+id="' + widgetScope.id( 'second-heading' ) + '"[^>]*>' );
               expect( widgetScope.model.html )
                  .toMatch( '<h3[^>]*\\s+id="' + widgetScope.id( 'dritte-berschrift-stra-e' ) + '"[^>]*>' );

               var linkUrl = 'http://localhost:8000/index.html#/widgetBrowser/' + widgetScope.id( 'second-heading' );
               expect( widgetScope.model.html )
                  .toMatch( '<a[^>]*\\s+href="' + linkUrl + '"[^>]*>Second Heading</a>' );
            } );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured feature \'markdown\' and attribute \'resource\' when \'attribute\' is set to a non-empty string', function() {

         createSetup( {
            markdown: {
               parameter: 'anchor',
               resource: 'markdownResource',
               attribute: 'markdown'
            }
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'uses a markdown resource and is listening to didReplace event (R1.3)', function() {
            expect( widgetEventBus.subscribe )
               .toHaveBeenCalledWith( 'didReplace.markdownResource', jasmine.any( Function ) );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'uses a markdown resource and is listening to didUpdate event (R1.3)', function() {
            expect( widgetEventBus.subscribe )
               .toHaveBeenCalledWith( 'didUpdate.markdownResource', jasmine.any( Function ) );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'logs a warning if we do not have a string as markdown (R1.5)', function() {
            testEventBus.publish( 'didReplace.markdownResource', {
               resource: 'markdownResource',
               data: {
                  markdown: []
               }
            } );

            testEventBus.flush();
            expect( ax.log.warn ).toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'logs a warning if we do not have the specified attribute (R1.5)', function() {
            testEventBus.publish( 'didReplace.markdownResource', {
               resource: 'markdownResource',
               data: {
                  'wrong-attribute': '*Emphasized*'
               }
            } );

            testEventBus.flush();
            expect( ax.log.warn ).toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does not log a warning before the resource is received', function() {
            expect( ax.log.warn ).not.toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'converts the markdown resource content to HTML (R1.6)', function() {
            testEventBus.publish( 'didReplace.markdownResource', {
               resource: 'markdownResource',
               data: {
                  markdown: '*Emphasized*'
               }
            } );

            testEventBus.flush();
            expect( widgetScope.model.html ).toMatch( /<em>Emphasized<\/em>/ );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'resolves links to anchors of headings (R1.9)', function() {
            var mdText = '';
            mdText += '# Heading\n';
            mdText += '## Second Heading\n';
            mdText += '### Dritte Überschrift: Straße\n';
            mdText += '[Second Heading](#second-heading)\n';

            testEventBus.publish( 'didReplace.markdownResource', {
               resource: 'markdownResource',
               data: {
                  markdown: mdText
               }
            } );

            testEventBus.flush();

            expect( widgetScope.model.html )
               .toMatch( '<h1[^>]*\\s+id="' + widgetScope.id( 'heading' ) + '"[^>]*>' );
            expect( widgetScope.model.html )
               .toMatch( '<h2[^>]*\\s+id="' + widgetScope.id( 'second-heading' ) + '"[^>]*>' );
            expect( widgetScope.model.html )
               .toMatch( '<h3[^>]*\\s+id="' + widgetScope.id( 'dritte-berschrift-stra-e' ) + '"[^>]*>' );

            var linkUrl = 'http://localhost:8000/index.html#/widgetBrowser/' + widgetScope.id( 'second-heading' );
            expect( widgetScope.model.html )
               .toMatch( '<a[^>]*\\s+href="' + linkUrl + '"[^>]*>Second Heading</a>' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured feature \'markdown\' and attribute \'resource\' when \'attribute\' is not set', function() {

         createSetup( {
            markdown: {
               parameter: 'anchor',
               resource: 'markdownResource'
            }
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'uses a markdown resource and is listening to didReplace event (R1.4)', function() {
            expect( widgetEventBus.subscribe )
               .toHaveBeenCalledWith( 'didReplace.markdownResource', jasmine.any( Function ) );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'uses a markdown resource and is listening to didUpdate event (R1.4)', function() {
            expect( widgetEventBus.subscribe )
               .toHaveBeenCalledWith( 'didUpdate.markdownResource', jasmine.any( Function ) );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'logs a warning if we do not have a URL (R1.5)', function() {
            testEventBus.publish( 'didReplace.markdownResource', {
               resource: 'markdownResource',
               data: {}
            } );

            testEventBus.flush();
            expect( ax.log.warn ).toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does not log a warning if the resource is null', function() {
            testEventBus.publish( 'didReplace.markdownResource', {
               resource: 'markdownResource',
               data: null
            } );

            testEventBus.flush();
            expect( ax.log.warn ).not.toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'converts the markdown file content to HTML (R1.6)', function() {
            $httpBackend.expectGET( 'test.md' ).respond( '*Emphasized*' );
            testEventBus.publish( 'didReplace.markdownResource', {
               resource: 'markdownResource',
               data: {
                  _links: {
                     markdown: {
                        href: 'test.md'
                     }
                  }
               }
            } );
            testEventBus.flush();
            $httpBackend.flush();
            expect( widgetScope.model.html ).toMatch( /<em>Emphasized<\/em>/ );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'resolves images with relative paths (R1.7)', function() {
            var url = 'http://laxarjs.org/A/B/test.md';
            var mdText = '';
            mdText += '![Image 1](http://my.example.org/docs/images/image1.png)';
            mdText += '![Image 2](//my.example.org/docs/images/image2.png)';
            mdText += '![Image 3](file:///docs/images/image3.png)';
            mdText += '![Image 4](/docs/images/image4.png)';
            mdText += '![Image 5](docs/images/image5.png)';
            mdText += '![Image 6](./docs/images/image6.png)';
            mdText += '![Image 7](../docs/images/image7.png)';
            $httpBackend.expectGET( url ).respond( mdText );
            testEventBus.publish( 'didReplace.markdownResource', {
               resource: 'markdownResource',
               data: {
                  _links: {
                     markdown: {
                        href: url
                     }
                  }
               }
            } );
            testEventBus.flush();
            $httpBackend.flush();

            expect( widgetScope.model.html )
               .toMatch( '<img[^>]*\\s+src="http://my.example.org/docs/images/image1.png"[^>]*>' );
            expect( widgetScope.model.html )
               .toMatch( '<img[^>]*\\s+src="//my.example.org/docs/images/image2.png"[^>]*>' );
            expect( widgetScope.model.html )
               .toMatch( '<img[^>]*\\s+src="file:///docs/images/image3.png"[^>]*>' );
            expect( widgetScope.model.html )
               .toMatch( '<img[^>]*\\s+src="http://laxarjs.org/docs/images/image4.png"[^>]*>' );
            expect( widgetScope.model.html )
               .toMatch( '<img[^>]*\\s+src="http://laxarjs.org/A/B/docs/images/image5.png"[^>]*>' );
            expect( widgetScope.model.html )
               .toMatch( '<img[^>]*\\s+src="http://laxarjs.org/A/B/docs/images/image6.png"[^>]*>' );
            expect( widgetScope.model.html )
               .toMatch( '<img[^>]*\\s+src="http://laxarjs.org/A/docs/images/image7.png"[^>]*>|<img[^>]*\\s+src="http://laxarjs.org/A/B/../docs/images/image7.png"[^>]*>' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'resolves hyperlinks with relative paths (R1.8)', function() {
            var url = 'http://laxarjs.org/A/B/test.md';
            var mdText = '';
            mdText += '[Link 1](http://my.example.org/docs/pages/link1.html)';
            mdText += '[Link 2](//my.example.org/docs/pages/link2.html)';
            mdText += '[Link 3](file:///docs/pages/link3.html)';
            mdText += '[Link 4](/docs/pages/link4.html)';
            mdText += '[Link 5](docs/pages/link5.html)';
            mdText += '[Link 6](./docs/pages/link6.html)';
            mdText += '[Link 7](../docs/pages/link7.html)';
            mdText += '[Link 8](../docs/pages/link8.html#chapter)';
            $httpBackend.expectGET( url ).respond( mdText );
            testEventBus.publish( 'didReplace.markdownResource', {
               resource: 'markdownResource',
               data: {
                  _links: {
                     markdown: {
                        href: url
                     }
                  }
               }
            } );
            testEventBus.flush();
            $httpBackend.flush();

            expect( widgetScope.model.html )
               .toMatch( '<a[^>]*\\s+href="http://my.example.org/docs/pages/link1.html"[^>]*>' );
            expect( widgetScope.model.html )
               .toMatch( '<a[^>]*\\s+href="//my.example.org/docs/pages/link2.html"[^>]*>' );
            expect( widgetScope.model.html )
               .toMatch( '<a[^>]*\\s+href="file:///docs/pages/link3.html"[^>]*>' );
            expect( widgetScope.model.html )
               .toMatch( '<a[^>]*\\s+href="http://laxarjs.org/docs/pages/link4.html"[^>]*>' );
            expect( widgetScope.model.html )
               .toMatch( '<a[^>]*\\s+href="http://laxarjs.org/A/B/docs/pages/link5.html"[^>]*>' );
            expect( widgetScope.model.html )
               .toMatch( '<a[^>]*\\s+href="http://laxarjs.org/A/B/docs/pages/link6.html"[^>]*>' );
            expect( widgetScope.model.html )
               .toMatch( '<a[^>]*\\s+href="http://laxarjs.org/A/docs/pages/link7.html"[^>]*>|<a[^>]*\\s+href="http://laxarjs.org/A/B/../docs/pages/link7.html"[^>]*>' );
            expect( widgetScope.model.html )
               .toMatch( '<a[^>]*\\s+href="http://laxarjs.org/A/docs/pages/link8.html#chapter"[^>]*>|<a[^>]*\\s+href="http://laxarjs.org/A/B/../docs/pages/link8.html#chapter"[^>]*>' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'resolves links to anchors of headings (R1.9)', function() {
            var url = 'http://laxarjs.org/A/B/test.md';
            var mdText = '';
            mdText += '# Heading\n';
            mdText += '## Second Heading\n';
            mdText += '### Dritte Überschrift: Straße\n';
            mdText += '[Second Heading](#second-heading)\n';
            $httpBackend.expectGET( url ).respond( mdText );
            testEventBus.publish( 'didReplace.markdownResource', {
               resource: 'markdownResource',
               data: {
                  _links: {
                     markdown: {
                        href: url
                     }
                  }
               }
            } );
            testEventBus.flush();
            $httpBackend.flush();

            expect( widgetScope.model.html )
               .toMatch( '<h1[^>]*\\s+id="' + widgetScope.id( 'heading' ) + '"[^>]*>' );
            expect( widgetScope.model.html )
               .toMatch( '<h2[^>]*\\s+id="' + widgetScope.id( 'second-heading' ) + '"[^>]*>' );
            expect( widgetScope.model.html )
               .toMatch( '<h3[^>]*\\s+id="' + widgetScope.id( 'dritte-berschrift-stra-e' ) + '"[^>]*>' );

            var linkUrl = 'http://localhost:8000/index.html#/widgetBrowser/' + widgetScope.id( 'second-heading' );
            expect( widgetScope.model.html )
               .toMatch( '<a[^>]*\\s+href="' + linkUrl + '"[^>]*>Second Heading</a>' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a configured feature \'markdown\' with an URL and an resource', function() {

         createSetup(  {
            markdown: {
               parameter: 'anchor',
               url: 'test.md',
               resource: 'markdownResource',
               attribute: 'markdown'
            }
         } );

         beforeEach( function() {
            $httpBackend.expectGET( 'test.md' ).respond( '*Emphasized*' );
            $httpBackend.flush();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'displays the text from the URL until the resource is published (R1.10)', function() {
            expect( widgetScope.model.html ).toMatch( /<em>Emphasized<\/em>/ );
            testEventBus.publish( 'didReplace.markdownResource', {
               resource: 'markdownResource',
               data: {
                  'markdown': 'Text from the *resource*'
               }
            } );
            testEventBus.flush();
            expect( widgetScope.model.html ).toMatch( /Text from the <em>resource<\/em>/ );
         } );
      } );

   } );
} );
