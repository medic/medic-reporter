
define([
    'jquery',
    'underscore',
    'director',
    'json.edit',
    'codemirror',
    'schema-support',
    './json_format',
    'couchr',
    'querystring',
    'text!new_form.html',
    'json!json-forms/examples.json',
    'jam/codemirror/mode/javascript/javascript',
    'domReady!',
    'jam/json.edit/addons/enumlabels',
    'jam/bootstrap/js/bootstrap-dropdown.js'
], function ($, _, director, jsonEdit, CodeMirror, translator, json_format, couchr, querystring, new_form_html) {


    var exports = {},
        routes = {
            '/' : noFormSelected,
            '/new' : newForm,
            '/*/*/*' : loadProjectAndForm,
            '/*/*' : loadProjectAndForm,
            '/*' : loadProjectAndForm
        },
        router = director.Router(routes),
        hide_count = true,
        editor,
        schema_used,
        schemafied,
        selected_form,
        log;

    // settings  defaults, include all settings values here
    var defaults = {
        locale: 'en',
        sync_url: '/kujua-base/_design/kujua-base/_rewrite/add',
        json_forms_path: 'json-forms',
        gateway_num: '+13125551212',
        message_format: 'muvuku',
        extra: parseQuerystring()
    };

    var settings = _.extend({}, defaults);

    settings.locale = defaults.extra.internal.locale || settings.locale;
    settings.sync_url = defaults.extra.internal.sync_url || settings.sync_url;
    settings.gateway_num = defaults.extra.internal.gateway_num || settings.gateway_num;

    if (!defaults.extra.internal.hide_topbar) {
        loadTopbar();
    }
    if (defaults.extra.internal.locale) {
        $('#options select[name=locale]').val(defaults.extra.internal.locale);
    }

    if (defaults.extra.internal.gateway_num) {
        $('#options input[name=from]').val(defaults.extra.internal.gateway_num);
    }

    if (defaults.extra.internal.debug) {
        $('#debug').show();
    }

    if (defaults.extra.internal.textforms_option) {
        $('#textforms_option').show();
    }

    if (defaults.extra.internal.use_textforms) {
        $('#options input[name=use_textforms]').attr('checked', true);
    } else {
        $('#options input[name=use_textforms]').attr('checked', false);
    }

    function onLocaleChange(ev) {
        settings.locale = $(this).val();
        var args = $('#choose-form :selected').val().split('/');
        loadProjectAndForm(args[0], args[1]);
    }

    function scrollTo($el, offset) {
        // addl 40px offset for topbar
        offset = offset || 40;
        $('html,body').animate({
            scrollTop: $el.offset().top - offset
        });
    }

    function onClickMenuItem(ev) {
        ev.preventDefault();
        var $link = $(this),
            type = $link.attr('data-show');
        return scrollTo($('#'+type));
    }

    function onMessageKeyUp (ev) {
        var $input = $(ev.target),
            count = $input.val().length;
        if (count > 50)
            hide_count = false;
        if (!hide_count)
            $input.parents('.controls').find('.count')
                .html(count + ' characters').show();
    }

    function getLabel(label, lang) {
        lang = lang || settings.locale;
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
        options.path = options.path || settings.sync_url;
        options.path += '?locale=' + settings.locale;
        options.data = {
            message_id: Math.ceil(Math.random() * 100000),
            sent_timestamp: new Date().valueOf(),
            message: options.message,
            from: options.phone
        };
        updateLog(options.data);
        updateMessageLog(options.data.message, 'message');
        request(options, callback);
    }

    function hasSMSAPI() {
      if (navigator && navigator.mozSms) return true;
    }

    function queueSMS(options) {}

    function sendSMS(options, callback) {

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

    function updateLog(data) {
        var val = log.getValue();
        try {
            // data is json
            if (typeof data === 'string')
                data = JSON.parse(data);
            log.setValue(json_format(JSON.stringify(data)) +'\n'+val);
        } catch(e) {
            // data is not json
            try {
                log.setValue(data +'\n'+val);
            } catch(e) {
            }
        }
    }

    function handleError(data) {
        updateLog(data);
        var err = 'Failed to parse response.';
        $('.errors.alert .msg').html('<p>'+err+'</p>')
            .closest('.errors').show();
    };

    function updateMessageLog(msg, type, timeout) {
        timeout = timeout || 0;
        type = type || 'message';
        var $el = $('#messages-log'),
            clss = '';
        if (type === 'response') {
            clss = 'response pull-left';
        } else {
            clss = 'message pull-right';
        }
        // adding .5 sec to response time to make it feel more like a
        // response
        setTimeout(function() {
            $el.append(
                $('<p class="well well-small" />').addClass(clss).text(msg)
            );
            $el.animate({
                scrollTop: $el.prop("scrollHeight") - $el.height()
            });
        }, timeout);
    }

    function processResponse(err, data) {
        var resp,
            msgs = [];

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

        updateLog(resp);

        if (resp.payload && resp.payload.success) {
            if (resp.payload.messages) {
                _.each(resp.payload.messages, function(msg) {
                    msgs.push(msg.message);
                });
            }
        }
        _.each(msgs, function(msg) {
            updateMessageLog(msg, 'response');
        });

        if (resp.callback) {
            resp.callback.options.data = JSON.stringify(resp.callback.data);
            request(resp.callback.options, processResponse);
        }
        $('#message').val('');
    };

    function onSendMessage(ev) {
        ev.preventDefault();
        var fn = sendSMS,
            msg = $('#message').val();
        var options = {
            message: msg,
            phone: $('#options [name=from]').val() || settings.gateway_num
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

    function convertToMuvukuFormat(data) {
        var msg = '',
            code = data.form;
        schemafied[code].schema.order.forEach(function(k) {
            // handle msg header on first iteration
            if (!msg)
                return msg = '1!'+ code +'!'+ data[k];
            msg += '#'+ data[k];
        });
        return msg;
    };

    function convertToTextformsFormat(data) {
        var msg = '',
            code = data.form,
            schema = schemafied[code].schema,
            parts = [];
        schema.order.forEach(function(k) {
            // handle msg header on first iteration
            var val = data[k],
                key = schema.properties[k].tiny;
            if (!key) throw new Error(k+' missing textforms field name.');
            if (!msg)
                msg = code +' ';
            parts.push(key +' '+ data[k]);
        });
        return msg + parts.join('#');
    };

    // Render and bind a form
    function renderForm(form) {

        if (typeof form !== 'object') return;

        $form_fields = $('#form_fields');
        $form_fields.empty();

        schemafied = translator(form, settings.locale);

        var code = formCode(form),
            rendered = jsonEdit('form_fields', schemafied[code].schema);

        schema_used.setValue(json_format(JSON.stringify(schemafied[code].schema)));
        prefill_form(settings.extra.form);

        $('#forms form .btn-success').text('Send');
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
                        var msg;
                        if (settings.message_format === 'textforms') {
                            try {
                                msg = convertToTextformsFormat(doc);
                            } catch(e) {
                                msg = convertToMuvukuFormat(doc);
                            }
                        } else {
                            msg = convertToMuvukuFormat(doc);
                        }
                        scrollTo($('#messages'));
                        $('#message').val(msg).trigger('keyup');
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

    function initListeners() {
        $('#menu [data-show]').on('click', onClickMenuItem);
        $('#messages form').on('submit', onSendMessage);
        $('#message').on('keyup', onMessageKeyUp);
        $('[data-dismiss=alert]').on('click', function () {
            $(this).parent('div').hide();
        });
        $('[name=locale]').on('change', onLocaleChange);
        $('[name=use_textforms]').on('change', function() {
            if ($(this).prop('checked'))
                settings.message_format = 'textforms';
            else
                settings.message_format = 'muvuku';
        });
        $('[name=show_debug]').on('change', function() {
            if ($(this).prop('checked'))
                $('#debug').show(300);
            else
                $('#debug').hide(300);
        });
    }

    // Used to find all the .json files in the root of this project
    function loadAvailableJson(callback) {
        var results = [];
        $.get(settings.json_forms_path+'/index.json', function(data) {
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

    function loadLocalForms(callback) {
        couchr.get('_ddoc/_view/saved_forms', function(err, data){
            if (err) return callback(err);
            var result = _.map(data.rows, function(row){
                return {
                    id: row.id,
                    text: row.value
                };
            });
            callback(null, result);
        });
    }



    function initFormSelect(project, forms, form_code) {
        var $input = $('#choose-form');
        $input.html(''); //reset
        _.each(forms, function(form, idx) {
            if (!form.meta || !form.meta.code) return;
            var code = form.meta.code,
                label = getLabel(form.meta.label),
                $option = $('<option/>');
            $option.val(project+'/'+code);
            $option.text(label +' ('+code+')');
            if (code === form_code)
                $option.prop('selected',true);
            $input.append($option);
        });
        $input.on('change', function(){
            var val = $(this).val();
            router.setRoute('/' + val);
        });
        $input.closest('form').show();
        $input.closest('.well').find('.loader').hide();
    }

    function initProjectIndex(data){
        var $input = $('#choose-project');
        _.each(data, function(el, idx) {
            var $option = $('<option/>');
            $option.attr('value',el.id);
            $option.text(el.text && el.text.replace('.json',''));
            $input.append($option);
        });
        $input.on('change', function() {
            var val = $(this).val();
            router.setRoute('/' + val);
        });
        $input.closest('form').show();
        $input.closest('.well').find('.loader').hide();
    }

    function loadProject(file, callback) {
        var url;

        if (file.indexOf('.json', file.length - 5)  !== -1 ) {
            url = settings.json_forms_path + '/' + file;
        }
        else {
            url = './_ddoc/_show/json_form/' + file;
        }

        $.getJSON(url, function(data) {
            $('#choose-project [value="'+file+'"]').prop('selected', true);
            if (_.isFunction(callback))
                callback(null, data);
        });
    }

    function loadProjectAndForm(project, form_code) {
        loadProject(project, function(err, forms){
            initFormSelect(project, forms, form_code);
            // choose either first form or match form code argument
            var form;
            _.each(forms, function(f) {
                if (!form)
                    form = f;
                if (form_code && form_code === formCode(f))
                    form = f;
            });
            renderForm(form);
        })
    }

    function noFormSelected() {
        // on first load, just show the example json form VPD, in english
        router.setRoute('/examples.json/ZZZZ');
    }


    function newForm() {
        $form_fields = $('#form_fields');
        $form_fields.html(new_form_html);
        $('#forms form .btn-success').text('Save');
        $('#forms form').off('submit');
        $('#forms form').on('submit', function (ev) {
            ev.preventDefault();

            var form_name, form_json;
            try {
                form_json = JSON.parse( $('#form_json').val() );
                form_name = $('#form_name').val();
                if (!form_name) alert('Please provide a form name');
            } catch(e) { alert('invalid json'); }

            var doc = {
                type: 'form',
                name: form_name,
                form_json: form_json
            };

            couchr.post('_db', doc, function(err, resp){
                if (err) {
                    var msg = "Problem saving. ";
                    if (err && err.reason) msg += err.reason;
                    return alert(msg);
                }
                router.setRoute('/' + resp.id);
                // cheap hack to reload the select.
                window.location.reload();
            });
            return false;
        });

    }


    function parseQuerystring() {
        if (!window.location.search) return;

        var qs = querystring.parse(window.location.search.substring(1));
        var internal = {};

        _.each( _.keys(qs), function(name) {
            if ( name.indexOf('_') === 0 ) {
                var good_name = name.substring(1);
                internal[good_name] = qs[name];
                delete qs[name];
            }
        });

        return {
            internal: internal,
            form: qs
        };
    }


    function loadTopbar() {
        var script = document.createElement("script");
        script.src = '/dashboard/_design/dashboard/_rewrite/static/js/topbar.js?position=fixed';
        document.head.appendChild( script );
    }


    function prefill_form(qs) {

        _.each( _.keys(qs), function(name){
            $('input[name='+ name +']').val( qs[name] );
            // fallback to a select
            $('select[name='+ name +']').val( qs[name] );
        });
    };

    exports.onDOMReady = function() {
        $(".footer .year").text(new Date().getFullYear());
        $(".version").text(new Date().getFullYear());
        initListeners();
        loadAvailableJson(function(err, data){
            loadLocalForms(function(err2, data2){
                // ignore err2
                if (data2) data.push.apply(data, data2);
                initProjectIndex(data);
                router.init('/');
            });


        });
        initJSONDisplay();
    };

    exports.init = function() {};

    return exports;
});
