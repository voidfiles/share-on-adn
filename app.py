import os
from flask import Flask, render_template
from flask.ext.assets import Environment, Bundle

flask_conf = os.environ.get('FLASK_CONF') or './conf/dev.cfg'
PORT_NUM = int(os.environ.get('PORT', 5000))
if PORT_NUM != 5000:
    flask_conf = './conf/heroku.cfg'

app = Flask(__name__)
app.config.from_pyfile(flask_conf, silent=True)

assets = Environment(app)

js = Bundle(
    './js/json2.js',
    './js/jquery.isotope.min.js',
    './js/sanatize.js',
    './js/jquery.cookie.js',
    './js/underscore-min.js',
    './js/backbone-min.js',
    './js/app.js',
    filters='jsmin',
    output='./gen/%(version)s_packed.js')

assets.register('js_all', js)

bookmarklet = Bundle(
    './js/bookmarklet.js',
    filters='jsmin',
    output='./gen/bookmarklet.js')

assets.register('bookmarklet', bookmarklet)

js = Bundle(
    './css/bootstrap.css',
    './css/grids-min.css',
    './css/default.css',
    filters='cssmin',
    output='./gen/%(version)s_packed.css')

assets.register('css_all', js)


@app.route("/")
@app.route("/index.html")
def hello():
    return render_template('index.html', ROOT_URL=app.config.get('ROOT_URL'))


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=PORT_NUM)
