# laxar-log-activity [![Build Status](https://travis-ci.org/LaxarJS/ax-log-activity.svg?branch=master)](https://travis-ci.org/LaxarJS/ax-log-activity)

> LaxarJS v2 plain activity that collects log messages and submits them to a log service periodically and before page navigation


## Content

* [Usage](#usage)
* [Features](#features)
* [Integration](#integration)
* [References](#references)


## Usage

### Installation

Within a LaxarJS v2 project, simply run:

```console
npm install laxar-log-activity
```


### REST Service Configuration

The REST service which accepts the logging data from the activity must be configured in your application configuration (e.g. `init.js`).
You have to specify the key `widgets.laxar-log-activity.resourceUrl`:

```js
import { bootstrap } from 'laxar';

bootstrap( /*...*/, {
   /*...,*/   
   configuration: {
      /*...,*/   
      widgets: {
         'laxar-log-activity': {
            resourceUrl: '/some-service/log-resource'
         }
      }
   }
} );
```


### Page Configuration example

Use this configuration on a page for a laxar-log-activity instance which collects log messages and submits them to a configured service every 60 seconds or when having collected more than 150 messages.

```json
{
   "widget": "laxar-log-activity",
   "features": {
      "logging": {
         "requestPolicy": "PER_MESSAGE",
         "threshold": {
            "seconds": 60,
            "messages": 150
         }
      }
   }
}
```

For full configuration options refer to the [widget.json](widget.json).


## Features

### Logging [logging]

R1.01 It MUST be possible to turn the logging of by configuration.

R1.02 The activity MUST add a channel to the LaxarJS logger to collect log messages.

R1.03 The URL to the log resource MUST be configurable for the application (Key: `widgets.laxar-log-activity.resourceUrl`).

R1.04 The activity MUST publish an error message in the local log if the log resource is not configured.

R1.05 The activity MUST submit the collected log messages to the log service periodically and delete its collected messages.
The transmission MUST be asynchronous.

R1.06 The time period SHOULD be configurable, to be able to control the performance impact of the activity.

R1.07 The log messages MUST be sent by HTTP POST to the configured log resource URL.
The content type of the request MUST be `application/json`.

It MUST be configurable if the messages are sent in batch or individually.
The body of the request MUST be either a JSON-serialized message or MUST contain a JSON-serialized object with an array of `messages` and a property `source`.
The property MUST be a string with the URL of the source of the logging messages.

Each message MUST have the following properties:

  - `level` (String), the log level (e.g. "INFO")
  - `text` (String), the original log message with all (not anonymized) placeholders replaced
  - `replacements` (Array<String>), substitution parameters for anonymized placeholders
  - `time` (String), time of the client (ISO-8601)
  - `file` (String), the JavaScript source code file of the log message determined by the browser
  - `line` (Number), the source code line of the log message determined by the browser
  - `tags` (Array<String>): List of named log tags as `"NAME:value"` pairs
  - `repetitions` (Number): Numbers of consecutive times that the message was collected

If the messages are send individually they MUST have the additional property:
  - `source` (String): The URL of the source of the logging message.

R1.08 The activity MUST react to the DOM event `window.onunload`.
It MUST submit all remaining log messages to the log service before the page is unloaded.

R1.09 The number of log messages buffered within the activity MUST be limited.

R1.10 The maximum of buffered log messages SHOULD be configurable.

R1.11 If the maximum of messages to be buffered is reached and another message is collected, the activity MUST submit all collected messages to the log service.

R1.12 The activity MUST delete the collected messages after submitting them to the log service, whether the transmission was successful or not.

R1.13 The activity MUST react to the `didEncounterError` event and log the error code and error message.
This message MUST be send to the LaxarJS logger so that all log channels get the message.

R1.14 If multiple identical log message are received, the activity MUST summarize them into one message.
The collective message MUST include the information about the number of identical messages.

R1.15 The activity MUST substitute the placeholder in log messages with the associated replace parameters before submitting them to the log service.
JavaScript objects SHOULD be replaced with their JSON representation.

R1.16 The activity MUST pass the log tags of each message to the log service.

R1.17 The activity MUST add the log tag `INST` with the ID of the application session to each message if the tag is not already set.

R1.18 The activity MUST submit the log level and message timestamp (ISO-8601) to the log service.

R1.19 Placeholders, whose content should anonymized, MUST NOT be replaced.
They MUST be submitted as a separate parameter to the log service.
The activity MUST apply other formatting instructions (beside the anonymization) on the parameters before.

R1.20 The activity MUST retry sending the messages in a configurable time interval and a configurable number of tries.
The activity MUST delete the messages after the last try of transmission, whether the transmission was successful or not.

R1.21 When the activity submits the messages, it MUST add a temporary identifier for the current browser session to the header.
This feature MUST be disabled by default.
The name of the header MUST be configurable.


## Integration

### Patterns

The widget supports the following event patterns as specified by the [LaxarJS Patterns] document.


#### Events

* Event: `didEncounterError.errorClass`
   * Description: An error was reported.
   The laxar-log-activity must extract the collected log data and send them to the configured service.
   * Data:
     * `errorClass`: the errorClass (NetworkError, GeneralError, CustomError)
     * `logLevel`: the log level to use for the logging
     * `logMessage`: the text for the log message


### Services

* Log-Service
  The laxar-log-activity submits the collected log messages to configured log resource using HTTP POST.
  The format of the POST request is described in R1.07.


## References

The following sources are useful or necessary for the understanding of this document.
The links refer to the latest version of the documentation.
Refer to the [bower.json](bower.json)  for the specific version that is normative for this document.

* [LaxarJS Concepts]
* [LaxarJS Patterns]

[LaxarJS Concepts]: https://github.com/LaxarJS/laxar/blob/master/docs/concepts.md "LaxarJS Concepts"
[LaxarJS Patterns]: https://github.com/LaxarJS/laxar_patterns/blob/master/docs/index.md "LaxarJS Patterns"
