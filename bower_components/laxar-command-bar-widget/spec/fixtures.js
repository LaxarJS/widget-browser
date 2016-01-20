/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( {
   customAllEnabledButtons: {
      buttons: [
         {
            enabled: true,
            i18nHtmlLabel: 'Action 1',
            action: 'action1',
            align: 'LEFT',
            index: 10
         },
         {
            enabled: true,
            i18nHtmlLabel: 'Action 2',
            action: 'action2',
            align: 'LEFT',
            index: 10
         },
         {
            enabled: true,
            i18nHtmlLabel: 'Action 3',
            action: 'action3',
            align: 'LEFT',
            index: -10
         },
         {
            enabled: true,
            i18nHtmlLabel: 'Action 4',
            action: 'action4',
            size: 'SMALL',
            align: 'CENTER'
         },
         {
            enabled: true,
            i18nHtmlLabel: 'Action 5',
            action: 'action5',
            align: 'RIGHT',
            'class': 'SUCCESS',
            index: 96
         }
      ]
   },

   defaultAllEnabledButtons: {
      buttons: [],
      previous: {
         enabled: true,
         i18nHtmlLabel: {
            'de': '<i class="icon-circle-arrow-left"></i> Zurück'
         },
         action: 'previous',
         align: 'LEFT',
         index: -100,
         disableOn: [ 'notUndoable' ]
      },
      next: {
         enabled: true,
         i18nHtmlLabel: {
            'de': '<i class="icon-circle-arrow-right"></i> Weiter',
            'en-US': '<i class="icon-circle-arrow-right"></i> Next'
         },
         action: 'next',
         align: 'RIGHT',
         index: 100,
         hideOn: [ 'guestUser' ],
         busyOn: [ 'navigation' ]
      },
      cancel: {
         enabled: true,
         i18nHtmlLabel: {
            'de': '<i class="icon-remove-sign"></i> Abbrechen'
         },
         action: 'cancel',
         align: 'RIGHT',
         index: 96
      },
      help: {
         enabled: true,
         i18nHtmlLabel: {
            'de': '<i class="icon-question-sign"></i> Hilfe'
         },
         action: 'help',
         align: 'CENTER',
         index: -49,
         omitOn: [ '!helpAvailable' ]
      }
   },

   sortTestButtons: {
      customButtons: {
         buttons: [
            {
               enabled: true,
               i18nHtmlLabel: 'Action 1',
               action: 'action1'
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 2',
               action: 'action2'
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 3',
               action: 'action3'
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 4',
               action: 'action4'
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 5',
               action: 'action5'
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 6',
               action: 'action6',
               index: 1
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 7',
               action: 'action7',
               index: 2
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 8',
               action: 'action8',
               index: 3
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 9',
               action: 'action9',
               index: 4
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 10',
               action: 'action10',
               index: 0
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 11',
               action: 'action11'
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 12',
               action: 'action12',
               index: 1
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 13',
               action: 'action13',
               index: 1
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 14',
               action: 'action14',
               index: 2
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 15',
               action: 'action15',
               index: -1
            }
         ]
      },
      defaultAndCustomButtons: {
         previous: {
            enabled: true,
            action: 'action16',
            align: 'LEFT'
         },
         next: {
            enabled: true,
            action: 'action17',
            index: 300,
            align: 'LEFT'
         },
         cancel: {
            enabled: true,
            action: 'action18',
            align: 'LEFT'
         },
         buttons: [
            {
               enabled: true,
               i18nHtmlLabel: 'Action 1',
               action: 'action1'
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 2',
               action: 'action2'
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 3',
               action: 'action3'
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 4',
               action: 'action4'
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 5',
               action: 'action5'
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 6',
               action: 'action6',
               index: 100
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 7',
               action: 'action7',
               index: 200
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 8',
               action: 'action8',
               index: 300
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 9',
               action: 'action9',
               index: 400
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 10',
               action: 'action10',
               index: 0
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 11',
               action: 'action11'
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 12',
               action: 'action12',
               index: 100
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 13',
               action: 'action13',
               index: 100
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 14',
               action: 'action14',
               index: 200
            },
            {
               enabled: true,
               i18nHtmlLabel: 'Action 15',
               action: 'action15',
               index: -100
            }
         ]
      },
      defaultButtons: {
         previous: {
            enabled: true,
            action: 'action1',
            align: 'LEFT',
            index: 0
         },
         next: {
            enabled: true,
            action: 'action2',
            index: 700,
            align: 'LEFT'
         },
         finish: {
            enabled: true,
            action: 'action3',
            align: 'LEFT',
            index: 0
         },
         ok: {
            enabled: true,
            action: 'action4',
            align: 'LEFT',
            index: 0
         },
         cancel: {
            enabled: true,
            action: 'action5',
            align: 'LEFT',
            index: 0
         },
         info: {
            enabled: true,
            action: 'action7',
            index: -200,
            align: 'LEFT'
         },
         help: {
            enabled: true,
            action: 'action8',
            index: -200,
            align: 'LEFT'
         },
         print: {
            enabled: true,
            action: 'action9',
            align: 'LEFT',
            index: 0
         },
         apply: {
            enabled: true,
            action: 'action10',
            index: 300,
            align: 'LEFT'
         },
         yes: {
            enabled: true,
            action: 'action11',
            index: -900,
            align: 'LEFT'
         },
         no: {
            enabled: true,
            action: 'action12',
            index: 0,
            align: 'LEFT'
         }
      }
   },

   customWithSameAction: {
      buttons: [
         {
            enabled: true,
            i18nHtmlLabel: 'Action',
            action: 'action',
            align: 'LEFT',
            index: 10
         },
         {
            enabled: true,
            i18nHtmlLabel: 'Same Action',
            action: 'action',
            align: 'LEFT',
            index: 10
         }
      ]
   }

} );
