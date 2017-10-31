from flask import Response
import time
import json

from .. import app
from ..database import db
from .. import tankopedia
from ..percentile import percentile
from ..wn8 import wn8
from ..secret import app_id


#Endpoint to update tankopedia, percentiles, wn8 exp values.


@app.route('/update/', methods=['POST'])
def update():
    start = time.time()

    #Validation, extract name and data.
    try:
        body = request.get_json()
        assert body['access_key'] == access_key, 'access_key doesnt match'
        name, data, count = body['name'], body['data'], body['count']
        assert len(data) == count, 'length of "data" and "count" dont match'

    except (KeyError, AssertionError) as e:
        return Response(json.dumps({
            'status':     'error',
            'message':    str(e)
        }), mimetype='application/json')


    #Defaults.
    status, message = 'error', 'shouldnt be updated'


    if name == 'tankopedia':
        old_data = db.get_tankopedia()
        if len(data) >= len(old_data):
            db.insert_tankopedia(data)
            tankopedia.load()
            status = message = 'ok'

    elif name == 'percentiles':
        old_data = db.get_percentiles()
        if len(data) >= len(old_data):
            db.insert_percentiles(data)
            percentile.load()
            status = message = 'ok'

    elif name == 'percentiles_generic':
        old_data = db.get_percentiles_generic()
        if len(data) >= len(old_data):
            db.insert_percentiles_generic(data)
            percentile.load()
            status = message = 'ok'

    elif name == 'wn8':
        old_data = db.get_wn8()
        if len(data) >= len(old_data):
            db.insert_wn8(data)
            wn8.load()
            status = message = 'ok'

    else:
        status = 'error'
        message = 'unknown name property'


    return Response(json.dumps({
        'status':     status,
        'message':    message,
        'time':       time.time() - start
    }), mimetype='application/json')
