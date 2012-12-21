
// if the module has no dependencies, the above pattern can be simplified to
(function (root, factory) {
    if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else {
        // Browser globals (root is window)
        root.validations = factory();
    }
}(this, function () {


    function result(ok, error) {
        var response = {
            ok : ok
        }
        if (!ok) {
            response.error = error
        }
        return response;
    }


    return {

        is_numeric_year : function(value) {
            if (value >= 2011 && value <= 2099) return result(true);
            return result(false, {
                en : "Year must be between 2011 and 2099",
                fr : "l'ann\5e doit etre entre 2011 et 2099"
            });
        },
        is_numeric_month : function(value) {
            if (value >= 1 && value <= 12) {
                return result(true);
            }
            return result(false, {
                en : "Month must be between 1 and 12",
                fr : "le mois doit etre entre 1 et 12"
            });
        },
        is_numeric_day: function(value) {
            if (value >= 1 && value <= 31) {
                return result(true);
            }
            return result(false, {
                en : "Day must be between 1 and 31",
                fr : "Le jour doit etre entre 1 et 31"
            });
        },
        is_valid_time: function(value) {
            if (value >= 0 && value <= 2359 &&
                        value % 100 >= 0 && value % 100 <= 59) return result(true);
            return result(false, {
                en : "Hours must be bewteen 0000 and 2359",
                fr : "L'heure doit etre entre 0000 et 2359"
            });
        },
        is_numeric_daysago: function(value) {
            return result(true);
        },
        is_numeric_district: function(value) {
            if (value >= 1 && value <= 20) {
                return result(true);
            }
            return result(false, {
                en : "District must be between 1 and 20",
                fr : "le district de sant\5 doit etre entre 1 et 20"
            });
        }



    };
}));