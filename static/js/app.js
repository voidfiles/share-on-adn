(function () {
var TEMPLATE_CONTEXT = OPTIONS;

var TEMPLATE_CACHE = {};

var ACCESS_TOKEN;

var get_template = function (name) {
    if(TEMPLATE_CACHE[name]) {
        return TEMPLATE_CACHE[name];
    }

    var template_text = $("[data-name=" + name +"]").get(0).innerHTML;
    TEMPLATE_CACHE[name] = _.template(template_text);

    return TEMPLATE_CACHE[name];
};

var PageView = Backbone.View.extend({

    tagName: "div",

    className: "container",

    initialize: function () {
        this.render();
    },

    render_to_html: function (template_name, extra_context) {
        extra_context = extra_context || {};
        var ctx = $.extend({}, TEMPLATE_CONTEXT, this.options, extra_context);

       var template = get_template(template_name);

       return template(ctx);
    },

    render: function (extra_context) {
        this.$el.html(this.render_to_html(this.template_name, extra_context));
    }

});

var IndexView = PageView.extend({
    template_name: "index",

    initialize: function () {
        this.render(template_context);
    }
});

var AuthView = PageView.extend({
    template_name: "auth",

    initialize: function () {
        var host_url = getQueryVariable('host_url');

        localStorage.host_url = host_url; // save this for later

        if (!ACCESS_TOKEN) {
            var params = $.param({
                client_id: OPTIONS.client_id,
                redirect_uri: OPTIONS.callback_uri,
                scope: 'stream,write_post',
                response_type: 'token'
            });
            localStorage.on_auth_callback = ('' + window.location);
            template_context.oauth_authorize_url = 'http://alpha.app.net/oauth/authorize?' + params;
            template_context.authorized = false;
        } else {
            template_context.authorized = true;
        }

        this.render(template_context);
    }
});


var CarouselView = Backbone.View.extend({
    tagName: "div",

    className: "container",

    initialize: function () {
        this.$el.find('.js-embed-carousel-nav').removeClass('hide');
    },
    events: {
        'click .js-embed-carousel-left': 'next',
        'click .js-embed-carousel-right': 'prev'
    },
    next: function () {
        var current_item = this.$el.find('.embed-carousel-item:not(.hide)');
        current_item.addClass('hide').siblings(':first').removeClass('hide');
    },
    prev: function () {
        var current_item = this.$el.find('.embed-carousel-item:not(.hide)');
        current_item.addClass('hide').siblings(':last').removeClass('hide');
    }

});

var PostView = PageView.extend({
    template_name: 'post',
    events: {
        'keydown .js-post-text': 'update_char_count',
        'click .js-post-to-adn': 'post_to_adn',
        'click .js-cancel-post': 'cancel_post_to_adn'
    },
    update_char_count: function () {
        var char_count = 250 - this.$el.find('.js-post-text').val().length;
        this.$el.find('.js-char-count').text(char_count);
    },
    post_to_adn: function () {
        var carousel = this.$el.find('.js-embed-carousel');
        var embed = carousel.find('.js-embed-carousel-item:not(.hide)');
        var post = this.serialize_form();
        if (embed.data('source') === 'embed') {
            post.annotations[0].value = this.embed;
        }

        var _this = this;

        $.ajax({
            url: "https://alpha-api.app.net/stream/0/posts?include_annotations=1",
            type: "POST",
            data: JSON.stringify(post),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            headers: {
                'Authorization': 'Bearer ' + localStorage.access_token
            }
        }).done(function () {
            window.top.postMessage({'method': 'done_posting'}, _this.host_url);
        }).fail(function () {
            alert('Your snippet is to big to fit in an annotation. Make it smaller and try again.');
        });

        return false;
    },
    cancel_post_to_adn: function () {
        window.top.postMessage({'method': 'done_posting'}, this.host_url);
        return false;
    },
    serialize_form: function () {

        return {
            text: this.$el.find('.js-post-text').val(),
            annotations: [{
                type: "com.github.voidfiles.share-on-adn",
                value: {
                    type: 'rich',
                    html: this.$el.find('.js-snippet').val(),
                    title: this.$el.find('.js-title').val(),
                    link: this.$el.find('.js-link').val(),
                    width: 500,
                    height: 250
                }
            }]
        };
    },
    render_to_form: function (data) {
        var post_text = data.title + ' ' + data.url;
        var snippet = $.sanitize(data.snippet, {
            a: {
                href: true,
                title: true
            },
            img: {
                src: true
            },
            span: {},
            p: {},
            ul: {},
            ol: {},
            li: {},
            div: {}
        });
        this.$el.find('.js-post-text').val(post_text);
        this.$el.find('.js-snippet').val(snippet);
        this.$el.find('.js-title').val(data.title);
        this.$el.find('.js-link').val(data.url);
    },
    recieve_oembed: function (embed) {
        this.embed = embed;
        var carousel = this.$el.find('.js-embed-carousel');
        var carousel_item_container = carousel.find('.js-embed-carousel-item-container');

        var carousel_item = this.render_to_html('embed-carousel-item', {embed: embed});
        carousel_item_container.append(carousel_item);

        carousel_view = new CarouselView({el: carousel});
    },
    initialize: function () {
        var _this = this;
        this.render();

        this.host_url = getQueryVariable('host_url');

        window.addEventListener("message", function (event) {
            if(!event.data.oembed) {
                _this.render_to_form(event.data);
                _this.update_char_count();
            } else {
                _this.recieve_oembed(event.data);
            }
        }, false);

        window.top.postMessage({'method': 'iframe_ready'}, this.host_url);
    }
});

function getQueryVariable(variable, query) {
    query = query || window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return unescape(pair[1]).replace(/\+/g, ' ');
        }
    }
    return false;
}

ACCESS_TOKEN = (window.localStorage && localStorage.access_token) || $.cookie('access_token');
var fragment = window.location.hash.substring(1);
var template_context = {};
if (fragment !== '') {
    ACCESS_TOKEN = getQueryVariable('access_token', fragment);
    template_context.error = getQueryVariable('error', fragment);
    template_context.error_description = getQueryVariable('error_description', fragment);

    if (ACCESS_TOKEN) {
        if (window.localStorage) {
            localStorage.access_token = ACCESS_TOKEN;
        }

        $.cookie('access_token', ACCESS_TOKEN, { expires: 999, secure: true, domain: window.location.host });
        window.location = localStorage.on_auth_callback;
    }
} else {
    template_context.error = false;
}

var VIEW_ROUTES = {
    'index': IndexView,
    'auth': AuthView,
    'post': PostView
};

var view;
var selected_view = getQueryVariable('view');


if (!ACCESS_TOKEN && selected_view) {
    view = VIEW_ROUTES['auth'];
} else if(selected_view) {
    view = VIEW_ROUTES[selected_view] || IndexView;
} else {
    view = IndexView;
}


new view({el: $('.container')});

}());