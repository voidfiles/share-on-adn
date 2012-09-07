from os import environ

from fabric.api import local,  settings


def deploy():
    environ['FLASK_CONF'] = './conf/prod.cfg'
    local('python freeze.py')
    local(("s3cmd put --exclude '*.webassets-cache*' --exclude '*static/css*' "
           "--exclude '*static/js*' --acl-public --guess-mime-type -r build/ s3://share-on-adn"))


def deploy_pages():
    with settings(warn_only=True):
        local('cp -fR build /tmp/_store_them_files')
        local('git checkout gh-pages')
        local('cp -fR /tmp/_store_them_files/* ./')
        local('git add .')
        local('git commit -a -m "page bump"')
        local('git push -f origin gh-pages')
    local('git checkout master')
