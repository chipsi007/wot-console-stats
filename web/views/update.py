from flask import Response, request
import time
import json

from .. import app
from .. import database as db
from .. import tankopedia
from ..percentile import percentile
from ..wn8 import wn8
from ..secret import access_key


#Endpoint to update tankopedia, percentiles, wn8 exp values.


@app.route('/update/', methods=['POST'])
def update():
    '''Update pre-calculated values that support the website.

    Accepts:
        HTTP POST request with JSON body:
        {
            "name":str          - name of the object.
            "headers":List[str] - headers of items in 'rows' field.
            "rows":List[List]   - actual data as list of lists.
            "count":int         - count of the items in the 'rows' field for basic validation.
            "access_key":str    - secret access key for security purpose.
        }
    Returns:
        HTTP JSON response:
        {
            required "error":Any(None, str) - None if no error. String with error message in case of error.
            optional "time:float            - time took to execute request. Omitted of error is not None.
        }
    '''


    start = time.time()

    #Validation, extract name and data.
    try:
        body = request.get_json()
        assert body['access_key'] == access_key, 'access_key doesnt match'
        name, headers, rows, count = body['name'], body['headers'], body['rows'], body['count']
        assert len(rows) == count, 'length of \'rows\' and \'count\' dont match'
    except (KeyError, AssertionError) as e:
        return Response(json.dumps({
            'error': str(e)
        }), mimetype='application/json')


    #Default.
    error = None

    if name == 'tankopedia':
        db.insert_tankopedia(headers, rows)
        tankopedia.load()

    elif name == 'percentiles':
        db.insert_percentiles(headers, rows)
        percentile.load()

    elif name == 'percentiles_generic':
        db.insert_percentiles_generic(headers, rows)
        percentile.load()

    elif name == 'wn8':
        db.insert_wn8(headers, rows)
        wn8.load()

    elif name == 'history':
        db.insert_history(headers, rows)

    else:
        error = 'unknown name property'


    return Response(json.dumps({
        'error': error,
        'time':  time.time() - start
    }), mimetype='application/json')
