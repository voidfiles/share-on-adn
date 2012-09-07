from flask_frozen import Freezer
from app import app

freezer = Freezer(app)


@freezer.register_generator
def product_url_generator():
    # URLs as strings
    yield '/index.html'

if __name__ == '__main__':
    freezer.freeze()
