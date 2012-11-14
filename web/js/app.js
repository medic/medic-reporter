/**
 * User: ryan
 * Date: 12-11-02
 * Time: 2:03 PM
 */
define([
    'jquery',
    'underscore',
    'json.edit',
    'codemirror',
    '../../jsonschema_translator/translator',
    './json_format',
    'json!../../simple-example.json',
    'select2',
    'jam/codemirror/mode/javascript/javascript',
], function ($, _, jsonEdit, CodeMirror, translator, json_format, example) {


    var exports = {},
        editor,
        selected_form;

    exports.init = function () {

        init_json_display();
        initNameSelect();

        // on first load, just show the example json form VPD, in english
        showForm(example, 'VPD', 'en');

        findAvailableJson(function(err, data){
            renderSelect(data);
        })

    };


    // Render and bind a form
    function showForm(forms, code, lang) {
        $form_fields = $('#form_fields');
        $form_fields.empty();
        var schemafied = translator(forms, lang);
        var rendered = jsonEdit('form_fields', schemafied[code].schema);
        $('form.main').live('submit', function () {
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
                editor.setValue(json_format(JSON.stringify(doc)));
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
                        id : '../' + href,
                        text : href
                    });
                }
            })
            callback(null, results);
        });
    }

    function init_json_display() {
        var elem = $('.results').get()[0];
        editor = CodeMirror(elem, {
            value : '',
            theme : 'monokai',
            mode : {name: "javascript", json: true}
        });
        editor.setSize(null, 400 );
    }

    function renderSelect(data){
        $('#choose-form').select2({
            data : data
        }).on('change', function(){
            var val = $(this).val();
            getForm(val, function(err, form){
                renderFormNameSelect(form);
            });
        })
    }


    function getForm(url, callback) {
        $.getJSON(url, function(data){
            callback(null, data);
        })
    }


    function initNameSelect(){
        $('#choose-name').select2({
            data : []
        }).select2('disable');
    }

    function renderFormNameSelect(form) {
        var codes = _.map(form, function(entry){
            if (entry.meta && entry.meta.code) {
                return {
                    id: entry.meta.code,
                    text : entry.meta.code
                }
            }
        });
        $('#choose-name').select2({
            data : codes
        })
            .select2('enable')
            .on('change', function(){
                var code = $(this).val();
                showForm(form, code, 'en');
            })
    }


    return exports;
});