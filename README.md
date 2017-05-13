Medic Reporter is a web interface to send reports to a Medic Mobile instance (see [medic-webapp](https://github.com/medic/medic-webapp)). You can send all SMS-based formats that Medic Mobile supports :
[Muvuku](https://github.com/medic/medic-webapp/blob/master/tests/nodeunit/unit/kujua-sms/smsparser.js) (used by SimApps), [Textforms](https://github.com/medic/medic-webapp/blob/master/tests/nodeunit/unit/kujua-sms/textforms_parser.js) or [Textforms Compact](https://github.com/medic/medic-webapp/blob/master/tests/nodeunit/unit/kujua-sms/smsparser_compact_textform.js) formats.

Medic Reporter is a couchapp, install it in a couchdb server, and then access it through:

`<server url>/medic-reporter/_design/medic-reporter/_rewrite/`

You're guided to fill in reports:

![Screenshot: field validation](documentation_images/different_report_formats.png?raw=true)

You can use the different report formats that Medic Mobile supports:

![Screenshot: different report formats](documentation_images/field_validation.png?raw=true)

## Install

Clone the repo:

    git clone https://github.com/medic/medic-reporter
    cd medic-reporter

Use the [erica](https://github.com/benoitc/erica) tool to push. The binary is committed to the repo. You can also download the signed release :

    curl https://people.apache.org/~dch/dist/tools/erica > erica

Note : the `erica` script needs to be in the same dir as the app files, otherwise you'll get an error on push. (So don't add it to your PATH for instance!)

Chmod the erica script:

    chmod 775 erica

Push the couchapp with erica:

    ./erica push http://admin:pass@localhost:5984/medic-reporter

### FFOS

`manifest.webapp` is used by FF OS's style of app development.

To use it simply start a http server in the _root_ directory:

    python run_server.py
    Manifest URL: http://0.0.0.0:9100/manifest.webapp
    Serving app at http://0.0.0.0:9100/

## Usage

### Upload Forms

You must make a list of JSON forms available via http so that medic-reporter
can pull them, with the following format:

```
{
  settings: {
    formCode1: {<form1>},
    formCode2: {<form2>},
    ...,
    formCodeN: {formN}
  }
}
```

Each form should follow the Medic Mobile JSON forms format. ([Format example](https://github.com/medic/medic-webapp/blob/master/tests/nodeunit/form_definitions.js#L6)).


If you are using [medic-webapp](https://github.com/medic/medic-webapp), leave the default setting
which will fetch the forms from the webapp.

### Configure Form List URL

Once you uploaded your forms, if you are not user Medic Mobile webapp, edit default settings in
[js/app.js](js/app.js) to point medic-reporter to your forms.


## Query Parameters

You can also specify settings with URL query parameters.
Special query parameters are:

* `_hide_topbar` - 0 to display and 1 to hide
* `_hide_forms` - comma separated list of form codes to hide
* `_show_forms` - comma separated list of form codes to show, all others will be hidden
* `_locale` - preset the local the form will render in
* `_sync_url` - path to resource where messages are added
* `_forms_list_path` - path to JSON encoded forms resource
* `_gateway_num` - set the gateway number
* `_debug` - show the debug panel
* `_textforms_option` - show the textforms checkbox option
* `_use_textforms` - if set to 'true' then toggle it to on
* `_embed_mode=1` - uses tabs on the interface; more compact and useful for embedding
* `_embed_mode=2` same as 1 but provides even simpler interface by removing the
  compose and configuration functionality.

Example :
`http://localhost:5988/medic-reporter/_design/medic-reporter/_rewrite/?_embed_mode=1&_show_forms=REF,VAC`


All other parameters attempt to bind into the form.

## License & Copyright

Copyright 2013 Medic Mobile, 501(c)(3)  <hello@medicmobile.org>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
