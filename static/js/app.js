(function () {

'use strict';
/*
Copyright (c) 2012 Noodleapp contributors; see CONTRIBUTORS
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

Neither the name of the nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

// markdown can have markdown [test](url) links, or bare URLs.  Anything else will be ignored and remain text.  Only link entities are set; that's all that's needed to post to the app.net API.
var parse = function(markdown) {
  // Markdown bracket regex based on http://stackoverflow.com/a/9268827
  var markdownLinkRegex = /\[([^\]]+)\]\((\S+(?=\)))\)/;

  // Regex pulled from https://github.com/chriso/node-validator and country codes pulled from http://data.iana.org/TLD/tlds-alpha-by-domain.txt
  var bareUrlRegex = /((?:http|https|ftp|scp|sftp):\/\/)?(?:\w+:\w+@)?(?:localhost|(?:(?:[\-\w\d{1-3}]+\.)+(?:com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|edu|co\.uk|ac\.uk|it|fr|tv|museum|asia|local|travel|AC|AD|AE|AF|AG|AI|AL|AM|AN|AO|AQ|AR|AS|AT|AU|AW|AX|AZ|BA|BB|BD|BE|BF|BG|BH|BI|BJ|BM|BN|BO|BR|BS|BT|BV|BW|BY|BZ|CA|CC|CD|CF|CG|CH|CI|CK|CL|CM|CN|CO|CR|CU|CV|CW|CX|CY|CZ|DE|DJ|DK|DM|DO|DZ|EC|EE|EG|ER|ES|ET|EU|FI|FJ|FK|FM|FO|FR|GA|GB|GD|GE|GF|GG|GH|GI|GL|GM|GN|GP|GQ|GR|GS|GT|GU|GW|GY|HK|HM|HN|HR|HT|HU|ID|IE|IL|IM|IN|IO|IQ|IR|IS|IT|JE|JM|JO|JP|KE|KG|KH|KI|KM|KN|KP|KR|KW|KY|KZ|LA|LB|LC|LI|LK|LR|LS|LT|LU|LV|LY|MA|MC|MD|ME|MG|MH|MK|ML|MM|MN|MO|MP|MQ|MR|MS|MT|MU|MV|MW|MX|MY|MZ|NA|NC|NE|NF|NG|NI|NL|NO|NP|NR|NU|NZ|OM|PA|PE|PF|PG|PH|PK|PL|PM|PN|PR|PS|PT|PW|PY|QA|RE|RO|RS|RU|RW|SA|SB|SC|SD|SE|SG|SH|SI|SJ|SK|SL|SM|SN|SO|SR|ST|SU|SV|SX|SY|SZ|TC|TD|TF|TG|TH|TJ|TK|TL|TM|TN|TO|TP|TR|TT|TV|TW|TZ|UA|UG|UK|US|UY|UZ|VA|VC|VE|VG|VI|VN|VU|WF|WS|YE|YT|ZA|ZM|ZW))|(?:(?:\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)(?:\.(?:\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)){3}))(?::[\d]{1,5})?(?:(?:(?:\/(?:[\-\w~!$+|.,="'\(\)_\*:]|%[a-f\d]{2})+)+|\/)+|\?|#)?(?:(?:\?(?:[\-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[\-\w~!$+|.,*:=]|%[a-f\d]{2})*)(?:&(?:[\-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[\-\w~!$+|.,*:=]|%[a-f\d]{2})*)*)*(?:#(?:[\-\w~!$ |\/.,*:;=]|%[a-f\d]{2})*)?/ig;

  var links = [];
  var text = markdown;

  function handleReplacement(_, anchor, url, pos) {
    links.push({
      pos: pos,
      len: anchor.length,
      url: url
    });

    return anchor;
  }

  var oldText;

  // Has to be called repeatedly, since if done globally, it will provide the original index (before earlier replacements)
  do {
    oldText = text;
    text = oldText.replace(markdownLinkRegex, handleReplacement);
  } while(text !== oldText);

  var match;
  while((match = bareUrlRegex.exec(text))) {
    var url = match[0];
    var len = url.length;

    if(match[1] === undefined) {
      url = 'http://' + url;
    }

    links.push({
      pos: match.index,
      len: len,
      url: url
    });
  }

  return {
    text: text,
    entities: {
      links: links
    }
  };
};

// Return markdown given app.net object, generally either a post or user description.  Only text and entities.links are currently used
var stringify = function(adnObject) {
  var markdown = adnObject.text;
  var links = adnObject.entities.links;
  var link;
  links.sort(function(l1, l2) {
    return l1.pos - l2.pos;
  });

  for(var i = links.length - 1; i >= 0; i--) {
    link = links[i];
    // We keep bare URLs bare.
    if(link.text !== link.url) {
      // https://github.com/appdotnet/api-spec/issues/230
      var remaining = markdown.substring(link.pos + link.len);
      remaining = remaining.replace(/^ \[[^\]]+\]/, '');
      markdown = markdown.substring(0, link.pos) + '[' + link.text + '](' + link.url + ')' + remaining;
    }
  }

  return markdown;
};

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

       return template({ctx: ctx});
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

var MySanitizer = new Sanitize({
  elements: [
    'a', 'b', 'blockquote', 'br', 'caption', 'cite', 'code', 'dd', 'dl',
    'dt', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'i', 'img', 'li', 'ol', 'p', 'pre', 'q', 'small', 'strike', 'strong',
    'sub', 'sup','u', 'ul'],

  attributes: {
    'a'         : ['href', 'title'],
    'blockquote': ['cite'],
    'img'       : ['align', 'alt', 'height', 'src', 'title', 'width'],
    'ol'        : ['start', 'type'],
    'q'         : ['cite'],
    'ul'        : ['type']
  },

  protocols: {
    'a'         : {'href': ['ftp', 'http', 'https', 'mailto',
                                Sanitize.RELATIVE]},
    'blockquote': {'cite': ['http', 'https', Sanitize.RELATIVE]},
    'img'       : {'src' : ['http', 'https', Sanitize.RELATIVE]},
    'q'         : {'cite': ['http', 'https', Sanitize.RELATIVE]}
  }
});

var API = function (conf) {
    conf.url = 'https://alpha-api.app.net/stream/0' + conf.url;
    conf.headers = {
        'Authorization': 'Bearer ' + localStorage.access_token
    };

    return $.ajax(conf);
};

// Length of actual text that will be posted to app.net
var getEffectiveLength = function (text) {
    // Same as in markdown-to-entities, but global
    var markdownLinkRegex = /\[([^\]]+)\]\((\S+(?=\)))\)/g;

    // Apparently newlines are considered part of the character count limitation
    // And apparently the newline is treated as two characters, not one when passed
    // to the API as a post message - so here we count one for the key enter and one for
    // the newline regex match. Which results in working out as two: '\n'
    var markdownText = text.replace(markdownLinkRegex, '$1');
    var markdownTextNewlineCount = 0;
    if (markdownText.match(/\n/g)) {
        markdownTextNewlineCount = markdownText.match(/\n/g).length;
    }

    return markdownText.length + markdownTextNewlineCount;
};

var checkCharLimit = function (text) {
    var textLength = getEffectiveLength(text);
    var button = write.find('button');

    if (textLength > CHAR_MAX) {
        charLimit.addClass('over');
        charLimit.text('- ' + (textLength - CHAR_MAX));
        button.attr('disabled', 'disabled');
        button.addClass('disabled');
    } else {
        charLimit.removeClass('over');
        charLimit.text(CHAR_MAX - textLength);
        button.removeAttr('disabled');
        button.removeClass('disabled');
    }
};

var PostView = PageView.extend({
    template_name: 'post',
    events: {
        'keydown .js-post-text': 'update_char_count',
        'click .js-post-to-adn': 'post_to_adn',
        'click .js-cancel-post': 'cancel_post_to_adn'
    },
    update_char_count: function () {
        var char_count = 250 - getEffectiveLength(this.$el.find('.js-post-text').val());
        this.$el.find('.js-char-count').text(char_count);
    },
    post_to_adn: function () {
        var carousel = this.$el.find('.js-embed-carousel');
        var embed = carousel.find('.js-embed-carousel-item:not(.hide)');
        var post = this.serialize_form();
        var embeddable_url = post.annotations[0].value.url || post.annotations[0].value.link;
        var channel = parseInt($('[name="post-to"]').val(), 10);

        if (embed.data('source') === 'embed') {
            this.embed.embeddable_url = embeddable_url;
            post.annotations[0].value = this.embed;
        }

        post.annotations[0].value.html = post.annotations[0].value.html || "<a href='" + embeddable_url + "'>" + embeddable_url + "</a>";

        var _this = this;

        var url = "/posts?include_annotations=1";
        if (channel !== 0) {
            url = '/channels/' + channel + '/messages';
        }

        API({
            url: url,
            type: "POST",
            data: JSON.stringify(post),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        }).done(function () {
            window.top.postMessage({'method': 'done_posting'}, _this.host_url);
        }).fail(function () {
            alert('Something went wrong. Talk to @voidfiles on app.net.');
        });

        return false;
    },
    cancel_post_to_adn: function () {
        window.top.postMessage({'method': 'done_posting'}, this.host_url);
        return false;
    },
    serialize_form: function () {
        var created_at = new Date();

        var post = parse(this.$el.find('.js-post-text').val());

        post.annotations = [{
            type: "net.app.core.oembed",
            value: {
                type: 'rich',
                version: '1.0',
                html: this.$el.find('.js-snippet').val(),
                title: this.$el.find('.js-title').val(),
                url: this.$el.find('.js-link').val(),
                width: 500,
                height: 250
            }
        }, {
            type: "net.share-app.item",
            value: {
                created: created_at.toISOString()
            }
        }];

        return post;
    },
    render_to_form: function (data) {
        var post_text =  '[' + data.title + '](' + data.url + ')';
        var snippet = $('<div/>').html(data.snippet).get(0);
        snippet = MySanitizer.clean_node(snippet);
        snippet = $('<div/>').append(snippet.childNodes).get(0).innerHTML;


        this.$el.find('.js-post-text').val(post_text);
        this.$el.find('.js-snippet').val(snippet);
        this.$el.find('.js-title').val(data.title);
        this.$el.find('.js-link').val(data.url);
    },
    recieve_oembed: function (embed) {
        this.embed = embed;
        if (this.embed.type == 'link') {
            var rich_template = get_template('rich-embed');
            var html = rich_template({ctx: {embed: embed}});
            this.embed.type = 'rich';
            this.embed.html = html;
            this.embed.width = 500;
            this.embed.height = 250;
        }
        var carousel = this.$el.find('.js-embed-carousel');
        var carousel_item_container = carousel.find('.js-embed-carousel-item-container');

        var carousel_item = this.render_to_html('embed-carousel-item', {embed: embed});
        carousel_item_container.append(carousel_item);

        var carousel_view = new CarouselView({el: carousel});
    },
    initialize: function () {
        var _this = this;
        this.options.channels = JSON.parse(localStorage.channels || '[]');
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

        API({
            url: "/users/me",
            type: "GET",
            data: {
                include_annotations: 1
            }
        }).done(function (data) {
            if (data.data.annotations) {
                var multiple_channels = false;
                _.each(data.data.annotations, function (annotation) {
                    if (annotation.type == "net.share-app.feed-ad") {
                        localStorage.channels = JSON.stringify(annotation.value.list);
                        var select = $('[name="post-to"]');
                        var post_to_select = $('.post-to-selector');
                        select.html('');
                        select.append('<option value=0>Feed</option>');
                        _.each(annotation.value.list, function (channel) {
                            multiple_channels = true;
                            select.append('<option value="' + channel.channel + '">' + channel.name + '</option>');
                        });
                        if (multiple_channels) {
                            post_to_select.removeClass('hide');
                        }
                        return false;
                    }
                });
            }

        });
    }
});

var GridView = PageView.extend({
    template_name: "grid",

    fit: function () {
        this.$el.find('.post-display').isotope({
            layoutMode: 'fitColumns',
            fitColumns: {
                columnWidth: 200
            }
        });
    },
    initialize: function () {
        if (ACCESS_TOKEN) {
            this.render(template_context);
            var _this = this;
            API({
                url: "/users/me/posts",
                type: "GET",
                data: {
                    include_annotations: 1,
                    count: 200
                }
            }).done(function (data) {
                var posts = _.filter(data.data, function (post) {
                    var has_thumbnail;

                    post.annotations = _.filter(post.annotations, function (annotation) {
                        if (annotation.value.thumbnail_url) {
                            return annotation;
                        }
                        return false;
                    });

                    return post.annotations.length;
                });

                var ctx = $.extend({}, template_context, {
                    'posts': posts
                });

               _this.render(ctx);
            });
        }
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
    'post': PostView,
    'grid': GridView
};

var view;
var selected_view = getQueryVariable('view');
var unauth_stall = getQueryVariable('unauth_stall') || false;

if (!ACCESS_TOKEN && selected_view) {
    if (unauth_stall) {
        return;
    }
    view = VIEW_ROUTES['auth'];
} else if(selected_view) {
    view = VIEW_ROUTES[selected_view] || IndexView;
} else {
    view = IndexView;
}


new view({el: $('.container')});

}());