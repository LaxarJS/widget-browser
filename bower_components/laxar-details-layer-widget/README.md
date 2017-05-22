# laxar-details-layer-widget [![Build Status](https://travis-ci.org/LaxarJS/ax-details-layer-widget.svg?branch=master)](https://travis-ci.org/LaxarJS/ax-details-layer-widget)

> Displays a simple details layer, growing from a source element with animation.

Purpose of this widget is to provide a very simple layer to display details to some piece of information.
In order to clarify the link between the information and the details, the layer will be zoomed in, starting from the source element until it covers the full viewport.
If no source element is given, it is directly displayed in full size.

## Configuration

### *area.name*

The name of the widget area the layer will export.
Depending on the theming, it will span the complete viewport, minus some margins.


### *open.onActions*

An array of actions the widget will subscribe to and, as soon as it receives one of these actions, open itself.
This action event may carry the selector for the source element under the path configured as *animateFrom.actionSelectorPath*.


### *close.onActions*

An array of actions the widget will subscribe to and, as soon as it receives one of these actions, close itself.
The close animation will always end at the element used to animate the layer open in the first place.


### *close.action*

If configured, this will be used as the topic of a `takeActionRequest` event that is send whenever the layer is closed and the closing animation has finished.


### *closeIcon.enabled*

If this is `true`, a small close icon will be rendered, that on click closes the layer.
Additionally, the layer is closed as soon as the escape key is pressed.


### *backdropClose.enabled*

If this is `true`, a click on the modal backdrop closes the layer.


### *animateFrom.activeElement*

The default option is to start the opening animation from the element that triggered opening the details layer through an ui interaction.
This should only be disabled, if the source of animation does not correspond to the DOM element that caused the action.


### *animateFrom.actionSelectorPath*

A JSON path to the property within the action event object, that carries the selector for the animation source element.
If this is configured, it will always have precedence over the activeElement if found on the page.
In case *animateFrom.activeElement* is configured to be `false` and the element is not found, a warning will be logged.


### *skipAnimations.actionSelectorPath*

A JSON path to the property within the action event object, that can be used to skip animations when opening the details layer widget.
If this is configured and the according property within the event is `true`, no opening animations will take place.
It is still possible to provide an element to animate from.
This will then be used as animation target when closing the layer again.


### *logTag.name*

Name of a log tag to set when the popup layer is opened.
As soon as the layer is closed again, the log tag is removed.
Note that the log tag is only set if `logTag.value` is also set.


### *logTag.value*

Value of a log tag to set when the popup layer is opened.
As soon as the layer is closed again, the log tag is removed.
Note that the log tag is only set if `logTag.name` is also set.
