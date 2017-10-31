from flask import Response, request
import time
import json

from .. import app
from .. import tankopedia
from ..database import db
from ..secret import app_id
from ..wgapi import wgapi
from ..wn8 import wn8
from ..functions import filter_data, find_difference


#New API inteface - smaller made to be reuseable.


@app.route('/newapi/general/get-player-tanks/')
def newapi_general_get_player_tanks():
    #GET args: server, account_id
    start = time.time()

    #Validating inputs.
    try:
        server = request.args.get('server')
        account_id = int(request.args.get('account_id'))
        assert server in ('xbox', 'ps4'), "server must be either 'xbox' or 'ps4'"
    except (AssertionError, ValueError) as e:
        return Response(json.dumps({
            'status': 'error',
            'message': str(e)
        }), mimetype='application/json')

    #Request player data or find cached.
    status, message, data = wgapi.find_cached_or_request(server, account_id, app_id)
    if status != 'ok':
        return Response(json.dumps({
            'status': status,
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
    except (AssertionError, ValueError) as e:
        return Response(json.dumps({
            'status': 'error',
            'message': str(e)
        }), mimetype='application/json')

    #Request player data or find cached.
    status, message, data = wgapi.find_cached_or_request(server, account_id, app_id)
    if status != 'ok':
        return Response(json.dumps({
            'status': status,
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


@app.route('/newapi/timeseries/get-data/', methods=['POST'])
def newapi_timeseries_get_data():
    start = time.time()

    #Extracting JSON request body.
    try:
        body = request.get_json()
        server =        body['server']
        account_id =    body['account_id']
        time_scale =    body['time_scale']
        formula =       body['formula']
        filter_by =     body['filter_by']
        filters =       body['filters']
        tank_id =       body['tank_id']
    except KeyError as e:
        return Response(json.dumps({
            'status':     'error',
            'message':    'key {} is not present in JSON POST body'.format(str(e))
        }), mimetype='application/json')


    #Validating inputs.
    try:
        assert server in ['xbox', 'ps4'],                               'server must be: xbox, ps4'
        assert type(account_id) == int,                                 'account_id is not integer'
        assert time_scale in ['daily', 'weekly'],                       'time_scale must be: daily, weekly'
        assert filter_by in ['filters', 'tank'],                        'filter_by must be: filters, tank'
        assert type(tank_id) is int if filter_by is 'tank' else True,   'tank_id must be integer if filter_by == tank'
        assert len(filters) > 0 if type(filters) is list else False,    'filters must be a list with length > 0'
    except AssertionError as e:
        return Response(json.dumps({
            'status':     'error',
            'message':    str(e)
        }), mimetype='application/json')
    except:
        return Response(json.dumps({
            'status':     'error',
            'message':    'bad request'
        }), mimetype='application/json')


    #Fetching data from database.
    if time_scale == 'daily':
        checkpoints_data = db.get_all_recent_checkpoints(server, account_id)
    if time_scale == 'weekly':
        checkpoints_data = db.get_first_checkoint_per_week(server, account_id)


    #Unpacking checkpoints.
    timestamps, checkpoints = [], []
    for item in checkpoints_data:
        timestamps.append(item['created_at'])
        checkpoints.append(item['data'])


    #Filtering.
    if filter_by == 'tank':
        #Leaving one selected tank in every checkpoint.
        checkpoints_filtered = []
        for checkpoint in checkpoints:
            for tank in checkpoint:
                if tank['tank_id'] == tank_id:
                    checkpoints_filtered.append([tank])
                    break
            else:
                checkpoints_filtered.append([])
        checkpoints = checkpoints_filtered
        for checkpoint in checkpoints:
            print(len(checkpoint))
    if filter_by == 'filters':
        checkpoints_filtered = []
        for checkpoint in checkpoints:
            #tankopedia and filter_data is globals
            checkpoints_filtered.append(filter_data(checkpoint, filters, tankopedia))
        checkpoints = checkpoints_filtered


    #Output as will be presented in returned data.
    output = [None for i in range(len(checkpoints))]
    output_change = [None for i in range(len(checkpoints))]

    for c, checkpoint in enumerate(checkpoints):

        #If no tanks in the checkpoint.
        if not any(checkpoint):
            output[c] = None
            continue

        #No function at the start of the formula.
        func = None

        #Iterate through formula items.
        for item in formula:
            item_type, item_id = item['type'], item['id']

            #Operation - assign function.
            if item_type == 'op':
                if item_id == 'plus':
                    func = lambda x, y: x + y
                elif item_id == 'minus':
                    func = lambda x, y: x - y
                elif item_id == 'times':
                    func = lambda x, y: x * y
                elif item_id == 'divide':
                    func = lambda x, y: x / y if y != 0 else 0
                else:
                    raise
                continue
            #Raw field from database.
            if item_type == 'raw':

                number = 0
                for tank in checkpoint:
                    number += tank[item_id]
            #Simple number.
            elif item_type == 'num':

                #Numbers are applied to the whole result. Not per tank basis.
                if item_id == 'sixty':
                    number = 60
                elif item_id == 'hundred':
                    number = 100
                elif item_id == 'twentyfour':
                    number = 24
                else:
                    raise
            #WN8
            elif item_type == 'wn8':

                number = wn8.calculate_for_all_tanks(checkpoint)
            #Percentiles.
            elif item_type == 'perc':

                kind = item_id
                total_battles, cum_value = 0, 0

                for tank in checkpoint:
                    perc = percentile.calculate(kind, tank)

                    if perc != 0:
                        battles = tank['battles']
                        cum_value += perc * battles
                        total_battles += battles

                number = cum_value / total_battles if total_battles > 0 else 0.0
            else:
                raise

            #Apply function if not the first item in the formula.
            output[c] = func(output[c], number) if func else number

        # TODO: Formula blocks are repeated. Might be worth wrapping into a function.
        #Do not calculate change if first item.
        if c == 0:
            continue

        diff_checkpoint = find_difference(checkpoints[c - 1], checkpoint)
        #No function at the start of the formula.
        func = None

        #Iterate through formula items.
        for item in formula:
            item_type, item_id = item['type'], item['id']

            #Operation - assign function.
            if item_type == 'op':
                if item_id == 'plus':
                    func = lambda x, y: x + y
                elif item_id == 'minus':
                    func = lambda x, y: x - y
                elif item_id == 'times':
                    func = lambda x, y: x * y
                elif item_id == 'divide':
                    func = lambda x, y: x / y if y != 0 else 0
                else:
                    raise
                continue
            #Raw field from database.
            if item_type == 'raw':

                number = 0
                for tank in diff_checkpoint:
                    number += tank[item_id]
            #Simple number.
            elif item_type == 'num':

                #Numbers are applied to the whole result. Not per tank basis.
                if item_id == 'sixty':
                    number = 60
                elif item_id == 'hundred':
                    number = 100
                elif item_id == 'twentyfour':
                    number = 24
                else:
                    raise
            #WN8
            elif item_type == 'wn8':

                number = wn8.calculate_for_all_tanks(diff_checkpoint)
            #Percentiles.
            elif item_type == 'perc':

                kind = item_id
                total_battles, cum_value = 0, 0

                for tank in diff_checkpoint:
                    perc = percentile.calculate(kind, tank)

                    if perc != 0:
                        battles = tank['battles']
                        cum_value += perc * battles
                        total_battles += battles

                number = cum_value / total_battles if total_battles > 0 else 0.0
            else:
                raise

            #Apply function if not the first item in the formula.
            output_change[c] = func(output_change[c], number) if func else number

    return Response(json.dumps({
        'status':      'ok',
        'message':     'ok',
        'timestamps':  timestamps,
        'data_totals': output,
        'data_change': output_change,
        'time':        time.time() - start
    }), mimetype='application/json')
