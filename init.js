/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * https://laxarjs.org/license
 */

/* global require */

import { create } from 'laxar';
import artifacts from 'laxar-loader/artifacts?flow=main&theme=cube';

import * as angularAdapter from 'laxar-angular-adapter';

const config = {
   name: 'widget-browser',
   router: {
      query: {
         enabled: true
      },
      navigo: {
         useHash: true
      }
   },
   logging: {
      threshold: 'TRACE'
   },
   theme: 'cube'
};

create( [ angularAdapter ], artifacts, config )
   .tooling( require( 'laxar-loader/debug-info?flow=main&theme=cube' ) )
   .flow( 'main', document.querySelector( '[data-ax-page]' ) )
   .bootstrap();
