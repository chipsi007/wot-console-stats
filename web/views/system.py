from .. import app
from .. import tankopedia
from ..percentile import percentile
from ..wn8 import wn8


#System functions.


@app.before_first_request
def before_first_request():
    tankopedia.load()
    percentile.load()
    wn8.load()
