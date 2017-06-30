# laxar-show-hide-widget [![Build Status](https://travis-ci.org/LaxarJS/laxar-show-hide-widget.svg?branch=master)](https://travis-ci.org/LaxarJS/laxar-show-hide-widget)

Toggles the visibility of an area upon receiving events.

## Content

* [Appearance](#appearance)
* [Usage](#usage)
* [Features](#features)
* [Integration](#integration)
* [References](#references)

## Appearance

The widget does not display anything, but provides an area for other widgets and shows or hides this area depend on events.


## Usage

### Installation

For installation instruction take a look at the [LaxarJS documentation](https://laxarjs.org/docs/laxar-v2-latest/manuals/installing_widgets).

### Configuration Example

```json
"mainWidgetArea": [
   {
      "widget": "laxar-headline-widget",
      "features": {
         "headline": {
            "i18nHtmlText": "Above the laxar-show-hide-widget area"
         }
      }
   },
   {
      "widget": "laxar-show-hide-widget",
      "id": "myToggle",
      "features": {
         "show": {
            "onActions": [
               "showContent"
            ]
         },
         "hide": {
            "onActions": [
               "hideContent"
            ]
         },
         "area": {
            "name": "content"
         }
      }
   }
]
"myToggle.content": [
   {
      "widget": "laxar-headline-widget",
      "features": {
         "headline": {
            "i18nHtmlText": "Content to show/hide"
         }
      }
   }
]
```
Use this configuration on a page to get a laxar-show-hide-widget instance.

In this example there are two AxHeadlineWidget which display a simple headline.
The first headline is in the main widget area of the page and is visible all the time.
The second headline is in the widget area of the laxar-show-hide-widget and can be shown or hidden.

The area provided by the laxar-show-hide-widget is named using its `id` and the configuration parameter `area.name`.
The widget shows this area if it receives a `takeActionRequest` for one of the action configured under `show.onActions` and hides the area when it receives a `takeActionRequest` for one of the action configured under `hide.onActions`.

For full configuration options refer to the [widget.json](widget.json).


## Features

### 1. Provide a Widget Area (area)

*R1.1* The widget MUST provide an area for widgets and controls its visibility.

*R1.2* The name of the area MUST be configurable and MUST have the default name `content`.


### 2. Show Widget Area (show)

*R2.1* The widget MUST support the configuration of action events.
If the widget receives a `takeActionRequest` event of one of these, it MUST show the provided widget area.


### 3. Hide Widget Area (hide)

*R3.1* The widget MUST support the configuration of action events.
If the widget receives a `takeActionRequest` event of one of these, it MUST hide the provided widget area.


### 4. Visibility (visibility)

*R4.1* The widget MUST report the visibility of the provided widget area to the page by a configurable flag.

*R4.2* The widget MUST report the initial status after receiving the `didNavigate` event.

*R4.3* The widget MUST support the change of the visibility by flags.
If the value of any of the configured flags is `true` the widget MUST show the provided widget area.
If the value of all flags is `false` the widget MUST hide the provided widget area.

*R4.4* The widget MUST hide the widget area at the initial page status by default.
The widget MUST allow the configuration to display the provided widget area at the initial page status.
Any request via event for a visibility change MUST considered by the widget.

*R4.5* The widget MUST handle visibility requests for the widget in its widget area in relation to its own visibility.

*R4.6* The widget MUST trigger a visibility request for its provided widget area when the show/hide state changes.

### 5. Animation (animation)
*R5.1* When the widget shows or hides the widget area it SHOULD do this with an animation.
Except when the widget shows the widget area at the initial page status.
The animation SHOULD be enabled by default.

## Integration

### Patterns

The widget supports the following event patterns as specified by the [LaxarJS Patterns] document.


#### Actions

* Action: `show.onActions[*]`
   * Role: Receiver
   * Description: Trigger the widget to show the widget area

* Action: `hide.onActions[*]`
   * Role: Receiver
   * Description: Trigger the widget to hide the widget area.


#### Flags

* Flag: `visibility.toggleOn`
   * Role: Receiver
   * Description: Trigger the widget to show (`true`) or to hide (`false`) the widget area.

* Flag: `visibility.flag`
   * Role: Sender
   * Description: The flag is `true` if the widget area is shown.


#### Visibility

The widget manages visibility events for the configured area (`area.name`).

## References

The following resources are useful or necessary for the understanding of this document.
The links refer to the latest version of the documentation.
Refer to the [bower.json](bower.json) for the specific version that is normative for this document.

* [LaxarJS Concepts]
* [LaxarJS Patterns]

[LaxarJS Concepts]: https://laxarjs.org/docs/laxar-v2-latest/concepts/ "LaxarJS Concepts"
[LaxarJS Patterns]: https://laxarjs.org/docs/laxar-patterns-v2-latest/ "LaxarJS Patterns"
