# AxButtonListControl

> Wraps a row of Bootstrap buttons as an AngularJS directive, for LaxarJS widgets.

The button list directive can be used to render a list of buttons in a very simple way. 
It is optimized for high-performance in certain usage scenarios.
The use of `ngRepeat` is therefore explicitly avoided.
It thus has some known (but for this case well acceptable) limitations:
* As soon as a non-empty list to the axButtonList binding is available, the according buttons are rendered in the given order using the template found with the directive.
* When the rendering has finished the directive disconnects from future updates to the list. 
  Thus all changes made to the list won't be reflected in the rendered button list.
  Changes to items within in the button will nevertheless be updated in the view thanks to AngularJS' scopes.


## Installation

To retrieve a copy of this control you can either clone it directly using git or alternatively install it via Bower.
For general information on installing, styling and optimizing controls, have a look at the [LaxarJS documentation](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/installing_controls.md).

### Setup Using Bower

Install the control into your LaxarJS application:

```sh
bower install laxar-button-list-control
```

Now you may reference the control from the `widget.json` of your widget:
 
```json
   "controls": [ "laxar-button-list-control" ]
```


## Usage

Bind your list of buttons to the attribute having the directive's name, while keeping above mentioned limitations in mind.
In practice this means: *Only fill the list with the buttons when you are sure, that no further modifications to the list will occur.*
To get notified of clicks on a button the `ax-button-list-click` attribute can be provided with a bound function call.
This call is evaluated in the scope of the button that has been activated.
Thus the button from the given list is available as `button` to the bound function.

### Example

HTML/AngularJS view template:

```html
<div data-ax-button-list="buttons"
     data-ax-button-list-click="handleButtonClicked( button )"></div>
```

Widget controller code:

```js
$scope.buttons = [
   {
      htmlLabel: 'Click Me!',
      id: $scope.id( 'first button' ),
      classes: [ 'btn-info', 'btn-large' ]
   }
];

$scope.handleButtonClicked = function( button ) { /* ... */ }
```

For each button model, the following properties are supported:

* `htmlLabel` a label to use for this button
* `id` an ID that can be used to identify the button, must be globally unique
* `accessKey` used as the button's HTML `accesskey`
* `classes` bound to the button using `ngClass`
