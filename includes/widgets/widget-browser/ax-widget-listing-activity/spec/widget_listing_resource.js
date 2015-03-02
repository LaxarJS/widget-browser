/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( {
   widgetList: {
      widgets: [
         {
            name: 'accordion_widget',
            specification: 'myIncludes/widgets/portal/accordion_widget/widget.json'
         },
         {
            name: 'action_sequence_activity',
            specification: 'myIncludes/widgets/portal/action_sequence_activity/widget.json'
         },
         {
            name: 'command_bar_widget',
            specification: 'myIncludes/widgets/portal/command_bar_widget/widget.json'
         },
         {
            name: 'markdown_display_widget',
            specification: 'myIncludes/widgets/portal/markdown_display_widget/widget.json'
         },
         {
            name: 'media_widget',
            specification: 'myIncludes/widgets/portal/media_widget/widget.json'
         },
         {
            name: 'messages_widget',
            specification: 'myIncludes/widgets/portal/messages_widget/widget.json'
         },
         {
            name: 'widget_information_widget',
            specification: 'myIncludes/widgets/system/widget_information_widget/widget.json'
         }
      ]
   },
   bowerComponentsAndSystemWidgetList: {
      widgets: [
         {
            name: 'accordion_widget',
            specification: 'bower_components/accordion_widget/widget.json'
         },
         {
            name: 'action_sequence_activity',
            specification: 'bower_components/action_sequence_activity/widget.json'
         },
         {
            name: 'command_bar_widget',
            specification: 'bower_components/command_bar_widget/widget.json'
         },
         {
            name: 'markdown_display_widget',
            specification: 'bower_components/markdown_display_widget/widget.json'
         },
         {
            name: 'media_widget',
            specification: 'bower_components/media_widget/widget.json'
         },
         {
            name: 'messages_widget',
            specification: 'bower_components/messages_widget/widget.json'
         },
         {
            name: 'widget_information_widget',
            specification: 'includes/widgets/system/widget_information_widget/widget.json'
         }
      ]
   }

} );
