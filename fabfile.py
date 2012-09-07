from os import environ

from fabric.api import local,  settings


def build_site():
    environ['FLASK_CONF'] = './conf/prod.cfg'
    local('rm -fR static/gen/*')
    local('python manage.py assets build')
    local('python freeze.py')


def deploy():
    build_site()
    local('rm -fR static/gen/*')
    local(("s3cmd put --exclude '*.webassets-cache*' --exclude '*static/css*' "
           "--exclude '*static/js*' --acl-public --guess-mime-type -r build/ s3://share-on-adn"))


def deploy_pages():
    with settings(warn_only=True):
        local('rm -fR /tmp/_store_them_files')
        local('mv build /tmp/_store_them_files')
        local('git checkout gh-pages')
        local('cp -fR /tmp/_store_them_files/* ./')
        local('git add .')
        local('git commit -a -m "page bump"')
        local('git push -f origin gh-pages')
    local('git checkout master')
