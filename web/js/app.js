/**
 * User: ryan
 * Date: 12-11-02
 * Time: 2:03 PM
 */
define(['jquery', 'json.edit'], function ($, jsonEdit) {
    var exports = {};
    exports.init = function () {

        var form = {
            "description": "A person",
            "type": "object",
            "properties": {
                name: {
                    type: "string",
                    minLength: 1
                },
                age: {
                    type: "integer",
                    maximum: 125
                },
                address : {
                    "type": "object",
                    "properties": {
                        street: {
                            type: "string",
                            minLength: 1
                        },
                        city : {
                            type: "string"
                        }
                    }
                }
            }
        };
        form.default = {
            name : 'Ryan',
            age : 2332
        }

        var editor = jsonEdit('form', form);
        $('form').on('submit', function () {
            var err_alert = $('.alert');

            err_alert.hide(10);

            var form = editor.collect();
            if (!form.result.ok) {

                err_alert.show(200)
                    .find('button.close')
                    .on('click', function () { err_alert.hide(); })
                err_alert.find('h4')
                     .text(form.result.msg);
                return false;
            }

            return false;
        });
    };
    return exports;
});