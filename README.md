# WidgetBrowser

The LaxarJS WidgetBrowser contains all widgets provided by the LaxarJS Team.
Select a widget from the list to access its documentation.
Along with the `README.md` of the selected widget, details such as version, dependencies and the configuration options are shown.
This information is generated from the widget metadata (`bower.json` and `widget.json`).


## Installing the WidgetBrowser

These steps are required to install your local version of the LaxarJS widget browser:

```sh
git clone --recursive \
 https://github.com/LaxarJS/widget-browser.git
cd widget-browser
npm install
npm start
```

## Pointing the WidgetBrowser to your Application

The widget browser can be configured to browse the widgets of any running target application that was built using LaxarJS.

Change the configuration in `application/pages/widget-browser.json` to point the widget browser to your own application and file listing:

```js
   ...,
   {
      "widget": "widget-browser/ax-widget-listing-activity",
      "features": {
         "fileListing": {
            "applicationUrl": "http://localhost:8000/",
            "list": [ "var/listing/includes_resources.json" ]
         },
         "widgetListing": {
            "resource": "widgetList"
         }
      }
   },
   ...
}
```

Depending on your setup, you might have to serve widget browser and target application from the same host and port to avoid cross-site scripting restrictions, or set the correct [CORS header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) on the target application server.
