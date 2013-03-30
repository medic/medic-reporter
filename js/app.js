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
    'jam/codemirror/mode/javascript/javascript',
    'domReady!',
    'jam/json.edit/addons/enumlabels',
    'jam/bootstrap/js/bootstrap-dropdown.js'
], function ($, _, director, jsonEdit, CodeMirror, translator, json_format, example) {


    var exports = {},
        routes = {
            '/' : no_form_selected,
            '/*/*/*' : loadProjectAndForm,
            '/*/*' : loadProjectAndForm,
            '/*' : loadProjectAndForm
        },
        router = director.Router(routes),
        hide_count = true,
        editor,
        schema_used,
        selected_form,
        log;

    var defaults = {
        locale: 'en',
        sync_url: '/kujua-base/_design/kujua-base/_rewrite/add',
        json_forms_path: 'json-forms',
        gateway_num: '+13125551212'
    };

    exports.init = function() {
    };

    exports.onDOMReady = function() {
        $(".footer .year").text(new Date().getFullYear());
        $(".version").text(new Date().getFullYear());
        initListeners();
        findAvailableJson(function(err, data){
            initProjectSelect(data);
            router.init('/');
        });
        initJSONDisplay();
    };

    function initListeners() {
        $('#menu a').on('click', onClickMenuItem);
        $('#messages form').on('submit', onSendMessage);
        $('#message').on('keyup', onMessageKeyUp);
        $('[data-dismiss=alert]').on('click', function () {
            $(this).parent('div').hide();
        })
    }

    // Used to find all the .json files in the root of this project
    function findAvailableJson(callback) {
        var results = [];
        $.get(defaults.json_forms_path+'/index.json', function(data) {
            var index;
            if (typeof data === 'string')
                index = JSON.parse(data)[0];
            else
                index = data[0];
            index.forEach(function(file) {
                results.push({
                    id: file,
                    text: file
                });
            });
            callback(null, results);
        });
    }

    function initProjectSelect(data){
        console.log('initProjectSelect data',data);
        var $input = $('#choose-project');
        _.each(data, function(el, idx) {
            var $option = $('<option/>');
            $option.attr('value',el.id);
            console.log('project el',el);
            $option.text(el.text.replace('.json',''));
            $input.append($option);
        });
        $input.on('change', function(){
            var val = $(this).val();
            router.setRoute('/' + val);
        });
        $input.closest('form').show();
        $input.closest('.well').find('.loader').hide();
    }


    function onClickMenuItem(ev) {
        ev.preventDefault();
        var $link = $(this),
            type = $link.attr('data-toggle');
        $link.closest('ul').find('li').each(function(el, idx) {
            console.log('el',el);
            console.log('idx',idx);
            var $el = $(el),
                t = $el.find('a').attr('data-toggle');
            if (type === 'all')
                $('#'+t).show(300);
            else if (t === type)
                $('#'+t).show(300);
            else
                $('#'+t).hide(300);
        });
    }

    function onMessageKeyUp (ev) {
        var $input = $(ev.target),
            count = $input.val().length;
        if (count > 100)
            hide_count = false;
        if (!hide_count)
            $input.parents('.controls').find('.count').html(count + ' characters');
    }

    function no_form_selected() {
        // on first load, just show the example json form VPD, in english
        router.setRoute('/simple-example.json/ZZZZ');
    }

    function getString(str, lang) {
        lang = lang || defaults.locale;
        if (typeof str === 'string')
            return str;
        if (typeof str === 'object') {
            if (str[lang]) return str[lang];
            else if (str.fr)
                return str.fr;
            else if (str.ne)
                return str.ne;
        }
    }

    function loadProject(file, callback) {
        console.log('loadProject');
        var url = defaults.json_forms_path + '/' + file;
        $.getJSON(url, function(data) {
            initFormSelect(file, data);
            if (_.isFunction(callback))
                callback(null, data);
        });
    }


    function loadProjectAndForm(project, form_code) {
        console.log('loadProjectAndForm');
        loadProject(project, function(err, forms){
            // choose either first form or match form code argument
            var form;
            _.each(forms, function(f) {
                if (!form)
                    form = f;
                if (form_code && form_code === formCode(f))
                    form = f;
            });
            showForm(form);
        })
    }

    function formatDate(date) {
        var year = date.getYear() - 100,
            month = date.getMonth() + 1,
            day = date.getDate(),
            hours = date.getHours(),
            minutes = date.getMinutes();
        //return "#{month}-#{day}-#{year} #{hours}:#{minutes}"
        return month+'-'+day+'-'+year+' '+hours+':'+minutes;
    }

    function request(options, callback) {

        var data = options.data,
            host = options.host || 'localhost',
            port = options.port || 5984,
            path = options.path,
            method = options.method || 'POST',
            headers = options.headers || {'Content-Type': 'application/x-www-form-urlencoded'};

        $.ajax({
            success: function(data, textStatus, xhr) {
                callback(null, data);
            },
            error: function(xhr, textStatus, error) {
                callback(error);
            },
            headers: headers,
            url: path,
            type: method,
            data: data
        });

    };

    function postMessageHTTP(options, callback) {
        options.path = options.path || defaults.sync_url;
        options.data = {
            message_id: Math.ceil(Math.random() * 100000),
            sent_timestamp: new Date().valueOf(),
            message: options.message,
            from: options.phone
        };
        var val = log.getValue();
        log.setValue(json_format(JSON.stringify(options.data)) +'\n'+val);
        $('#messages-log').prepend('<p class="well well-small pull-right message">'+options.data.message+'</p>');
        request(options, callback);
    }

    function hasSMSAPI() {
      if (navigator && navigator.mozSms) return true;
    }

    function queueSMS(options) {
    }

    function sendSMS(options, callback) {

      console.log("Sending SMS to "+ num +"; message '"+ msg +"' ...");

      var err,
          num = options.phone,
          msg = options.message;

      if (!navigator || !navigator.mozSms)
          err = 'Mozilla SMS API not available.';

      if (err) return callback(err);

      var r = navigator.mozSms.send(num, msg);
      r.onSuccess = callback(null, r.message);
      r.onError = callback('SMS sending failed.');

    }

    function handleError(data) {
        console.error('error data', data);
        var err;
        try {
            // response should be in JSON format
            var err = JSON.parse(data);
        } catch(e) {
            //console.error(e);
            err = 'Failed to parse response.';
        }
        $('.errors.alert .msg').html('<p>'+err+'</p>')
            .closest('.errors').show();
    };

    function processResponse(err, data) {
        var resp;
        if (err)
            return handleError(err);
        //$('.log').prepend('<p>'+data+'</p>');
        try {
            if (typeof data === 'string')
                resp = JSON.parse(data);
            else if (typeof data === 'object')
                resp = data;
        } catch(e) {
            return handleError(data);
        }
        var val = log.getValue();
        log.setValue(json_format(JSON.stringify(resp)) +'\n'+val);
        $('#responses').show();
        if (resp.payload && resp.payload.messages) {
            _.each(resp.payload.messages, function(msg) {
                $('#messages-log').prepend('<p class="well well-small pull-left response">'+msg.message+'</p>');
            });
        }
        if (resp.callback) {
            resp.callback.options.data = JSON.stringify(resp.callback.data);
            request(resp.callback.options, processResponse);
        }
    };

    function onSendMessage(ev) {
        ev.preventDefault();
        console.log('onSendMessage');
        var fn = sendSMS,
            msg = $('#message').val();
        var options = {
            message: msg,
            phone: $('#messages [name=from]').val() || defaults.gateway_num
        };
        if (!hasSMSAPI()) {
            fn = postMessageHTTP;
            options.path = $('#options [name=path]').val();
        }
        fn(options, processResponse);
    }

    function formCode(form) {
        return form && form.meta && form.meta.code;
    }

    // Render and bind a form
    function showForm(form) {
        console.log('showForm');

        if (typeof form !== 'object') return;

        $form_fields = $('#form_fields');
        $form_fields.empty();

        var code = formCode(form),
            schemafied = translator(form, defaults.locale),
            rendered = jsonEdit('form_fields', schemafied[code].schema);

        schema_used.setValue(json_format(JSON.stringify(schemafied[code].schema)));

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


        $('#forms form').off('submit');
        $('#forms form').on('submit', function (ev) {
//            try {
                ev.preventDefault();
                var data = rendered.collect();
                updateFieldErrors(data.result, schemafied[code].schema);
                if (!data.result.ok)
                    return false;
                schemafied[code].validate(data.data, function(err){
                    if (err) {
                        showValidationErrorMsg(err);
                        return false;
                    }
                    schemafied[code].post_save(data.data, function(err, doc) {
                        if (err) return handleError(err);
                        editor.setValue(json_format(JSON.stringify(doc)));
                        var msg = convertToMuvukuFormat(doc);
                        $('#message').val(msg);
                        $('#messages form').trigger('submit');
                    });
                })


//            } catch (e) {
//                console.log(e);
//            }
            return false;
        });
    }


    function showValidationErrorMsg(errors) {
        var errs = _.map(errors, function(err) {
            return '<b>'+ err.title+ '</b> ' + err.msg
        });
        $('.errors.alert').find('msg').html(errs.join('<br />'));
    }


    function updateFieldErrors(result, schema) {
        var has_focus;
        _.each(schema.order, function(key) {
            var field = result.data[key],
                $input = $('[name='+key+']'),
                $errors = $input.parent().find('.errors');
            if (field && !field.ok) {
                console.log(JSON.stringify(result,null,2));
                if ($errors.length === 0) {
                    $errors = $('<p class="errors" />');
                    $input.parent().append($errors);
                }
                $errors.text(field.msg);
                if (!has_focus) {
                    $input.focus();
                    has_focus = true;
                }
            } else {
                $errors.remove();
            }
        });
    }


    function initJSONDisplay() {
        var elem = $('.results').get()[0];
        editor = CodeMirror(elem, {
            value : '',
            theme : 'monokai',
            mode : {name: "javascript", json: true}
        });
        editor.setSize(null, 400);


        var elem2 = $('.schema_used').get()[0];
        schema_used = CodeMirror(elem2, {
            value : '',
            readOnly : true,
            theme : 'monokai',
            mode : {name: "javascript", json: true}
        });
        schema_used.setSize(null, 400 );

        var elem3 = $('.log .entry').get()[0];
        log = CodeMirror(elem3, {
            value : '',
            readOnly : true,
            theme : 'monokai',
            mode : {name: "javascript", json: true}
        });
        log.setSize(null, 400 );
    }



    function getJSON(url, callback) {
        $.getJSON(url, function(data){
            callback(null, data);
        })
    }


    function getFormAttrs(form) {
        return _.map(form, function(entry){
            if (entry.meta && entry.meta.code) {
                return {
                    code: entry.meta.code,
                    label: entry.meta.label
                }
            }
        });
    }

    function initFormSelect(project, forms) {
        console.log('initFormSelect');
        var $input = $('#choose-form');
        $input.html(''); //reset
        _.each(forms, function(form, idx) {
            if (!form.meta || !form.meta.code) return;
            var code = form.meta.code,
                label = getString(form.meta.label),
                $option = $('<option/>');
            $option.val(project+'/'+code);
            $option.text(label +' ('+code+')');
            $input.append($option);
        });
        $input.on('change', function(){
            var val = $(this).val();
            router.setRoute('/' + val);
        });
        $input.closest('form').show();
        $input.closest('.well').find('.loader').hide();
    }


    return exports;
});
