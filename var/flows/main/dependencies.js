define( [
   'laxar-uikit/controls/i18n/ax-i18n-control',
   'laxar-developer-tools-widget/ax-developer-tools-widget',
   'laxar-markdown-display-widget/ax-markdown-display-widget',
   'laxar-media-widget/ax-media-widget',
   'laxar-messages-widget/ax-messages-widget',
   'laxar-application/includes/widgets/widget-browser/ax-artifact-repository-link-widget/ax-artifact-repository-link-widget',
   'laxar-application/includes/widgets/widget-browser/ax-widget-browser-widget/ax-widget-browser-widget',
   'laxar-application/includes/widgets/widget-browser/ax-widget-information-widget/ax-widget-information-widget',
   'laxar-application/includes/widgets/widget-browser/ax-widget-listing-activity/ax-widget-listing-activity'
], function() {
   'use strict';

   var modules = [].slice.call( arguments );
   return {
      'angular': modules.slice( 0, 9 )
   };
} );
