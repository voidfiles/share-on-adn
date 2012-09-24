import os
import sys
import logging
import json
import dj_database_url
import peewee
from flask_peewee.db import Database
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


if PORT_NUM != 5000:
    db_config = dj_database_url.config(default='sqlite://test.db')
    app.config['DATABASE'] = {
        'name': db_config.get('NAME'),
        'host': db_config.get('HOST'),
        'port': db_config.get('PORT'),
        'password': db_config.get('PASSWORD'),
        'user': db_config.get('user')
    }

db = Database(app)

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


class BaseModel(db.Model):
    extra_info_text = peewee.TextField()

    def get_extra_info(self):
        if self._json:
            return self._json

        self._json = json.loads(self.extra_info_text)
        return self._json

    def set_extra_info(self, value):
        json_string = json.dumps(value)
        self.extra_info_text = json_string
        self._json = value

    extra_info = property(get_extra_info, set_extra_info)


class User(BaseModel):
    username = peewee.CharField()
    access_token = peewee.CharField()


class Post(BaseModel):
    content = peewee.CharField()

    user = peewee.ForeignKeyField(User)

    def __unicode__(self):
        return self.title


@app.route("/")
@app.route("/index.html")
def hello():
    return render_template('index.html', ROOT_URL=app.config.get('ROOT_URL'))


@app.route("/inbound/email", methods=['GET', 'POST'])
def inbound_email():
    if request.method == 'GET':
        return 'ok'

    json_data = json.dumps(request.json)
    json_data2 = request.data
    inbound = PostmarkInbound(json=json_data)
    logger.info(inbound.json)
    logger.info(request.headers)
    logger.info(json_data2)
    return 'ok'

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=PORT_NUM)
