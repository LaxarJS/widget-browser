/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( {
   simpleMessages: {
      car: [
         {
            resource: 'car',
            outcome:  'ERROR',
            data: [
               {
                  htmlMessage: { 'en_US': 'Wrong car', 'de_DE': 'Falsches Auto' },
                  level: 'ERROR',
                  sortKey: '010'
               },
               {
                  htmlMessage: { 'en_US': 'Strange color', 'de_DE': 'Seltsame Farbe' },
                  level: 'WARNING',
                  sortKey: '001'
               }
            ]
         }
      ],
      pet: [
         {
            resource: 'pet',
            outcome:  'ERROR',
            data: [
               {
                  htmlMessage: { 'en_US': 'No hamster' },
                  level: 'ERROR',
                  sortKey: '000'
               }
            ]
         },
         {
            resource: 'pet',
            outcome:  'INFO',
            data: [
               {
                  htmlMessage: { 'en_US': 'Hamster is hungry' },
                  level: 'INFO',
                  sortKey: '002'
               }
            ]
         }
      ],
      beverage: [
         {
            resource: 'beverage',
            outcome:  'WARNING',
            data: [
               {
                  htmlMessage: { 'en_US': 'Too expensive' },
                  level: 'WARNING',
                  sortKey: '000'
               }
            ]
         }
      ],
      car2: [
         {
            resource: 'car2',
            outcome:  'INFO',
            data: [
               {
                  htmlMessage: { 'en_US': 'Wrong car' },
                  level: 'INFO',
                  sortKey: '001'
               }
            ]
         },
         {
            resource: 'car2',
            outcome:  'ERROR',
            data: [
               {
                  htmlMessage: { 'en_US': 'Strange color' },
                  level: 'ERROR',
                  sortKey: '001'
               }
            ]
         }
      ],
      beverage2: [
         {
            resource: 'beverage2',
            outcome:  'INFO',
            data: [
               {
                  htmlMessage: { 'en_US': 'Too expensive' },
                  level: 'INFO',
                  sortKey: '000'
               }
            ]
         }
      ],
      car3: [
         {
            resource: 'car',
            outcome:  'SUCCESS',
            data: [
               {
                  htmlMessage: { 'en_US': 'Red car', 'de_DE': 'Rotes Auto' },
                  level: 'INFO',
                  sortKey: '010'
               }
            ]
         }
      ]
   },
   subMessages: {
      'pet-health': [
         {
            resource: 'pet-health',
            outcome:  'WARNING',
            data: [
               {
                  htmlMessage: { 'en_US': 'Hamster health at critical levels' },
                  level: 'WARNING',
                  sortKey: '002'
               }
            ]
         }
      ]
   },
   cssClassTestEvent: {
      resource: 'something',
      outcome: 'ERROR',
      data: [
         {
            htmlMessage: { 'en_US': 'error!' },
            level: 'ERROR'
         },
         {
            htmlMessage: { 'en_US': 'success!' },
            level: 'SUCCESS'
         },
         {
            htmlMessage: { 'en_US': 'warning!' },
            level: 'WARNING'
         },
         {
            htmlMessage: { 'en_US': 'info!' },
            level: 'INFO'
         }
      ]
   },
   allLevelEvents: [
      {
         resource: 'allLevels',
         outcome: 'ERROR',
         data: [ { htmlMessage: { 'en_US': 'error!' }, level: 'ERROR' } ]
      },
      {
         resource: 'allLevels',
         outcome: 'WARNING',
         data: [ { htmlMessage: { 'en_US': 'warning!' }, level: 'WARNING' } ]
      },
      {
         resource: 'allLevels',
         outcome: 'INFO',
         data: [ { htmlMessage: { 'en_US': 'info!' }, level: 'INFO' } ]
      },
      {
         resource: 'allLevels',
         outcome: 'SUCCESS',
         data: [ { htmlMessage: { 'en_US': 'success!' }, level: 'SUCCESS' } ]
      }
   ]
} );
