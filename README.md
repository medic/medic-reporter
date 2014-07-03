## Install

Clone the repo and update submodules:

    git clone --recursive https://github.com/medic/medic-reporter
    cd medic-reporter

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

You must make a list of JSON forms available via http on the server so reporter
can load them. If using medic-webapp this is typically done with a JSON
formatted file of a list of form schemas that is uploaded in your Medic Mobile
settings.

### Configure Form List URL

Once you uploaded your forms you can configure this location your
medic-reporter settings.  If you are using Medic Mobile then the defaults
should suffice here.

## Configuration Parameters

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
