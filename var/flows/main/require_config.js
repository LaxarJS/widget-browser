/*jshint quotmark:false,-W079*/
var require = { 
   "baseUrl": "bower_components", 
   "deps": [
      "es5-shim/es5-shim"
   ], 
   "shim": { 
      "angular": { 
         "deps": [
            "jquery"
         ], 
         "exports": "angular"
      }, 
      "angular-mocks": { 
         "deps": [
            "angular"
         ], 
         "init": function ( angular ) {
            'use strict';
            return angular.mock;
         }
      }, 
      "angular-route": { 
         "deps": [
            "angular"
         ], 
         "init": function ( angular ) {
            'use strict';
            return angular;
         }
      }, 
      "angular-sanitize": { 
         "deps": [
            "angular"
         ], 
         "init": function ( angular ) {
            'use strict';
            return angular;
         }
      }, 
      "json-patch": { 
         "exports": "jsonpatch"
      }, 
      "underscore": { 
         "exports": "_", 
         "init": function () {
            'use strict';
            return this._.noConflict();
         }
      }
   }, 
   "packages": [
      { 
         "name": "laxar-application", 
         "location": "..", 
         "main": "init"
      },
      { 
         "name": "moment", 
         "location": "moment", 
         "main": "moment"
      }
   ], 
   "paths": { 
      "requirejs": "requirejs/require", 
      "text": "requirejs-plugins/lib/text", 
      "json": "requirejs-plugins/src/json", 
      "laxar": "laxar/dist/laxar.with-deps", 
      "laxar-patterns": "laxar-patterns/dist/laxar-patterns", 
      "laxar-uikit": "laxar-uikit/dist/laxar-uikit", 
      "laxar-uikit/controls": "laxar-uikit/dist/controls", 
      "laxar-path-default-theme": "laxar-uikit/dist/themes/default.theme", 
      "laxar-mocks": "laxar-mocks/dist/laxar-mocks", 
      "jasmine2": "jasmine2/lib/jasmine-core/jasmine", 
      "promise-polyfill": "promise-polyfill/Promise", 
      "jquery": "jquery/dist/jquery", 
      "json-patch": "fast-json-patch/src/json-patch-duplex", 
      "laxar-path-root": "..", 
      "laxar-path-layouts": "../application/layouts", 
      "laxar-path-pages": "../application/pages", 
      "laxar-path-widgets": "../includes/widgets", 
      "laxar-path-themes": "../includes/themes", 
      "laxar-path-flow": "../application/flow/flow.json", 
      "angular": "angular/angular", 
      "angular-mocks": "angular-mocks/angular-mocks", 
      "angular-route": "angular-route/angular-route", 
      "angular-sanitize": "angular-sanitize/angular-sanitize", 
      "underscore": "underscore/underscore"
   }, 
   "map": { 
      "*": { 
         "laxar_uikit": "laxar-uikit", 
         "laxar_patterns": "laxar-patterns"
      }
   }
};
