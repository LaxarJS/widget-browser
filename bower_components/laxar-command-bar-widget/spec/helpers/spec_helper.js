/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [], function() {
   'use strict';

   return {

      toContainButtonWithAction: function( util, customEqualityTesters ) {
         return {
            compare: function( actual, expected ) {
               var result = {};
               result.pass = false;
               var buttonList = actual;
               for( var i = 0; i < buttonList.length; ++i ) {
                  if( buttonList[ i ].action === expected ) {
                     result.pass = true;
                  }
               }
               if( result.pass ) {
                  result.message = 'Expected area "' + JSON.stringify( actual ) + '" not to contain button with action "' + expected + '"';
               }
               else {
                  result.message = 'Expected area "' + JSON.stringify( actual ) + '" to contain button with action "' + expected + '"';
               }
               return result;
            }
         };
      },
      toHaveAction: function( util, customEqualityTesters ) {
         return {
            compare: function( actual, expected ) {
               var result = {};
               result.pass = actual.action === expected;
               if( result.pass ) {
                  result.message = 'Expected button "' + JSON.stringify( actual ) + '" not to have action "' + expected + '"';
               }
               else {
                  result.message = 'Expected button "' + JSON.stringify( actual ) + '" to have action "' + expected + '"';
               }
               return result;
            }
         };
      }
   };
} );
