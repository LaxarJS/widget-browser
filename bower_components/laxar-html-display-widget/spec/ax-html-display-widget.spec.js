/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'json!../widget.json',
   'laxar-mocks',
   './fixtures'
], function( descriptor, axMocks, fixtures ) {
   'use strict';

   var widgetEventBus;
   var widgetScope;
   var testEventBus;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createSetup( widgetConfiguration ) {

      beforeEach( axMocks.createSetupForWidget( descriptor, {
         knownMissingResources: [ 'ax-html-display-widget.css', 'ax-i18n-control.css' ]
      } ) );

      beforeEach( function() {
         axMocks.widget.configure( widgetConfiguration );
      } );

      beforeEach( axMocks.widget.load );

      beforeEach( function() {
         widgetScope = axMocks.widget.$scope;
         widgetEventBus = axMocks.widget.axEventBus;
         testEventBus = axMocks.eventBus;
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   afterEach( function() {
      axMocks.tearDown();
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'An AxHtmlDisplayWidget', function() {

      describe( 'when a didReplace event is published for the configured resource', function() {

         createSetup( { content: { resource: 'myResource' } } );

         it( 'replaces its internal model with the published resource (R1.1, R1.3)', function() {
            publishEventAndTick( 'didReplace.myResource', { resource: 'myResource', data: fixtures.data } );
            expect( widgetScope.model.i18nHtmlContent ).toEqual( fixtures.data );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when a didUpdate event is published for the configured resource', function() {

         createSetup( { content: { resource: 'myResource' } } );

         it( 'updates its internal model with the published data (R1.1)', function() {
            publishEventAndTick( 'didReplace.myResource', { resource: 'myResource', data: fixtures.data } );

            publishEventAndTick( 'didUpdate.myResource', fixtures.updateEvent1 );
            expect( widgetScope.model.i18nHtmlContent ).toEqual( fixtures.data1 );

            publishEventAndTick( 'didUpdate.myResource', fixtures.updateEvent2 );
            expect( widgetScope.model.i18nHtmlContent ).toEqual( fixtures.data2 );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when a didChangeLocale event is published', function() {

         createSetup( { content: { resource: 'myResource' } } );

         it( 'uses the published locale to determine the source that should be displayed (R2.1)', function() {
            widgetScope.model.i18nHtmlContent = fixtures.data;

            useLocale( 'en' );
            expect( widgetScope.i18n.locale ).toEqual( 'default' );
            expect( widgetScope.i18n.tags[ 'default' ] ).toEqual( 'en' );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when an attribute path was configured', function() {
         createSetup( {
            content: {
               resource: 'myResource',
               attribute: 'path.to.content'
            }
         } );

         it( 'retrieves the actual HTML content from that path within the published resource (R1.2)', function() {
            publishEventAndTick( 'didReplace.myResource', { resource: 'myResource', data: fixtures.data3 } );
            expect( widgetScope.model.i18nHtmlContent ).toEqual( fixtures.data3.path.to.content );

            publishEventAndTick( 'didUpdate.myResource', { resource: 'myResource', patches: fixtures.patches1 } );
            expect( widgetScope.model.i18nHtmlContent.de ).toEqual( 'Partial' );
            expect( widgetScope.model.i18nHtmlContent.en ).toEqual( 'Partially' );

            publishEventAndTick( 'didUpdate.myResource', { resource: 'myResource', patches: fixtures.patches2 } );
            expect( widgetScope.model.i18nHtmlContent ).toEqual( 'New Text' );

            publishEventAndTick( 'didUpdate.myResource', { resource: 'myResource', patches: fixtures.patches3 } );
            expect( widgetScope.model.i18nHtmlContent ).toEqual( fixtures.patches3[ 0 ].value );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function publishEvent( eventName, eventData ) {
         testEventBus.publish( eventName, eventData );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function publishEventAndTick( eventName, eventData ) {
         publishEvent( eventName, eventData );
         testEventBus.flush();
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function useLocale( languageTag, locale ) {
         locale = locale || 'default';
         testEventBus.publish( 'didChangeLocale.' + locale, {
            locale: locale,
            languageTag: languageTag
         } );
         testEventBus.flush();
      }
   } );
} );
