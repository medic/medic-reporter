/**
 * User: ryan
 * Date: 12-11-02
 * Time: 2:03 PM
 */
define([
    'jquery',
    'underscore',
    'director',
    'json.edit',
    'codemirror',
    'schema-support',
    './json_format',
    'json!json-forms/simple-example.json',
    'select2',
    'jam/codemirror/mode/javascript/javascript',
    'domReady!',
    'jam/json.edit/addons/enumlabels'
], function ($, _, director, jsonEdit, CodeMirror, translator, json_format, example) {


    var exports = {},
        routes = {
            '/' : no_form_selected,
            '/*/*/*' : form_and_code,
            '/*/*' : form_and_code,
            '/*' : form_only
        },
        router = director.Router(routes),
        json_forms_path = 'json-forms',
        gateway_num = '+13125551212', // todo: make option in app
        editor,
        schema_used,
        selected_form;

    exports.init = function () {


        init_json_display();
        initNameSelect();

        findAvailableJson(function(err, data){
            renderSelect(data);
            router.init('/');
        })

    };


    function no_form_selected() {
        // on first load, just show the example json form VPD, in english
        showForm(example, 'ZZZZ', 'en');
    }

    function form_only(form_name, callback) {
        $('#choose-form').select2('val', form_name);
        var form_url = resolve_form_url(form_name);
        getForm(form_url, function(err, form) {
            var codes = getFormCodes(form);
            renderFormNameSelect(form_name, codes);
            //$('#choose-form').select2('val', '');
            if (_.isFunction(callback)) {
                callback(null, {
                   form_url : form_url,
                    form : form,
                    codes : codes
                });
            }

        });
    }


    function form_and_code(form_name, code, /*optional*/ lang) {
        if (!lang) lang = 'en';
        form_only(form_name, function(err, details){
            $('#choose-name').select2('val', code);
            showForm(details.form, code, lang);
        })

    }


    function resolve_form_url(form_name) {
        return json_forms_path + '/' + form_name;
    }


    function sendSMS(num, msg, callback) {

      console.log("Sending SMS to "+ num +"; message '"+ msg +"' ...");

      var err;

      if (typeof num !== 'string' || !num)
          err = 'Please include a number.';
      else if (typeof msg !== 'string' || !msg)
          err = 'Please include a message.';
      else if (!navigator || !navigator.mozSms)
          err = 'Mozilla SMS API not available.';

      if (err) return callback(err, msg);

      var r = navigator.mozSms.send(num, msg);
      r.onSuccess = callback(null, r.message);
      r.onError = callback('SMS sending failed.');

    }

    // Render and bind a form
    function showForm(forms, code, lang) {
        $form_fields = $('#form_fields');
        $form_fields.empty();
        var schemafied = translator(forms, lang);
        schema_used.setValue(json_format(JSON.stringify(schemafied[code].schema)));
        var rendered = jsonEdit('form_fields', schemafied[code].schema);

        function convertToMuvukuFormat(data) {
            var msg = '';
            schemafied[code].schema.order.forEach(function(k) {
                // handle msg header on first iteration
                if (!msg)
                    return msg = '1!'+code+'!'+data[k];
                msg += '#'+ data[k];
            });
            return msg;
        };

        $('form.main').on('submit', function () {
            try {
                var err_alert = $('.alert');

                err_alert.hide(10);

                var data = rendered.collect();
                if (!data.result.ok) {

                    var msg = generateFieldErrorMsg(data.result, schemafied[code].schema);

                    err_alert.show(200)
                        .find('button.close')
                        .on('click', function () { err_alert.hide(); })
                    err_alert.find('h4')
                         .html(data.result.msg + '<br/>' +  msg);
                    return false;
                }
                schemafied[code].validate(data.data, function(err){

                    if (err) {
                        var msg = generateValidationErrorMsg(err);
                        err_alert.show(200)
                            .find('button.close')
                            .on('click', function () { err_alert.hide(); })
                        err_alert.find('h4')
                             .html(msg);
                        return false;
                    }


                    schemafied[code].post_save(data.data, function(err, doc) {
                        editor.setValue(json_format(JSON.stringify(doc)));
                        var msg = convertToMuvukuFormat(doc);
                        sendSMS(gateway_num, msg, function(err, data) {
                            if (err) {
                                console.error(err);
                                $('.sms_message .error').html('<p>'+err+'</p>');
                            }
                            $('.sms_message .message').html(
                                '<p>'+gateway_num+': '+data+'</p>'
                            );
                        });
                        console.log(err, doc);
                    });
                })


            } catch (e) {
                console.log(e);
            }
            return false;
        });
    }


    function generateValidationErrorMsg(errors) {
        var errs = _.map(errors, function(err) {
            return '<b>'+ err.title+ '</b> ' + err.msg
        });
        return errs.join('<br/>');
    }


    function generateFieldErrorMsg(result, schema) {
        var error = [];
        _.each(result.data, function(value, key){
            if (!value.ok) {
                var msg = value.msg;
                var title = schema.properties[key].title;
                error.push('<b>'+ title+ '</b> ' + msg );
            }
        });
        return error.join('<br/>');

    }


    // Used to find all the .json files in the root of this project
    function findAvailableJson(callback) {
        var results = [];
        $.get(json_forms_path, function(data) {
            var $root = $(data);
            $root.find('li a').each(function(i, row) {
                var href = $(row).attr('href');
                if (href.indexOf('.json', href.length - 5) !== -1) {
                    results.push({
                        id :  href,
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


        var elem2 = $('.schema_used').get()[0];
        schema_used = CodeMirror(elem2, {
            value : '',
            readOnly : true,
            theme : 'monokai',
            mode : {name: "javascript", json: true}
        });
        schema_used.setSize(null, 400 );

    }

    function renderSelect(data){
        $('#choose-form').select2({
            data : data,
            initSelection : function(element, callback) {
                var val = $(element).val();
                var data = {id: val, text: val};
                callback(data);
            }
        }).on('change', function(){
            var val = $(this).val();
            router.setRoute('/' + val);
        })
    }


    function getForm(url, callback) {
        $.getJSON(url, function(data){
            callback(null, data);
        })
    }


    function getFormCodes(form) {
        return _.map(form, function(entry){
            if (entry.meta && entry.meta.code) {
                return {
                    id: entry.meta.code,
                    text : entry.meta.code
                }
            }
        });
    }

    function initNameSelect(){
        $('#choose-name').select2({
            data : [],
        }).select2('disable');
    }

    function renderFormNameSelect(form_name, codes) {

        $('#choose-name').select2({
            data : codes,
            initSelection : function(element, callback) {
                var val = $(element).val();
                var data = {id: val, text: val};
                callback(data);
            }
        })
            .select2('enable')
            .off('change')
            .on('change', function(){
                var code = $(this).val();
                router.setRoute('/' + form_name + '/' + code);
            })
    }


    return exports;
});
