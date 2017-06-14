# ax-widget-listing-activity

Reads a file listing of an application created by the [grunt-laxar] task `directory_tree` and extracts information on available widgets and activities.
The activity creates a list of widgets and publishes it as a resource.


## Content
* [Usage](#usage)
* [Features](#features)
* [Integration](#Integration)
* [References](#references)


## Usage

### Installation
For installation instruction take a look at the [LaxarJS documentation](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/installing_widgets.md).

### Configuration example
```json
{
  "widget": "laxarjs/ax-widget-listing-activity",
  "features": {
    "widgetListing": {
      "resource": "widgetList"
    },
    "fileListing": {
      "applicationUrl": "http://localhost:8000",
      "list": ["/var/listing/includes_resources.json"]
    }
  }
}
```

Use this configuration on a page to get an AxWidgetListingActivity instance.
The activity reads the information about widgets from the file 'http://localhost:8000/var/listing/includes_resources.json' and publishes a list with the widgets with the resource `widgetList`.

For full configuration options refer to the [widget.json](widget.json).

## Features
### 1. Readout File List (fileListing)
*R1.1* The activity MUST allow the configuration of a file listing resource.
It MUST act as a slave of the resource according to the master/slave pattern

*R1.2* If the activity gets an update of the resource or the resource is replaced by events, it MUST delete all old widget and activity information and reads them out from scratch.

*R1.3* The activity expects a path to a file inside the resource.
The activity MUST determine the content of the file as a JSON-String and parse it.
The activity MUST extract all widget and activity information from the result object.

*R1.4* If an error encounters during the readout, the activity SHOULD propagate the error via `didValidate` event.

*R1.5* The activity MUST support a configurable list with static URLs to the widget and activity information instead of the URL from the resource.

*R1.6* The activity MUST allow the configuration of an URL to an application with widgets.
This URL is for the static source (R1.5) configuration only.
If none URL is configured, the activity MUST use the application in which it is embedded as source.

*R1.7* The activity MUST detect a property from the file listing object as a widget information object if it has a property `widget.json`.

### 2. Propagation of the Widget Listing (widgetListing)
*R2.1* The activity MUST allow the configuration of a widget list resource and MUST be the *master* of the resource according to the master/slave pattern.

*R2.2* The activity MUST propagate a new widget listing resource by a `didReplace` event if the extracted widget and activity information changes.

*R2.3* The activity SHOULD sort the list alphabetically by the name of the widgets and activities.


## Integration
### Patterns
The activity supports the following event patterns as specified by the [LaxarJS Patterns] document.

#### Resources
* Resource: fileListing.resource
   * Role: Slave
   * Access: Read
   * Description: Resource with the application url and the path to the file with the widget list.
   * Data: The following properties are mandatory. Additional properties are ignored.
      * applicationUrl:
         * String
         * URL to the application with the widgets which should read out.
      * fileListingPath
         * String
         * Under the path combined with the `applicationUrl` the file with the widgets is expected.

* Resource: widgetListing.resource
   * Role: Master
   * Access: Write
   * Description: Publication of the widget list resource.
   * Data: The resource has a property `widgets` which is a list with entries with the following structure:
      * name
         * String
         * Technical widget topic (name in underscore)
      * specification
         * String
         * URL of the widget.json file


## References
The following resources are useful or necessary for the understanding of this document.
The links refer to the latest version of the documentation.
Refer to the bower.json for the specific version that is normative for this document.

* [LaxarJS Concepts]
* [LaxarJS Patterns]

[LaxarJS Concepts]: https://github.com/LaxarJS/laxar/blob/master/docs/concepts.md "LaxarJS Concepts"
[LaxarJS Patterns]: https://github.com/LaxarJS/laxar_patterns/blob/master/docs/index.md "LaxarJS Patterns"
[grunt-laxar]: https://github.com/LaxarJS/grunt-laxar "grunt-laxar"
