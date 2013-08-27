## Install

Clone the repo and update submodules:

    git clone --recursive https://github.com/medic/muvuku-webapp
    cd muvuku-webapp

Push the couchapp with erica:

    erica push http://localhost:5984/muvuku

### FFOS

`manifest.webapp` is used by FF OS's style of app development.

To use it simply start a http server in the _root_ directory:

    python run_server.py 
    Manifest URL: http://0.0.0.0:9100/manifest.webapp
    Serving app at http://0.0.0.0:9100/

## Usage

You should be shown the `examples` forms and can select any other `JSON` file
that is in `forms/index.json`.

## Configuration Parameters

Special parameters are:

* `_hide_topbar` - set to true so the dashboard topbar will not be displayed
* `_locale` - preset the local the form will render in
* `_sync_url` - set the sync_url value
* `_gateway_num` - set the gateway number
* `_debug` - show the debug panel
* `_textforms_option` - show the textforms checkbox option
* `_use_textforms` - if set to 'true' then toggle it to on.
* `_embed_mode` query param that uses tabs for use within kujua 

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
