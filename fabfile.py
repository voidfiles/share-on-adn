from os import environ

from fabric.api import local


def deploy():
    environ['FLASK_CONF'] = './conf/prod.cfg'
    local('python freeze.py')
    local(("s3cmd put --exclude '*.webassets-cache*' --exclude '*static/css*' "
           "--exclude '*static/js*' --acl-public --guess-mime-type -r build/ s3://share-on-adn"))
    local('cp -fR build /tmp/_store_them_files')
    local('git checkout gh-pages')
    local('cp -fR /tmp/_store_them_files/* ./')
    local('git commit -a -m "page bump"')
    local('git push origin gh-pages')
