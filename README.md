Install
=======

Push the couchapp with erica:

    erica push http://localhost:5984/json-forms

FFOS
-----

`manifest.webapp` is used by FF OS's style of app development.

To use it simply start a http server in the _root_ directory:

    python run_server.py 
    Manifest URL: http://0.0.0.0:9100/manifest.webapp
    Serving app at http://0.0.0.0:9100/


Usage
======

You should be shown the `examples` forms and can select any other `JSON` file
that is in `json-forms/index.json`.


Todos
=====

Add text input field where sms message shown and available to be edited, so a
free-form text message can also be sent via SMS or HTTP.

Fix validation on subsequent sends.

Add localization, should probably have a dropdown for locale.
https://github.com/fabi1cazenave/webL10n

Be able to send SMS when running on iOS/Android/FFOS.  Check for feasiblity on
Android + Aurora or what options we have for sending SMS when using Android
without internet connection.  Probably ok to require internet connection?

Save sent forms and maintain a history, then x forms can be edited and sent or
re-sent, emulating Muvuku.  Show clear confirmation when SMS message are
sent/forms are submitted. Maybe add a history tab that displays this
information.  Should probably use local storage or maybe pouchdb (+
browserid?).

