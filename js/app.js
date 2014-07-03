
define([
    'underscore',
    'director',
    'json.edit',
    'codemirror',
    'schema-support',
    './json_format',
    './config',
    'couchr',
    'querystring',
    'text!new_form.html',
    'i18next',
    'jam/codemirror/mode/javascript/javascript',
    'domReady!',
    'jam/json.edit/addons/enumlabels',
    'jam/bootstrap/js/bootstrap-dropdown',
    'jam/bootstrap/js/bootstrap-tab'
], function (_, director, jsonEdit, CodeMirror, translator, json_format, config, couchr, querystring, new_form_html) {
    var exports = {},
        routes = {
            '/' : handleRoute,
            '/new' : newForm,
            '/*' : handleRoute
        },
        router = director.Router(routes),
        hide_count = true,
        editor,
        schema_used,
        schemafied,
        selected_form,
        log,
        show_forms,
        hide_forms = [],
        cache = {};

    // settings  defaults, include all settings values here
    var defaults = {
        locale: 'en',
        task_filter: 'medic/tasks_by_id',
        sync_url: '/medic/_design/medic/_rewrite/add',
        forms_list_path: '/medic/_design/medic/_rewrite/app_settings/medic/forms',
        gateway_num: '+13125551212',
        message_format: 'muvuku',
        extra: parseQuerystring()
    };

    var settings = _.extend({}, defaults);

    settings.locale = settings.extra.internal.locale || settings.locale;

    // passed as query param trumps other configs
    settings.sync_url = settings.extra.internal.sync_url
        || config('sync_url', true)
        || settings.sync_url;

    settings.forms_list_path = settings.extra.forms_list_path
        || config('forms_list_path', true)
        || settings.forms_list_path;

    settings.gateway_num = settings.extra.internal.gateway_num
        || settings.gateway_num;

    (function setKujuaDB() {
        var z = settings.sync_url.split('/');
        z.pop();
        z.push('_db');
        settings.kujua_db = z.join('/');
    })();

    if (defaults.extra.internal.embed_mode) {

        if (defaults.extra.internal.embed_mode == '2') {
            $('body').addClass('embed-mode-2');
            // change title to Log for regular users
            $('#navigation [href=#compose]').attr('data-i18n', 'labels.log');
        }
        else {
            $('body').addClass('embed-mode');
        }

        // top bar hidden by default in embed mode but can be overridden
        if (typeof defaults.extra.internal.hide_topbar === 'undefined') {
            defaults.extra.internal.hide_topbar = 1;
        }
    }

    if (!defaults.extra.internal.hide_settings) {
        $('body').addClass('show-settings');
    }

    if (!defaults.extra.internal.hide_topbar) {
        loadTopbar();
    } else {
        $('body').addClass('hide-topbar');
    }

    if (defaults.extra.internal.locale) {
        $('#options select[name=locale]').val(defaults.extra.internal.locale);
    }

    if (defaults.extra.internal.gateway_num) {
        $('#options input[name=from]').val(defaults.extra.internal.gateway_num);
    }

    if (defaults.extra.internal.debug) {
        $('body').addClass('debug-mode');
    }

    if (defaults.extra.internal.textforms_option) {
        $('#textforms_option').show();
    }


    if (defaults.extra.internal.use_textforms) {
        $('#options input[name=use_textforms]').val('textforms');
    }

    if (defaults.extra.internal.show) {
        show_forms = defaults.extra.internal.show.toLowerCase().split(',');
    }

    if (defaults.extra.internal.hide_forms) {
        hide_forms = defaults.extra.internal.hide_forms.toLowerCase().split(',');
    }

    function onLocaleChange(ev) {
        settings.locale = $(this).val();
        var args = $('#choose-form :selected').val().split('/');
        handleRoute(args[0], args[1]);
        initI18N(settings.locale);
    }

    function scrollTo($el, offset) {
        // addl 40px offset for topbar
        offset = offset || 40;
        $('html,body').animate({
            scrollTop: $el.offset().top - offset
        });
    }

    function showTab(href) {

        // if navigation is hidden do nothing
        if (!$('#navigation').is(':visible')) return;

        // href of tab is id of tab content div
        var ids = ['#options', '#forms', '#compose'];
        _.each(ids, function(id) {
            if (id === href) {
                $('#navigation [href='+id+']').tab('show');
                $(id).show();
                if (id === '#forms') $('#forms form').show();
            } else {
                $(id).hide();
            }
        });

    }

    function onClickTab(ev) {
        ev.preventDefault();
        var $link = $(this),
            href = $link.attr('href');
        showTab(href);
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
            url = options.url,
            method = options.method || 'POST',
            headers = options.headers || {'Content-Type': 'application/x-www-form-urlencoded'};

        $.ajax({
            beforeSend: function(xhr, settings){
                updateLog({
                    url:settings.url,
                    type:settings.type,
                    data:settings.data,
                    headers:settings.headers
                });
            },
            success: function(data, textStatus, xhr) {
                updateLog(xhr.status + ' ' + xhr.statusText);
                updateLog(data);
                callback(null, data);
            },
            error: function(xhr) {
                updateLog(xhr.status + ' ' + xhr.statusText);
                updateLog(data);
                callback(xhr);
            },
            headers: headers,
            url: url,
            type: method,
            data: data
        });

    };

    function postMessageHTTP(options, callback) {
        options.url = options.url || settings.sync_url;
        options.url += '?locale=' + settings.locale;
        options.method = 'POST';
        options.data = {
            message_id: Math.ceil(Math.random() * 100000),
            sent_timestamp: new Date().valueOf(),
            message: options.message,
            from: options.phone
        };
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
        var err = 'Failed to parse response.';
        $('.errors.alert .msg').html(
            '<p>'+err+'</p>'
        ).show();
        if (data.status) {
            $('.errors.alert .msg').append(
                '<code>'
                + data.status+' '+data.statusText+'\n'
                + '</code>'
            )
        }
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

        try {
            if (typeof data === 'string')
                resp = JSON.parse(data);
            else if (typeof data === 'object')
                resp = data;
        } catch(e) {
            return handleError(data);
        }

        if (resp.payload && resp.payload.success) {
            if (resp.payload.messages) {
                _.each(resp.payload.messages, function(msg) {
                    msgs.push(msg.message);
                });
            } else if (resp.payload.id) {
                taskListener(resp.payload.id);
            }
        }
        _.each(msgs, function(msg) {
            updateMessageLog(msg, 'response');
        });

        if (resp.callback) {
            request({
                url: resp.callback.options.path,
                data: JSON.stringify(resp.callback.data),
                method: resp.callback.options.method,
                headers: resp.callback.options.headers
            }, processResponse);
        }
        $('#message').val('');
    };

    function taskListener(id, since) {
        var options,
            url;

        options = {
            feed: 'longpoll',
            heartbeat: 10000,
            filter: settings.task_filter,
            id: id,
            since: since || 1
        };

        url = settings.sync_url.replace(/_design.+$/, '_changes?' + querystring.stringify(options));

        $.ajax({
            success: function(change) {
                change = JSON.parse(change);

                logTasks(id);
                taskListener(id, change.last_seq);
            },
            url: url
        });
    }

    var taskCache = {};

    function logTasks(id) {
        var url = settings.sync_url.replace(/_design.+$/, id);

        // initialise taskCache if not already set
        taskCache[id] = taskCache[id] || {};

        $.ajax({
            success: function(doc) {
                doc = JSON.parse(doc);

                _.each(doc.tasks, function(task) {
                    var message = task.messages[0].message,
                        newMessage = !taskCache[id][message];

                    if (newMessage) {
                        taskCache[id][message] = true;
                        updateMessageLog(message, 'response');
                    }
                });
            },
            url: url
        });
    }

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
            options.url = $('[name=sync_url]').val() || settings.sync_url;
        }
        fn(options, processResponse);
    }

    function formCode(form) {
        return form && form.meta && form.meta.code;
    }

    function convertToMuvukuFormat(data) {
        var code = data.form,
            schema = schemafied[code].schema,
            parts = [];
        schema.order.forEach(function(k) {
            // use empty string not 'undefined' in the message
            parts.push(typeof data[k] !== 'undefined' ? data[k] : '');
        });
        return '1!' + code + '!' + parts.join('#');
    };

    function convertToTextformsFormat(data) {
        var code = data.form,
            schema = schemafied[code].schema,
            parts = [];
        schema.order.forEach(function(k) {
            var key = schema.properties[k].tiny;
            if (!key) throw new Error(k + ' missing textforms field name.');
            parts.push(key + ' ' + data[k]);
        });
        return code + ' ' + parts.join('#');
    };

    function convertToCompactFormat(data) {
        var code = data.form,
            schema = schemafied[code].schema,
            parts = [];
        schema.order.forEach(function(k) {
            var value = data[k];
            if (/\s+/.test(value)) {
                value = '"' + value + '"';
            }
            parts.push(value);
        });
        return code + ' ' + parts.join(' ');
    };

    // Render and bind a form
    function renderForm(form) {


        $form_fields = $('#form_fields');
        $form_fields.empty();

        if (!form || typeof form !== 'object') {
            return $form_fields.html('<p>Form not found.</p>');
        }

        schemafied = translator(form, settings.locale);

        var code = formCode(form),
            rendered = jsonEdit('form_fields', schemafied[code].schema);

        schema_used.setValue(json_format(JSON.stringify(schemafied[code].schema)));
        prefill_form(settings.extra.form);

        $('#forms form .btn-success').text('Send');

        function onSubmit(ev) {
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
                    } else if(settings.message_format === 'compact') {
                        msg = convertToCompactFormat(doc);
                    } else {
                        msg = convertToMuvukuFormat(doc);
                    }
                    scrollTo($('#messages-log'));
                    showTab('#compose');
                    $('#message').val(msg).trigger('keyup');
                    $('#compose form').trigger('submit');
                });
            })
            return false;
        }

        $('#forms form').off('submit');
        $('#forms form').on('submit', onSubmit);
    }


    function showValidationErrorMsg(errors) {
        console.log('validation errors', errors);
        var errs = _.map(errors, function(err) {
            return '<b>'+ err.title+ '</b> ' + err.msg
        });
        $('.errors.alert').show().find('.msg').html(errs.join('<br />'));
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


    var translations = {
        es: {
            translation: {
                labels : {
                    forms: "Reportes",
                    log: "Log",
                    compose: "Escribir",
                    settings: "Configuración",
                    select_form: "Seleccione el reporte",
                    send: "Enviar",
                    sent_from: "Enviado desde",
                    locale: "Idioma"
                }
            }
        },
        fr: {
            translation: {
                labels : {
                    forms: "Formulaires",
                    log: "Log",
                    compose: "Composez",
                    settings: "Paramètres",
                    select_form: "Sélectionnez formulaire",
                    send: "Envoyer",
                    sent_from: "En provenance de",
                    locale: "Langue"
                }
            }
        },
        dev: {
            translation: {
                labels : {
                    forms: "Forms",
                    log: "Log",
                    compose: "Compose",
                    settings: "Settings",
                    select_form: "Select Form",
                    send: "Send",
                    sent_from: "Sent From",
                    locale: "Locale"
                }
            }
        }
    };

    function initI18N(locale) {
        $.i18n.init({
            resStore: translations,
            lng: locale || 'en'
        }, function(t) {
            $("body").i18n();
        });
    };

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
        $('#navigation a').on('click', onClickTab);
        $('#menu [data-show]').on('click', onClickMenuItem);
        $('#compose form').on('submit', onSendMessage);
        $('#message').on('keyup', onMessageKeyUp);
        $('[data-dismiss=alert]').on('click', function () {
            $(this).parent('div').hide();
        });
        $('[name=locale]').on('change', onLocaleChange);
        $('[name=format]').on('change', function() {
            settings.message_format = $(this).val();
        });
        $('[name=show_debug]').on('change', function() {
            if ($(this).prop('checked'))
                $('#debug').show(300);
            else
                $('#debug').hide(300);
        });
    }

    // optional form_code
    function handleRoute(form_code) {

        function finish(err, data) {
            if (err) {
                alert(err.status + ' ' + err.responseText);
            } else {
                cache.forms = data;
                if (!form_code) {
                    // if no form code is set then get the first form_code and
                    // route to that form
                    _.each(data, function(form) {
                        if (form_code) return;
                        form_code = form.meta && form.meta.code;
                    });
                    return router.setRoute('/' + form_code);
                }
            }
            initFormsSelect(data, form_code);
        }

        if (cache.forms) {
            return finish(null, cache.forms);
        }

        // fetch forms data if not found in cache
        request({
            url: settings.forms_list_path,
            method: 'GET'
        }, function(err, data) {
            if (err) {
                return finish(err);
            }
            finish(null, data && data.settings);
        })
    }

    function loadUserProfile(callback) {
        couchr.get('_session/', function(err, data){
            if (err) {
                return callback(err);
            }
            if (!data.userCtx || !data.userCtx.name) {
                return callback("Please log in.");
            }
            var url = '_users/org.couchdb.user:' + data.userCtx.name;
            couchr.get(url, function(err, user) {
                if (err) return callback(err);
                // combine session roles with user doc roles, basically
                // so _admin is included when appropriate.
                user.roles = _.uniq(user.roles.concat(data.userCtx.roles));
                if (user.facility_id) {
                    request({
                        url: settings.kujua_db + '/' + user.facility_id,
                        method: 'GET'
                    }, function(err, data) {
                        if (data) {
                            user.facility = JSON.parse(data);
                        }
                        callback(null, user);
                    });
                } else {
                    callback(null, user);
                }
            });
        });
    }



    // take list of forms then render and init select list.
    function initFormsSelect(forms, form_code) {
        var $input = $('#choose-form'),
            selected_form;
        $input.html(''); //reset
        _.each(forms, function(form, idx) {
            if (!form.meta || !form.meta.code) {
                return;
            }
            var code = form.meta.code,
                label = getLabel(form.meta.label),
                $option = $('<option/>');
            if (_.indexOf(hide_forms, code.toLowerCase()) !== -1) {
                return;
            }
            $option.val(code);
            $option.text(label + ' (' + code + ')');
            if (code === form_code) {
                $option.prop('selected',true);
                selected_form = form;
            }
            $input.append($option);
        });
        $input.on('change', function(){
            var val = $(this).val();
            router.setRoute('/' + val);
        });
        $input.closest('form').show();
        $('.container-fluid.loader').hide();
        $('.container-fluid.main').show();
        renderForm(selected_form);
    }

    function newForm() {
        $form_fields = $('#form_fields');
        $form_fields.html(new_form_html);
        $('#forms form .btn-success').text('Save');

        function onSubmit(ev) {
            ev.preventDefault();

            var form_name, form_json;
            try {
                form_json = JSON.parse( $('#form_json').val() );
                form_name = $('#form_name').val();
                if (!form_name) alert('Please provide a form name');
            } catch(e) {
                return alert('invalid json');
            }

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
        }

        $('#forms form').off('submit');
        $('#forms form').on('submit', onSubmit);

    }


    function parseQuerystring() {
        if (!window.location.search) return { internal:{}, form: {} };

        var qs = querystring.parse(window.location.search.substring(1));
        var internal = {};

        _.each( _.keys(qs), function(name) {
            if ( name.indexOf('_') === 0 ) {
                var good_name = name.substring(1);
                if (isNaN(qs[name])) {
                    internal[good_name] = qs[name];
                } else {
                    // preserve numbers so zero is falsey
                    internal[good_name] = Number(qs[name]);
                }
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

    /*
     * return true if the user is allowed to use muvuku webapp
     */
    function hasPermissions(user) {
        var allowedRoles = ['_admin', 'data_entry', 'national_admin', 'district_admin'],
            ret = false;
        _.each(allowedRoles, function(el) {
            if (_.contains(user.roles, el)) {
                ret = true;
            }
        });
        return ret;
    }

    function setPhoneNumber(user) {
        // set a phone number if not passed in as query param
        var phone;
        if (!settings.extra.internal.gateway_num) {
            if (user.facility) {
                phone = user.facility.contact && user.facility.contact.phone;
            }
            if (!phone) {
                phone = user.phone;
            }
            $('#options [name=from]').val(phone);
        }
    }

    exports.onDOMReady = function() {
        $(".footer .year").text(new Date().getFullYear());
        $(".version").text(new Date().getFullYear());
        if (settings.sync_url) {
            $('[name=sync_url]').val(settings.sync_url);
        }
        initListeners();
        initJSONDisplay();
        loadUserProfile(function(err, user) {
            if (err) {
                return $('.loader p').text(JSON.stringify(err));
            }
            if (!hasPermissions(user)) {
                return $('.loader p').text("Please log in with an authorized account.");
            }
            setPhoneNumber(user);
            initI18N(settings.locale);
            router.init('/');
        });
    };

    exports.init = function() {};

    return exports;
});
