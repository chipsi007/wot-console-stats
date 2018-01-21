from flask import Response, request
import time
import json

from .. import app
from .. import tankopedia
from .. import database as db

from ..wn8 import wn8
from ..percentile import percentile
from ..functions import filter_data, find_difference


#Page Timeseries.


@app.route('/api/timeseries/get/', methods=['POST'])
def api_timeseries_get():
    '''Endpoint for PageTimeseries to get historical data for player. Accepts JSON as the body.

    Required JSON keys:
        server:str        -
        accountID:int     -
        timeScale:str     - 
        formula:List[Obj] - 
        tankID:int/None   - int in case when single tank data should be returned, otherwise none.
        tiers:List[str]   - list of tiers to aggregate in single datapoint. Ignore if tankID is not None.
        types:List[str]   - list of types to aggregate in single datapoint. Ignore if tankID is not None.
    Returned JSON keys:
        always:  error:None/str        - Error message on error.
        success: time:float            - Time took to execute the request.
        success: xTimestamps:List[int] - unix timestamps in seconds.
        success: yTotals:List[float]   - values corresponding with timestamps.
        success: yChange:List[float]   - values corresponding with timestamps.
    '''


    start_time = time.time()


    #Validation.
    try:
        body = request.get_json()
        server, account_id = body['server'], body['accountID']
        time_scale, formula = body['timeScale'], body['formula']
        tiers, types = body['tiers'], body['types']
        tank_id = body['tankID']
        assert server in ['xbox', 'ps4'],               'server must be: xbox, ps4'
        assert type(account_id) == int,                 'account_id is not integer'
        assert time_scale in ['daily', 'weekly'],       'time_scale must be: daily, weekly'
        assert type(tank_id) is int or tank_id is None, 'tank_id must be None or integer'
    except AssertionError as e:
        return Response(json.dumps({
            'error': str(e)
        }), mimetype='application/json')


    #Fetching data from database.
    if time_scale == 'daily':
        fourteen_days_ago = int(time.time()) - 60 * 60 * 24 * 14
        checkpoints_data = db.get_all_checkpoints(server, account_id, min_created_at=fourteen_days_ago)
    if time_scale == 'weekly':
        checkpoints_data = db.get_first_checkoint_per_week(server, account_id)


    #Unpacking checkpoints.
    timestamps, checkpoints = [], []
    for item in checkpoints_data:
        timestamps.append(item['created_at'])
        checkpoints.append(item['data'])


    #Filtering.
    if tank_id:
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
    else:
        checkpoints_filtered = []
        for checkpoint in checkpoints:
            #tankopedia and filter_data are globals
            checkpoints_filtered.append(filter_data(checkpoint, tiers + types, tankopedia))
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
        'error':       None,
        'time':        time.time() - start_time,
        'xTimestamps': timestamps,
        'yTotals':     output,
        'yChange':     output_change
    }), mimetype='application/json')
