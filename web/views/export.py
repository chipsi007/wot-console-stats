from flask import Response
import time
import json

from .. import app
from .. import database as db


#Module with GET endpoints to export general data.


@app.route('/export/tankopedia/')
def export_tankopedia():

    start = time.time()

    tankopedia = db.get_tankopedia()
    output = list(tankopedia.values())

    return Response(json.dumps({
        'error':      None,
        'count':      len(output),
        'data':       output,
        'time':       time.time() - start
    }), mimetype='application/json')
