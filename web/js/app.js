/**
 * User: ryan
 * Date: 12-11-02
 * Time: 2:03 PM
 */
define([
    'jquery',
    'json.edit',
    '../../jsonschema_translator/translator',
    'json!../../simple-example.json',
    'select2'
], function ($, jsonEdit, translator, example) {


    var exports = {};

    exports.init = function () {

        // on first load, just show the example json form VPD, in english
        showForm(example, 'VPD', 'en');

        findAvailableJson(function(err, data){
            renderSelect(data);
        })

    };


    // Render and bind a form
    function showForm(forms, code, lang) {
        var schemafied = translator(forms, lang);
        var rendered = jsonEdit('form', schemafied[code].schema);
        $('form').on('submit', function () {
            var err_alert = $('.alert');

            err_alert.hide(10);

            var data = rendered.collect();
            if (!data.result.ok) {

                err_alert.show(200)
                    .find('button.close')
                    .on('click', function () { err_alert.hide(); })
                err_alert.find('h4')
                     .text(data.result.msg);
                return false;
            }
            schemafied[code].post_save(data.data, function(err, doc){
                $('.results').val(JSON.stringify(doc));
                console.log(err, doc);
            })

            return false;
        });
    }

    // Used to find all the .json files in the root of this project
    function findAvailableJson(callback) {
        var results = [];
        $.get('../', function(data) {
            var $root = $(data);
            $root.find('li a').each(function(i, row) {
                var href = $(row).attr('href');
                if (href.indexOf('.json', href.length - 5) !== -1) {
                    results.push({
                        id : href,
                        text : href
                    });
                }
            })
            callback(null, results);
        });
    }


    function renderSelect(data){
        $('#choose-form').select2({
            data : data
        }).on('change', function(){
            var val = $(this).val();
            console.log(val);
        })
    }



    return exports;
});