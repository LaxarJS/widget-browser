/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * https://laxarjs.org/license
 */

export const widgetInformationSchema04 = {
   'name': 'MyWidget',

   'version': {
      'spec': '0.1.0'
   },

   'integration': {
      'technology': 'angular',
      'type': 'widget'
   },

   'features': {
      '$schema': 'http://json-schema.org/draft-04/schema#',
      'type': 'object',
      'properties': {
         'myFeature': {
            'type': 'object',
            'required': [ 'resource' ],
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
                  'format': 'topic'
               }
            }
         }
      }
   }
};
