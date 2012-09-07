from os import environ

from fabric.api import local


def deploy():
    environ['FLASK_CONF'] = './conf/prod.cfg'
    local('python freeze.py')
    local(("s3cmd put --exclude '*.webassets-cache*' --exclude '*static/css*' "
           "--exclude '*static/js*' --acl-public --guess-mime-type -r build/ s3://share-on-adn"))
