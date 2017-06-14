/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [], function() {
   'use strict';
   /*jshint quotmark:true*/

   return {
      "name": "MyOtherWidget",

      "version": {
         "spec": "0.1.0"
      },

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
               }
            }
         },
         "myOtherFeature": {
            "type": "object",
            "properties": {
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