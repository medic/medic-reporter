
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.returnExports = factory();
    }
}(this, function () {

    return function(form, lang) {
        var result = {};
        if (!lang) lang = 'en';

        // if passed in form is an array of forms, do each
        if (form && Array.isArray(form)) {
            form.forEach(function(form_details) {
                var converted = convertForm(form_details, lang);
                result[converted.key] = converted;
            })
        }

        // if form is just a single form object
        else if (form && form === Object(form)) {
            var converted = convertForm(form, lang);
            result[converted.key] = converted;
        }

        return result;
    }


    function convertForm(form, lang) {

        // the object the end user will interact with
        var result = {
            key : 'temp',
            // The JSON schema
            schema : {

            },
            // validation hooks
            validation : {},
            // ofter the save, run the doc through here
            post_save : null
        }

        // set the result key based on form code
        if (form.meta) {
            if (form.meta.code) {
                result.schema.name = form.meta.code;
                result.key = form.meta.code;
            }

            if (form.meta.label) {
                // use requested language
                result.schema.description = getLabel(form.meta.label, lang);

            }

        }






        result.post_save = function(doc, callback) {
            if (form.meta && form.meta.code) {
                doc.form = form.meta.code;
            }
        }

        return result;
    }



    function getLabel(label, lang) {
        // use requested language
        var lbl = label[lang];

        // if the request lang is not available, use english
        if (!lbl) {
            lbl = label['en'];
        }

        // fallback if still not set, use the first
        if (!lbl) {
            for (var key in label) {
                lbl = label[key];
                break;
            }
        }
        return lbl;
    }





}));