# manage.py
from flask.ext.script import Manager
from flask.ext.assets import ManageAssets

from app import app, assets

manager = Manager(app)

manager.add_command("assets", ManageAssets(assets))


if __name__ == "__main__":
    manager.run()
