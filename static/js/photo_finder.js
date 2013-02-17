

(function () {
    var token = 'TljRbSsKZW2CfiJkYlW1J5cYmp3kS3ZFdguEkh8YQD1cky0FW8otJn5JLl5BSo0g9KhZw0eOGhyI4q8albP7oHaCfg+HtXzq9Ah7AIhfHGs=';
    var regex_found = /^https?:\/\/.*?\.?ffffound\.com\//;

    if (location.href.match(regex_found)) {
        window.alert('This bookmarklet cannot use in ffffound.com domain.');
        return;
    }

    var res_endpoint = 'http://ffffound.com/add_asset';

    var res_popupimg_src = 'http://ffffound.com/assets/bookmarklet_01.r3000.gif';
    var res_popupimg_w = 149;
    var res_popupimg_h = 44;

    var res_popupimg2_src = 'http://ffffound.com/assets/bookmarklet_02.r3000.gif';
    var res_popupimg2_w = 149;
    var res_popupimg2_h = 44;

    var min_size = 200;

    var style_em_size = 10;
    var style_em_color = '#0000ff';
    var style_om_color = '#0000ff';
    var style_om_color_ff = 'rgb(0, 0, 255)';

    var isie = 0 <= navigator.appName.indexOf('Internet Explorer');
    var isff = 0 <= navigator.userAgent.indexOf('Firefox');
    var iswk = 0 <= navigator.userAgent.indexOf('Safari');

    var frames = document.getElementsByTagName('frame');
    var d;
    if (0 < frames.length) {
        d = window[0].document;
    }
    else {
        d = document;
    }

    var selectedimg = null;

    var ele_popup = d.createElement('div');
    ele_popup.id = '__found-popup';
    ele_popup.style.display = 'none';
    ele_popup.style.zIndex = 10000;
    ele_popup.style.position = 'absolute';
    ele_popup.style.margin = '0px';
    ele_popup.style.padding = '0px';
    ele_popup.style.borderWidth = '0px';
    ele_popup.onmouseout = function () {
        selectedimg = null;
        setTimeout(function () {
            resetAll();
        }, 50);
    };
    d.body.appendChild(ele_popup);

    var imgs = d.getElementsByTagName('img');
    var found = false;
    for (var i = 0; i < imgs.length; i++) {
        var img = imgs[i];
        if (img.src.match(regex_found)) {
            continue;
        }
        // else if (img.src.match(/\.(jpg|gif|png)/i)) {
        else {
            if (img.width < min_size && img.height < min_size) {
                continue;
            }

            if (img.src.match(/\.(tif|tiff|bmp)$/i)) {
                continue;
            }

            found = true;
            img.style.border = style_em_size + 'px solid ' + style_em_color;
            img.style.cursor = 'pointer';

            img.onclick = function () {
                addToFound();
                return false;
            };

            img.onmouseover = function () {
                selectedimg = this;

                var ele_a = d.createElement('a');
                ele_a.href = 'javascript:void(0);';
                ele_a.onclick = function () {
                    addToFound();
                    return false;
                };

                var ele_img = d.createElement('img');
                ele_img.src = res_popupimg_src;
                ele_img.width = res_popupimg_w;
                ele_img.height = res_popupimg_h;
                ele_img.alt = 'ADD TO MY FOUND';
                ele_img.border = 0;

                ele_a.appendChild(ele_img);

                if (ele_popup.firstChild) {
                    ele_popup.removeChild(ele_popup.firstChild);
                }
                ele_popup.appendChild(ele_a);

                var offset = getElementOffset(this);
                ele_popup.style.left = offset[0] + ((this.width + (style_em_size * 2)) / 2) - (res_popupimg_w / 2) + 'px';
                ele_popup.style.top = offset[1] + ((this.height + (style_em_size * 2)) / 2) - (res_popupimg_h / 2) + 'px';
                ele_popup.style.display = '';

                var img = this;
                ele_popup.onmouseover = function () {
                    selectedimg = img;
                };

                this.style.border = style_em_size + 'px solid ' + style_om_color;
            };

            img.onmouseout = function () {
                selectedimg = null;
                setTimeout(function () {
                    resetAll();
                }, 50);
            };
        }
    }

    if (!found) {
        window.alert('Image not found.');
    }

    function addToFound() {
        var img = selectedimg;

        if (img == null) {
            return;
        }

        var params = {
            'token': token,
            'url': img.src,
            'referer': (img.src == location.href ? document.referrer : location.href),
            'title': d.title,
            'alt': img.alt
        };

        var urlb = [];
        urlb.push(res_endpoint);
        urlb.push('?');
        for (var n in params) {
            urlb.push(encodeURIComponent(n));
            urlb.push('=');
            urlb.push(encodeURIComponent(params[n]));
            urlb.push('&');
        }

        if (true) {
            window.open(urlb.join(''),
                    'found' + new Date().getTime(),
                    'status=no,resizable=no,scrollbars=no,personalbar=no,directories=no,location=no,toolbar=no,menubar=no,' +
                    'width=300,height=50,left=0,top=0');
        }

        disableImage(img);
        resetAll();

        return false;
    }

    function disableImage(img) {
        img.onclick = null;
        img.onmouseover = null;
        img.onmouseout = null;
        img.style.border = style_em_size + 'px solid #000000';

        var w = img.width + (style_em_size * 2);
        var h = img.height + (style_em_size * 2);

        var e = d.createElement('div');
        e.style.zIndex = 10010;
        e.style.position = 'absolute';
        e.style.margin = '0px';
        e.style.padding = '0px';
        e.style.borderWidth = '0px';
        e.style.backgroundColor = '#000000';
        e.style.width = w;
        e.style.height = h;

        var offset = getElementOffset(img);
        e.style.left = offset[0] + 'px';
        e.style.top = offset[1] + 'px';

        d.body.appendChild(e);

        e.innerHTML = '<table cellpadding="0" cellspacing="0" border="0" width="' + w + '" height="' + h + '"><tr><td align="center" valign="middle"><img src="' + res_popupimg2_src + '" width="' + res_popupimg2_w + '" height="' + res_popupimg2_h + '" border="0"></td></tr></table>';
    }

    function resetAll() {
        for (var i = 0; i < imgs.length; i++) {
            var img = imgs[i];
            if (hide(img)) {
                img.style.border = style_em_size + 'px solid ' + style_em_color;
                if (selectedimg == null) {
                    ele_popup.style.display = 'none';
                }
            }
        }

        function hide(img) {
            if (img == selectedimg) {
                return;
            }

            if (iswk) {
                return img.style.borderTopWidth == style_em_size + 'px' &&
                    img.style.borderTopStyle == 'solid' &&
                    img.style.borderTopColor == style_om_color_ff;
            }
            else if (isff) {
                return img.style.border == style_em_size + 'px solid ' + style_om_color_ff;
            }
            else {
                return img.style.border == style_om_color + ' ' + style_em_size + 'px solid';
            }
        }
    }

    // import from prototype.js.
    // (c) 2005 Sam Stephenson <sam@conio.net>
    // http://prototype.conio.net
    function getElementOffset(element) {
        var valueT = 0, valueL = 0;
        do {
            valueT += element.offsetTop  || 0;
            valueL += element.offsetLeft || 0;
            element = element.offsetParent;
            if (element) {
                p = element.style.position;
                if (p == 'relative' || p == 'absolute') break;
            }
        } while (element);
        return [valueL, valueT];
    }
})();
