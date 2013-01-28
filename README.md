This is an example project using FF OS's manifest.webapp style of app development.

To use it simply start a http server in the _root_ directory:

    python run_server.py 
    Manifest URL: http://0.0.0.0:9100/manifest.webapp
    Serving app at http://0.0.0.0:9100/

You will be shown the simple-example.json form and can select any other .json
file in the dir to send SMS forms.

Todos
=====

Fix validation on subsequent sends.

Add localization, should probably have a dropdown for locale.
https://github.com/fabi1cazenave/webL10n

Fix styles/css, for some reason bootstrap looked like crap on 324x480,
responsive layout would be ideal so it works on most devices.

Be able to send SMS when running on iOS/Android/FFOS.  Check for feasiblity on
Android + Aurora or what options we have for sending SMS when using Android
without internet connection.  Probably ok to require internet connection?

Save sent/completed forms and maintain a history so last x forms can be edited
and re-sent.  Show clear confirmation when SMS message are sent/forms are
submitted. Maybe add a history tab that displays this information.  Should
probably use local storage or maybe pouchdb (+ browserid?).

