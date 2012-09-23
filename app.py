import os
import sys
import logging
import json

from flask import Flask, render_template
from flask import request
from flask.ext.assets import Environment, Bundle
from postmark.inbound import PostmarkInbound

logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format='"%(asctime)s %(levelname)8s %(name)s - %(message)s"',
    datefmt='%H:%M:%S'
)

logger = logging.getLogger(__name__)

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


@app.route("/inbound/email")
def inbound_email():
    json_data = json.dumps(request.json)
    inbound = PostmarkInbound(json=json_data)
    logger.INFO(inbound.json)
    return 'ok'

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=PORT_NUM)
