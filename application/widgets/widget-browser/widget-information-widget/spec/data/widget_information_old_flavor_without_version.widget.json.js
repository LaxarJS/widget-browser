/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * https://laxarjs.org/license
 */

export const widgetInformationWithoutVersion = {
   'name': 'MyWidget',

   'integration': {
      'technology': 'angular',
      'type': 'widget'
   },

   'features': {
      'myFeature': {
         'type': 'object',
         'properties': {
            'title': {
               'type': 'object',
               'properties': {
                  'htmlLabel': {
                     'type': 'string',
                     'description': 'Title for the myFeature section.'
                  }
               }
            },
            'resource': {
               'type': 'string',
               'description': 'The topic of the resource for the myFeature.',
               'format': 'topic',
               'required': true
            }
         }
      }
   }
};

