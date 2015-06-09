# AxAccordionControl

> Wraps the [jQuery UI accordion component](https://jqueryui.com/accordion/) as an AngularJS directive, for LaxarJS widgets.

## Installation

To retrieve a copy of this control you can either clone it directly using git or alternatively install it via Bower.
For general information on installing, styling and optimizing controls, have a look at the [LaxarJS documentation](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/installing_controls.md).

### Setup Using Bower

Install the control into your LaxarJS application:

```sh
bower install laxar-accordion-control
```

Make sure that `jquery` and `jquery-ui` can be found by RequireJS.
For example, assuming that your `baseUrl` is `'bower_components'`, add the following to the `paths` section of your `require_config.js`:

```js
jquery: 'jquery/dist/jquery'
```

Now you may reference the control from the `widget.json` of your widget:
 
```json
"controls": [ "laxar-accordion-control" ]
```
