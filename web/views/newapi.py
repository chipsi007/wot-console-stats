from flask import Response, request
import time
import json

from .. import app
from .. import tankopedia
from .. import database as db
from .. import wgapi
from ..wn8 import wn8
from ..percentile import percentile
from ..functions import filter_data, find_difference


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


@app.route('/newapi/estimates/get-tank/')
def newapi_estimates_get_tank():
    #GET args: server, account_id, tank_id
    start = time.time()

    #Getting arguments and validating.
    try:
        server = request.args.get('server')
        account_id = int(request.args.get('account_id'))
        tank_id = int(request.args.get('tank_id'))
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

    data = [tank for tank in data if tank['tank_id'] == tank_id]
    if any(data) == False:
        return Response(json.dumps({
            'status': 'error',
            'message': 'no such tank found',
        }), mimetype='application/json')
    tank_data = data[0]

    #Calculating WN8 actual values.
    wn8_act_values = {
        'Damage':  round(tank_data['damage_dealt'] / tank_data['battles'], 2),
        'Def':     round(tank_data['dropped_capture_points'] / tank_data['battles'], 2),
        'Frag':    round(tank_data['frags'] / tank_data['battles'], 2),
        'Spot':    round(tank_data['spotted'] / tank_data['battles'], 2),
        'WinRate': round(tank_data['wins'] / tank_data['battles'] * 100, 2)
    }

    output = {
        'wn8_score':      int(wn8.calculate_for_tank(tank_data)),
        'wn8_act_values': wn8_act_values,
        'wn8_exp_values': wn8.get_values(tank_id),
        'wn8_estimates':  wn8.get_damage_targets(tank_data),
        'tank_data':      tank_data
    }

    return Response(json.dumps({
        'status':     'ok',
        'message':    'ok',
        'count':      len(output),
        'server':     server,
        'account_id': account_id,
        'data':       output,
        'time':       time.time() - start
    }), mimetype='application/json')
