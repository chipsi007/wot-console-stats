from flask import Response, abort, request
import json
import time


from .. import app
from .. import tankopedia
from .. import database as db


#Page History.


@app.route('/api/history/get/', methods=['POST'])
def api_history_get():
    '''Endpoint for PageHistory to get historical data. Accepts JSON as the body.

    Required JSON keys:
        selected_items:List[Obj] - Obj contains:
            name:str         - ID of the item for identification.
            tankID:int/None  - int in case when single tank data should be returned, otherwise none.
            tiers:List[str]  - list of tiers to aggregate in single datapoint. Ignore if tankID is not None.
            types:List[str]  - list of types to aggregate in single datapoint. Ignore if tankID is not None.
    Returned JSON keys:
        always:  error:None/str   - Error message on error.
        success: time:float       - Time took to execute the request.
        success: data:List[Obj] - Obj contains:
            name:str            - ID of the item for identification.
            data:Dict[str, arr] - Object with various metrics.
    '''

    start_time = time.time()


    #Validation & data extraction.
    try:
        selected_items = request.get_json()['selected_items']
        assert type(selected_items) == list, 'selected_items must be a list of objects'
    except (KeyError, AssertionError) as e:
        return Response(json.dumps({
            'error': str(e)
        }), mimetype='application/json')


    output = []
    for item in selected_items:
        tank_id, name = item.get('tankID'), item.get('name')

        #If single tank id.
        if tank_id:
            db.get_history(tank_id=tank_id)
            output.append({
                'name':    name,
                'tank_id': tank_id,
                'rows':    db.get_history(tank_id=tank_id)
            })
            continue

        #If set of tank ids.
        types, tiers = set(item['types']), set([int(x) for x in item['tiers']])
        tank_ids = tankopedia.get_tank_ids(types, tiers)
        output.append({
            'name':    name,
            'tank_id': tank_id,
            'rows':    db.get_history(tank_ids=tank_ids)
        })


    return Response(json.dumps({
        'error': None,
        'time': time.time() - start_time,
        'data': output
    }), mimetype='application/json')
