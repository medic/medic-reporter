Medic Reporter is a web interface to send reports to a Medic Mobile instance (see [medic-webapp](https://github.com/medic/medic-webapp)). You can send all formats that Medic Mobile supports :
Textforms [link to doc?](), [Medic Collect](https://github.com/medic/medic-collect) or SimApp [link to doc?]().

Medic Reported is a couchapp, install it in a couchdb server, and then access it through:

`<server url>/medic-reporter/_design/medic-reporter/_rewrite/`

You're guided to fill in reports:

![Screenshot: field validation](https://cloud.githubusercontent.com/assets/911434/16682400/ca616f24-44fa-11e6-8b21-f13c6dec875f.png)

You can use the different report formats that Medic Mobile supports:

![Screenshot: different report formats](https://cloud.githubusercontent.com/assets/911434/16682386/bba1a6d4-44fa-11e6-8778-ad002703c1c6.png)

## Install

Clone the repo and update submodules:

    git clone --recursive https://github.com/medic/medic-reporter
    cd medic-reporter

Get the erica tool:

    curl https://people.apache.org/~dch/dist/tools/erica > erica

Push the couchapp with erica:

    erica push http://admin:pass@localhost:5984/medic-reporter

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

`{ settings: [ {<form1>, {<form2>}, ..., {formN}] }`


Each form should follow the Medic Mobile JSON forms format ([link to format doc?]()).


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
