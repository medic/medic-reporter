
(function (root, factory) {

    if (typeof define === 'function' && define.amd) {
        define(['./src/validations'],factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.returnExports = factory(root.validations);
    }
}(this, function (validations) {

    if (!validations) {
         validations =  {

            result: function(ok, error) {
                var response = {
                    ok : ok
                }
                if (!ok) {
                    response.error = error
                }
                return response;
            },
            is_numeric_year : function(value) {
                if (value >= 2011 && value <= 2099) return validations.result(true);
                return validations.result(false, {
                    en : "Year must be between 2011 and 2099",
                    fr : "l'ann\5e doit etre entre 2011 et 2099"
                });
            },
            is_numeric_month : function(value) {
                if (value >= 1 && value <= 12) {
                    return validations.result(true);
                }
                return validations.result(false, {
                    en : "Month must be between 1 and 12",
                    fr : "le mois doit etre entre 1 et 12"
                });
            },
            is_numeric_day: function(value) {
                if (value >= 1 && value <= 31) {
                    return validations.result(true);
                }
                return validations.result(false, {
                    en : "Day must be between 1 and 31",
                    fr : "Le jour doit etre entre 1 et 31"
                });
            },
            is_valid_time: function(value) {
                if (value >= 0 && value <= 2359 &&
                            value % 100 >= 0 && value % 100 <= 59) return validations.result(true);
                return validations.result(false, {
                    en : "Hours must be bewteen 0000 and 2359",
                    fr : "L'heure doit etre entre 0000 et 2359"
                });
            },
            is_numeric_daysago: function(value) {
                return validations.result(true);
            },
            is_numeric_district: function(value) {
                if (value >= 1 && value <= 20) {
                    return validations.result(true);
                }
                return validations.result(false, {
                    en : "District must be between 1 and 20",
                    fr : "le district de sant\5 doit etre entre 1 et 20"
                });
            }
        };
    }




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
            result.schema.order = [];
            // preserve ordering
            for (var k in form.fields) {
                result.schema.order.push(k);
                result.schema.properties[k] = convertProperty(
                    k, form.fields[k], lang
                );
            }
        }


        result.validate = function(doc, callback) {
            var errors = [];

            // check for validation functions on each property that need to be run
            _.each(result.schema.properties, function(prop_details, prop_name){
                if (prop_details.validations) {
                    _.each(prop_details.validations, function(validation_func, key) {
                        var value = doc[prop_name];

                        if (!validation_func) return;
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
        prop.title = getLabel(
            property.labels.short || property.labels.description, lang
        );

        // saving tiny field name here for now
        if (property.labels.tiny)
            prop.tiny = getLabel(property.labels.tiny, lang);

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
                var label = getLabel(item_arr[1], lang);
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
        lang = lang || 'en';
        if (typeof label === 'string')
            return label;
        if (typeof label === 'object') {
            if (label[lang])
                return label[lang];
            // otherwise just return first val
            for (var key in label) {
                return label[key];
            }
        }
    }

}));
