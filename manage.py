# manage.py
from flask.ext.script import Manager
from flask.ext.assets import ManageAssets

from app import app, assets, User, Post

manager = Manager(app)

manager.add_command("assets", ManageAssets(assets))


@manager.command
def create_database():
    User.create_table()
    Post.create_table()


if __name__ == "__main__":
    manager.run()
