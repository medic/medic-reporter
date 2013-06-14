var jam = {
    "packages": [
        {
            "name": "bootstrap",
            "location": "jam/bootstrap"
        },
        {
            "name": "codemirror",
            "location": "jam/codemirror",
            "main": "lib/codemirror.js"
        },
        {
            "name": "couchr",
            "location": "jam/couchr",
            "main": "couchr-browser.js"
        },
        {
            "name": "director",
            "location": "jam/director",
            "main": "director.js"
        },
        {
            "name": "domReady",
            "location": "jam/domReady",
            "main": "domReady.js"
        },
        {
            "name": "events",
            "location": "jam/events",
            "main": "events.js"
        },
        {
            "name": "jquery",
            "location": "jam/jquery",
            "main": "jquery.js"
        },
        {
            "name": "jquery.lego",
            "location": "jam/jquery.lego",
            "main": "jquery.lego.js"
        },
        {
            "name": "json",
            "location": "jam/json",
            "main": "json.js"
        },
        {
            "name": "json.edit",
            "location": "jam/json.edit",
            "main": "json.edit.js"
        },
        {
            "name": "querystring",
            "location": "jam/querystring",
            "main": "querystring.js"
        },
        {
            "name": "schema-support",
            "location": "jam/schema-support",
            "main": "translator.js"
        },
        {
            "name": "text",
            "location": "jam/text",
            "main": "text.js"
        },
        {
            "name": "underscore",
            "location": "jam/underscore",
            "main": "underscore.js"
        }
    ],
    "version": "0.2.17",
    "shim": {
        "director": {
            "exports": "Router"
        }
    }
};

if (typeof require !== "undefined" && require.config) {
    require.config({
    "packages": [
        {
            "name": "bootstrap",
            "location": "jam/bootstrap"
        },
        {
            "name": "codemirror",
            "location": "jam/codemirror",
            "main": "lib/codemirror.js"
        },
        {
            "name": "couchr",
            "location": "jam/couchr",
            "main": "couchr-browser.js"
        },
        {
            "name": "director",
            "location": "jam/director",
            "main": "director.js"
        },
        {
            "name": "domReady",
            "location": "jam/domReady",
            "main": "domReady.js"
        },
        {
            "name": "events",
            "location": "jam/events",
            "main": "events.js"
        },
        {
            "name": "jquery",
            "location": "jam/jquery",
            "main": "jquery.js"
        },
        {
            "name": "jquery.lego",
            "location": "jam/jquery.lego",
            "main": "jquery.lego.js"
        },
        {
            "name": "json",
            "location": "jam/json",
            "main": "json.js"
        },
        {
            "name": "json.edit",
            "location": "jam/json.edit",
            "main": "json.edit.js"
        },
        {
            "name": "querystring",
            "location": "jam/querystring",
            "main": "querystring.js"
        },
        {
            "name": "schema-support",
            "location": "jam/schema-support",
            "main": "translator.js"
        },
        {
            "name": "text",
            "location": "jam/text",
            "main": "text.js"
        },
        {
            "name": "underscore",
            "location": "jam/underscore",
            "main": "underscore.js"
        }
    ],
    "shim": {
        "director": {
            "exports": "Router"
        }
    }
});
}
else {
    var require = {
    "packages": [
        {
            "name": "bootstrap",
            "location": "jam/bootstrap"
        },
        {
            "name": "codemirror",
            "location": "jam/codemirror",
            "main": "lib/codemirror.js"
        },
        {
            "name": "couchr",
            "location": "jam/couchr",
            "main": "couchr-browser.js"
        },
        {
            "name": "director",
            "location": "jam/director",
            "main": "director.js"
        },
        {
            "name": "domReady",
            "location": "jam/domReady",
            "main": "domReady.js"
        },
        {
            "name": "events",
            "location": "jam/events",
            "main": "events.js"
        },
        {
            "name": "jquery",
            "location": "jam/jquery",
            "main": "jquery.js"
        },
        {
            "name": "jquery.lego",
            "location": "jam/jquery.lego",
            "main": "jquery.lego.js"
        },
        {
            "name": "json",
            "location": "jam/json",
            "main": "json.js"
        },
        {
            "name": "json.edit",
            "location": "jam/json.edit",
            "main": "json.edit.js"
        },
        {
            "name": "querystring",
            "location": "jam/querystring",
            "main": "querystring.js"
        },
        {
            "name": "schema-support",
            "location": "jam/schema-support",
            "main": "translator.js"
        },
        {
            "name": "text",
            "location": "jam/text",
            "main": "text.js"
        },
        {
            "name": "underscore",
            "location": "jam/underscore",
            "main": "underscore.js"
        }
    ],
    "shim": {
        "director": {
            "exports": "Router"
        }
    }
};
}

if (typeof exports !== "undefined" && typeof module !== "undefined") {
    module.exports = jam;
}