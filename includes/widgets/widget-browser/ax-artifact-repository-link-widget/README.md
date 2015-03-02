# AxArtifactRepositoryLinkWidget
The AxArtifactRepositoryLinkWidget displays a link to a repository of a bower artifact.
The name of the artifact and the URL to the repository are received by the widget through a resource.
The resource contains the bower manifest (`bower.json`) of the artifact.

## Content
* [Appearance](#appearance)
* [Usage](#usage)
* [Features](#features)
* [Integration](#Integration)
* [References](#references)

## Appearance
![Illustration of the AxArtifactRepositoryLinkWidget](docs/img/example.png)

The AxArtifactRepositoryLinkWidget displaying a link to a artifact repository.


## Usage

### Installation
For installation instruction take a look at the [LaxarJS documentation](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/installing_widgets.md).

### Configuration example
```json
{
   "widget": "widget-browser/ax-artifact-repository-link-widget",
   "features": {
      "display": {
         "resource": "artifactConfiguration",
         "i18nHtmlText": "Browse artifact repository"
      }
   }
}
```
Use this configuration on a page to get an AxArtifactRepositoryLinkWidget instance.
The widget displays a link to the repository of the artifact published with the resource `artifactConfiguration`.

For full configuration options refer to the [widget.json](widget.json).

## Features

### 1. Display a Link to the Widget Repository (display)
*R1.1* The widget MUST allow the configuration of a resource which contains the URL to the repository of the artifact.
The widget MUST act as a slave of the resource according to the master/slave pattern.

*R1.2* The widget MUST display a link to the repository of an artifact.
The widget MUST use the `repository.link` attribute from the resource as the link address.

*R1.3* The link text MUST be configurable.


### 2. Support Internationalization (i18n)
*R2.1* The widget MUST allow the configuration of a locale as described in the documentation to [LaxarJS i18n]. When displaying internationalized content, the widget MUST use the current language tag of the locale.

## Integration
### Patterns
The widget supports the following event patterns as specified by the [LaxarJS Patterns] document.

#### Resources
* Resource: display.resource
* Role: Slave
* Access: Read
* Description: The resource with the information about the widget.


## References
The following resources are useful or necessary for the understanding of this document.
The links refer to the latest version of the documentation.
Refer to the bower.json for the specific version that is normative for this document.

* [LaxarJS Concepts]
* [LaxarJS Patterns]
* [LaxarJS i18n]

[LaxarJS Concepts]: https://github.com/LaxarJS/laxar/blob/master/docs/concepts.md "LaxarJS Concepts"
[LaxarJS Patterns]: https://github.com/LaxarJS/laxar_patterns/blob/master/docs/index.md "LaxarJS Patterns"
[LaxarJS i18n]: https://github.com/LaxarJS/laxar/blob/master/docs/manuals/i18n.md "LaxarJS i18n"
