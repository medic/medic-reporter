/**
 * User: ryan
 * Date: 12-11-02
 * Time: 2:03 PM
 */
define(['jquery', 'json.edit', '../../jsonschema_translator/translator', 'json!../../simple-example.json'], function ($, jsonEdit, translator, example) {
    var exports = {};


    function findAvailableJson(callback) {
        var results = [];
        $.get('../', function(data) {
            var $root = $(data);
            $root.find('li a').each(function(i, row) {
                var href = $(row).attr('href');
                if (href.indexOf('.json', href.length - 5) !== -1) {
                    results.push(href);
                }
            })
            callback(null, results);
        });
    }


    function showForm(forms, code) {
        var tl = translator(forms);
        var editor = jsonEdit('form', tl[code].schema);
        $('form').on('submit', function () {
            var err_alert = $('.alert');

            err_alert.hide(10);

            var data = editor.collect();
            if (!data.result.ok) {

                err_alert.show(200)
                    .find('button.close')
                    .on('click', function () { err_alert.hide(); })
                err_alert.find('h4')
                     .text(data.result.msg);
                return false;
            }
            tl[code].post_save(data.data, function(err, doc){
                $('.results').val(JSON.stringify(doc));
                console.log(err, doc);
            })

            return false;
        });
    }


    exports.init = function () {

        console.log(example);
        showForm(example, 'VPD');

    };
    return exports;
});