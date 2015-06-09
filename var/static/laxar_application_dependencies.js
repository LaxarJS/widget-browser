define( [
   'laxar-uikit/controls/i18n/ax-i18n-control',
   'laxar-application/includes/widgets/widget-browser/ax-widget-listing-activity/ax-widget-listing-activity',
   'laxar-application/includes/widgets/laxarjs/ax-messages-widget/ax-messages-widget',
   'laxar-application/includes/widgets/widget-browser/ax-widget-browser-widget/ax-widget-browser-widget',
   'laxar-application/includes/widgets/laxarjs/ax-markdown-display-widget/ax-markdown-display-widget',
   'laxar-application/includes/widgets/widget-browser/ax-artifact-repository-link-widget/ax-artifact-repository-link-widget',
   'laxar-application/includes/widgets/widget-browser/ax-widget-information-widget/ax-widget-information-widget',
   'laxar-application/includes/widgets/laxarjs/ax-media-widget/ax-media-widget'
], function() {
   'use strict';

   var modules = [].slice.call( arguments );
   return {
      'angular': modules.slice( 0, 8 )
   };
} );
