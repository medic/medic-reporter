
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(['./src/validations'],factory);
    } else {
        root.returnExports = factory(root.validations);
    }
}(this, function (validations) {

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
            validate : null,
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


        // fields
        if (form.fields) {
            result.schema.properties = {};
            var keys = Object.keys(form.fields);
            keys.forEach(function(key) {
                result.schema.properties[key] = convertProperty(key, form.fields[key], lang);
            });
        }


        result.validate = function(doc, callback) {
            var errors = [];

            // check for validation functions on each property that need to be run
            _.each(result.schema.properties, function(prop_details, prop_name){
                if (prop_details.validations) {
                    _.each(prop_details.validations, function(validation_func, key) {
                        var value = doc[prop_name];

                        var result = validation_func(value)

                        if (!result.ok) {
                            var err = {
                                msg : getLabel(result.error, lang),
                                name  : prop_name,
                                title : prop_details.title
                            }

                            errors.push(err);
                        }
                    })
                }
            });

            // check for form level validations
            if (form.validations) {
                _.each(form.validations, function(validation_function, key){
                    // for now, don't do anything.
                });
            }


            if (errors.length > 0) return callback(errors);
            callback(null);
        }

        result.post_save = function(doc, callback) {
            if (form.meta && form.meta.code) {
                doc.form = form.meta.code;
            }
            callback(null, doc);
        }

        return result;
    }



    function convertProperty(key, property, lang) {
        var prop = {};

        // seems equivalent
        prop.type = property.type;
        prop.title = getLabel(property.labels.short, lang);

        if (property.required) prop.required = true;

        if (property.type === "string") {
            if (property.length) {
                prop.minLength = property.length[0];
                prop.maxLength = property.length[1];
            }
            if (property.flags) {
                if (property.flags.input_digits_only) {
                    prop.pattern = '[0-9]+'
                }
            }
        }

        if (property.type === "integer") {
            if (property.length) {
                prop.minLength = property.length[0];
                prop.maxLength = property.length[1];
            }
            if (property.range) {
                prop.minimum = property.range[0];
                prop.maximum = property.range[1];
            }
        }

        if (property.list) {
            prop['je:hint'] = 'enumlabels';
            prop['je:enumlabels'] = {};
            prop.enum = [];
            for (var i=0; i < property.list.length; i++) {
                var item_arr = property.list[i];
                var val = item_arr[0];
                var label = getLabel(item_arr[1]);
                prop['je:enumlabels'][val] = label;
                prop.enum.push(val);
            }
        }

        if (property.validations && Object.keys(property.validations).length > 0) {
            prop.validations = {};
            _.each(property.validations, function(value, key){
                prop.validations[key] = validations[key];
            })
        }

        return prop;
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