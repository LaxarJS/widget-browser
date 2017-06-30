# laxar-developer-tools-widget [![Build Status](https://travis-ci.org/LaxarJS/laxar-developer-tools-widget.svg?branch=master)](https://travis-ci.org/LaxarJS/laxar-developer-tools-widget)

The laxar-developer-tools-widget allows to open a _developer tools window_ that embeds the [laxar-developer-tools-content](https://github.com/LaxarJS/laxar-developer-tools-content/README.md) application.
This application displays application events, helps visualizing the structure of the current page, and allows to browse log messages of the running LaxarJS application.


## Content

* [Appearance](#appearance)
* [Usage](#usage)
* [Features](#features)
* [Integration](#integration)
* [References](#references)


## Appearance

The laxar-developer-tools-widget optionally displays a button to allow the user to open a new window with the [laxar-developer-tools-content](https://github.com/LaxarJS/laxar-developer-tools-content/README.md) application.


## Usage

### Installation

For this version of the laxar-developer-tools-widget, make sure that your host application is using LaxarJS v2.0.0 or newer.
For installation instruction take a look at the [LaxarJS documentation](http://laxarjs.org/docs/laxar-v2-latest/manuals/installing_widgets).


### Configuration example

```json
{
   "widget": "laxar-developer-tools-widget"
}
```

Use this configuration on a page to have a button that will open the developer tools window.
The window will also open when the global method `window.laxarShowDeveloperTools()` is called.

```json
{
   "widget": "laxar-developer-tools-widget",
   "features": {
      "button": {
         "enabled": false
      },
      "open": {
         "onActions": [ "showDevTools" ],
         "onGlobalMethod": "goDevelop"
      }
   }
}
```

Use this configuration on a page to have a developer tools window without visual representation, that will open when the action `showDevTools` is requested.
Alternatively, the window can be opened by calling the method `window.goDevelop()` (for example, from a bookmark).
_Note:_ To open the developer window in this fashion, it might be necessary to add an exception to the browser's popup blocker.

For full configuration options refer to the [widget.json](widget.json).



### Development

To _develop_ (and not just use) the laxar-developer-tools-widget _itself,_ the content application must be prepared:

```sh
cd content
npm install
```

To have the debug-version run within the developer tools window so that you may quickly try out any changes, enable the `develop` feature:

```json
{
   "widget": "laxar-developer-tools-widget",
   "features": {
      "develop": {
         "enabled": true
      }
   }
}
```


To build and _release a new version_, the release-version of the embedded application must be committed:

```sh
cd content
npm run dist
git add var
git commit ...
```


### Features

### 1. Allow to Open a Developer Tools Window _(open)_

Because the developer tools should exist independently of the host application state and navigation, they are opened in a separate window.

*R1.1* The widget MUST allow to configure an action for opening the developer tools window.
_Note:_ To open the developer window in this fashion, it might be necessary for the user to add an exception to the browser's popup blocker.
Alternatively, a _button_ (see below) may be used.

*R1.2* The widget MUST allow to configure a global javascript method name that opens the window directly.
_Note:_ This method is intended to be invoked manually by developers, and not as an API.


### 2. Provide Access through a Graphical Button _(button)_

*R2.1* The widget MUST allow to render a graphical button.
This should be the default behavior.

*R2.2* It must be possible to disable the button.

*R2.3* It must be possible to configure a different label for the button.


### 3. No-Op Mode

The widget MUST support being disabled completely using an application-wide _enabled-flag_.

*R3.1* The enabled-flag must be read from the LaxarJS configuration path `widgets.laxar-developer-tools-widget.enabled`.
The default value for the enabled-flag is `true`.
If the enabled-flag value is `false`, the widget MUST NOT subscribe to _takeActionRequest_ events, even if configured for the _open_ feature.

*R3.2* If the enabled-flag value is `false`, a global method MUST NOT be added, even if configured for the _open_ feature.

*R3.3* If the enabled-flag value is `false`, a button MUST NOT be rendered, even if the _button_ feature has been enabled (see above).


### 4. Embed the laxar-developer-tools-content Application

*R4.1* The widget MUST embed the laxar-developer-tools-content application to provide the developer tools for all browser.
Refer to the [laxar-developer-tools-content](https://github.com/LaxarJS/laxar-developer-tools-content/README.md) for details.


## Integration

### Patterns

The widget supports the following event patterns as specified by the [LaxarJS Patterns] documentation.

#### Actions

* Action: open.onActions
* Role: Receiver
* Description: Opens the developer tools window


## References

The following resources are useful or necessary for the understanding of this document.
The links refer to the latest version of the documentation.

* [LaxarJS Concepts]
* [LaxarJS Patterns]

[LaxarJS Concepts]: http://laxarjs.org/docs/laxar-v2-latest/concepts "LaxarJS Concepts"
[LaxarJS Patterns]: http://laxarjs.org/docs/laxar-patterns-v2-latest "LaxarJS Patterns"
