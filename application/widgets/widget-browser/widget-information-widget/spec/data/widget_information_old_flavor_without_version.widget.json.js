/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [], function() {
   'use strict';
   /*jshint quotmark:true*/

   return {
      "name": "MyWidget",

      "integration": {
         "technology": "angular",
         "type": "widget"
      },

      "features": {
         "myFeature": {
            "type": "object",
            "properties": {
               "title": {
                  "type": "object",
                  "properties": {
                     "htmlLabel": {
                        "type": "string",
                        "description": "Title for the myFeature section."
                     }
                  }
               },
               "resource": {
                  "type": "string",
                  "description": "The topic of the resource for the myFeature.",
                  "format": "topic",
                  "required": true
               }
            }
         }
      }
   };

} );
