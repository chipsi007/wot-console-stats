from flask import Response, request
import time
import json

from .. import app
from .. import tankopedia
from .. import wgapi


#New API inteface - smaller, made to be reuseable.


@app.route('/newapi/general/get-player-tanks/')
def newapi_general_get_player_tanks():
    #GET args: server, account_id
    start = time.time()

    #Validating inputs.
    try:
        server = request.args.get('server')
        account_id = int(request.args.get('account_id'))
        assert server in ('xbox', 'ps4'), "server must be either 'xbox' or 'ps4'"
    except (AssertionError, ValueError, TypeError) as e:
        return Response(json.dumps({
            'status': 'error',
            'message': str(e)
        }), mimetype='application/json')

    #Request player data or find cached.
    message, data = wgapi.find_cached_or_request(server, account_id)
    if message:
        return Response(json.dumps({
            'status': 'error',
            'message': message
        }), mimetype='application/json')

    #Getting tanks. Adding to output only if the tank_id present in tankopedia.
    output = []
    for tank in data:
        tp_tank = tankopedia.get(str(tank['tank_id']))
        if tp_tank:
            output.append(tp_tank)

    return Response(json.dumps({
        'status':     'ok',
        'message':    'ok',
        'count':      len(output),
        'server':     server,
        'account_id': account_id,
        'data':       output,
        'time':       time.time() - start
    }), mimetype='application/json')
