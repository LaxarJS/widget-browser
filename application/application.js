// See https://github.com/LaxarJS/laxar/blob/master/docs/manuals/configuration.md
window.laxar = ( function() {
   'use strict';

   var modeAttribute = 'data-ax-application-mode';
   var mode = document.querySelector( 'script[' + modeAttribute + ']' ).getAttribute( modeAttribute );

   return {
      name: 'Widget Browser',
      description: 'List widgets from an other product.',

      theme: 'cube',
      useMergedCss: mode === 'RELEASE',


      fileListings: {
         'application': 'var/listing/application_resources.json',
         'bower_components': 'var/listing/bower_components_resources.json',
         'includes': 'var/listing/includes_resources.json'
      },
      useEmbeddedFileListings: mode === 'RELEASE',


      i18n: {
         locales: {
            'default': 'en'
         }
      }

   };

} )();
