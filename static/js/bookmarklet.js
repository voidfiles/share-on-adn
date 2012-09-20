(function () {
    var parseUri = function (str) {
        var o   = parseUri.options,
            m   = o.parser[(o.strictMode ? "strict" : "loose")].exec(str),
            uri = {},
            i   = 14;

        while (i--) {
            uri[o.key[i]] = m[i] || "";
        }

        uri[o.q.name] = {};
        uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
            if ($1) {
                uri[o.q.name][$1] = $2;
            }
        });

        return uri;
    };

    parseUri.options = {
        strictMode: false,
        key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
        q:   {
            name:   "queryKey",
            parser: /(?:^|&)([^&=]*)=?([^&]*)/g
        },
        parser: {
            strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
            loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
        }
    };

    var agrb = function(){
        var b = document.location.pathname.split("/");
        this.formdata = {};
        this.formdata.title    = document.title;
        this.formdata.url      = window.location.href;
        this.formdata.srcTitle = window.location.host;
        this.iframe_ready = false;
        this.embed_sent = false;
        // Get snippet
        this.getHtml();
        if (this.formdata.snippet === "") {
            this.getMetaDescription();
        }


    };

    agrb.prototype.grLink = (window.SADN_ROOT || "https://del05f65do1od.cloudfront.net") + "/index.html?view=post&date=" + (+new Date());
    agrb.prototype.grIFrame = "GR________link_bookmarklet_frame";
    agrb.prototype.getHtml = function(){
        if (document.selection && document.selection.createRange) {
            this.formdata.snippet = document.selection.createRange().text ? document.selection.createRange().htmlText: "";
            return true;
        }
        else if (window.getSelection) {
            var a = window.getSelection();
            if (a.rangeCount > 0) {
                var b = document.createElement("div");
                b.appendChild(a.getRangeAt(0).cloneContents());
                this.formdata.snippet = b.innerHTML;
                return true;
            }
        }
        this.formdata.snippet = "";
        return true;
    };

    agrb.prototype.getMetaDescription = function(){
        for (var a = document.getElementsByTagName("meta"), b = 0, el_len=a.length; b <= el_len; b++) {
            var c = a[b];
            if (!c) {
                continue;
            }
            var d = c.getAttribute("name");
            if (d && d.toUpperCase() == "DESCRIPTION") this.formdata.snippet = c.getAttribute("content");
        }
    };

    agrb.prototype.cleanString = function(a, b) {
        var ia = /&/g,
        ja = /</g,
        ka = />/g,
        la = /"/g,
        ma = /[&<>"]/;

        if (b) return a.replace(ia, "&amp;").replace(ja, "&lt;").replace(ka, "&gt;").replace(la, "&quot;");
        else {
            if (!ma.test(a)) return a;
            if (a.indexOf("&") != -1) a = a.replace(ia, "&amp;");
            if (a.indexOf("<") != -1) a = a.replace(ja, "&lt;");
            if (a.indexOf(">") != -1) a = a.replace(ka, "&gt;");
            if (a.indexOf('"') != -1) a = a.replace(la, "&quot;");
            return a;
        }

    };

    agrb.prototype.createIframe = function(){
        var a = document.getElementById("GR________link_bookmarklet_node");
        if(a){
            var my_div = document.createElement("div");
            my_div.innerHTML = "Share on ADN <a href='http://voidfiles.github.com/share-on-adn/'>http://voidfiles.github.com/share-on-adn/</a>";

            this.__iframe_div = a;
            this.__iframe_div.style.height = "500px";
            this.__iframe_div.appendChild(my_div);
            return true;
        }
        if (typeof(this.__iframe) === "undefined") {
            a = document.createElement("div");
            a.id = "GR________link_bookmarklet_node";
            a.style.position = "fixed";
            a.style.background = "#fff";
            a.style.border = "4px solid black";

            a.style.top = "8px";
            a.style.right = "8px";
            a.style.width = "520px";
            a.style.height = "500px";
            a.style.zIndex = 9999;
            this.__iframe_div = a;
            document.body.appendChild(this.__iframe_div);
            var iframe_url = this.grLink + '&host_url=' + encodeURI(('' + window.location));
            this.__iframe_div.innerHTML = '<iframe src="' + iframe_url + '" frameborder="0" id="GR________link_bookmarklet_frame" name="GR________link_bookmarklet_frame" style="width:100%;height:100%;border:0px;padding:0px;margin:0px"></iframe>';
            this.__iframe = document.getElementById("GR________link_bookmarklet_frame");
        }
    };
    agrb.prototype.clear = function(){
        window.location.hash = "";
        window.clearInterval(this.interval);
        var b = document.getElementById("GR________link_bookmarklet_node");
        var c = b && b.parentNode.removeChild(b);
        delete this;
    };

    agrb.prototype.fixUrls = function(data){
        // fix all bad img urls
        var cont = document.createElement("div"),
            imgs,
            b,
            img,
            as,
            a,
            a_url;
        cont.innerHTML = data;
        imgs = cont.getElementsByTagName("img");
        for(b in imgs){
            img = imgs[b];
            img_url = parseUri(img.src);
            img.src = img_url.source;
        }
        as = cont.getElementsByTagName("a");
        for(b in as){
            a= as[b];
            a_url = parseUri(a.href);
            a.href = a_url.source;
        }
        data = cont.innerHTML;
        return data;
    };

    agrb.prototype.on_iframe_ready = function () {
        this.iframe_ready = true;
        this.__iframe.contentWindow.postMessage(this.formdata, this.grLink);
        this.send_embed();
    };

    agrb.prototype.send_embed = function () {
        if(!this.sent_embed && this.embed && this.iframe_ready) {
            this.sent_embed = true;
            this.embed['oembed'] = 1;
            this.__iframe.contentWindow.postMessage(this.embed, this.grLink);
        }
    };

    agrb.prototype.submit = function(){
        this.formdata.snippet = this.fixUrls(this.formdata.snippet);
        this.createIframe();
    };

    agrb.prototype.handle_message = function (event) {
        var method = event.data.method;
        if (method === 'iframe_ready') {
            this.on_iframe_ready();
        } else if (method === 'done_posting') {
            this.clear();
        }
    };

    agrb.prototype.handle_embedly = function (embed) {
        this.embed = embed;
        this.send_embed();
    };

    agrb.prototype.fetch_oembed = function (){
        var base_url = 'https://api.embed.ly/1/oembed';
        var params = {
            url: ('' + window.location),
            maxwidth: 500,
            callback: 'in_action_callback'
        };

        var encoded_params = [];

        for (var param in params) {
            encoded_params.push(param + '=' + encodeURI(params[param]));
        }
        encoded_params = encoded_params.join('&');

        var url = base_url + '?' + encoded_params;
        var script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', url);
        console.log(url);
        document.body.appendChild(script);
    };

    var proxy = function (fn, context) {
        // Simulated bind
        args = Array.prototype.slice.call( arguments, 2 );
        proxy = function() {
            return fn.apply( context, args.concat( Array.prototype.slice.call( arguments ) ) );
        };

        return proxy;
    };

    var in_action = new agrb();
    window.in_action = in_action;
    window.in_action_callback = function (embed) {
        in_action.handle_embedly(embed);
    };

    window.addEventListener("message", proxy(in_action.handle_message, in_action), false);
    in_action.submit();
    in_action.fetch_oembed();
    window.removeLinkFrame = function(){
        var b = document.getElementById("GR________link_bookmarklet_node");
        b.innerHTML = "";
        b.parentNode.removeChild(b);
    };
}());