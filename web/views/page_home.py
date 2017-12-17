from flask import Response, abort, request
import json
import time


from .. import app
from .. import tankopedia
from .. import database as db
from .. import wgapi
from ..wn8 import wn8
from ..percentile import percentile
from ..functions import filter_data, find_difference


#Page Home.


def calculate_chart_data(chart_timestamps, chart_checkpoints):
    '''Calculate output for the chart on PageHome.

    Global variables must be provided:
        'tankopedia'
        'wn8'
        'find_difference'

    Arguments:
        required: chart_timestamps:List[int] -
        required: chart_checkpoints:List[dict] -
        Both arguments must be sorted list from earliest to latest.
    Returns:
        List[dict] -
    '''

    output = []


    #Needs to have at least 2 checkpoints to show one data point on the chart.
    if len(chart_checkpoints) < 2:
        return output


    #Metrics to be collected during aggreagation. These are the exact keys as in database.
    collect_metrics = ['battle_life_time', 'xp', 'damage_dealt', 'damage_received', 'damage_assisted_radio']
    #Metric names in the output.
    output_metrics = ['wn8', 'blt', 'xp', 'dmgd_p_dar', 'dmgd_d_dmgr']


    for i in range(1, len(chart_checkpoints)):
        #d is a temporary dict to collect aggregations.
        #r is the result dictionary to be appended to output list.
        r = {'timestamp': chart_timestamps[i]}


        #Processing normal checkpoint first.
        d = {'battles': 0, 'wn8': 0}
        d.update({key: 0 for key in collect_metrics})
        for tank in chart_checkpoints[i]:
            #Skip if not in tankopedia.
            if not tankopedia.get(str(tank['tank_id'])):
                continue
            d['battles'] += tank['battles']
            d['wn8'] += tank['battles'] * wn8.calculate_for_tank(tank)
            for key in collect_metrics:
                d[key] += tank[key]


        #Calculating the result for normal checkpoint.
        r.update({key: None for key in output_metrics})
        if d['battles'] > 0:
            r['wn8']         = d['wn8'] / d['battles']
            r['blt']         = d['battle_life_time'] / d['battles']
            r['xp']          = d['xp'] / d['battles']
            r['dmgd_p_dar']  = (d['damage_dealt'] + d['damage_assisted_radio']) / d['battles']
            r['dmgd_d_dmgr'] = d['damage_dealt'] / d['damage_received'] if d['damage_received'] > 0 else 0


        #Processing slice checkpoint.
        d = {'battles': 0, 'wn8': 0}
        d.update({key: 0 for key in collect_metrics})
        for tank in find_difference(chart_checkpoints[i - 1], chart_checkpoints[i]):
            #Skip if not in tankopedia or battles == 0.
            if not tankopedia.get(str(tank['tank_id'])) or not tank['battles']:
                continue
            d['battles'] += tank['battles']
            d['wn8'] += tank['battles'] * wn8.calculate_for_tank(tank)
            for key in collect_metrics:
                d[key] += tank[key]


        #Calculating the result for slice checkpoint.
        r.update({'change_' + key: None for key in output_metrics})
        if d['battles'] > 0:
            r['change_wn8']         = d['wn8'] / d['battles']
            r['change_blt']         = d['battle_life_time'] / d['battles']
            r['change_xp']          = d['xp'] / d['battles']
            r['change_dmgd_p_dar']  = (d['damage_dealt'] + d['damage_assisted_radio']) / d['battles']
            r['change_dmgd_d_dmgr'] = d['damage_dealt'] / d['damage_received'] if d['damage_received'] > 0 else 0


        output.append(r)

    return output


def calculate_table_data(checkpoint_0w, checkpoint_2w_slice, checkpoint_8w_slice):
    '''Calculate output for the table on PageHome.

    Global variables must be provided:
        'tankopedia'
        'percentile'
        'wn8'

    Arguments:
        required: checkpoint_0w:List[dict]       - current checkpoint.
        required: checkpoint_2w_slice:List[dict] - checkpoint slice between now and 2 weeks ago.
        required: checkpoint_8w_slice:List[dict] - checkpoint slice between now and 8 weeks ago.
    Returns:
        Dict[str, Dict[str, num]] - values neccessary for the frontend table.
        Returned values are calculated as (value * battles).
    '''

    collect_metrics = [
        'wins', 'survived_battles', 'xp', 'damage_dealt',
        'damage_received', 'frags', 'spotted', 'capture_points',
        'damage_assisted_radio', 'dropped_capture_points', 'battle_life_time'
    ]
    collect_percentiles = [
        'wins', 'xp', 'battle_life_time'
    ]

    output, keys = {}, ['checkpoint_0w', 'checkpoint_2w', 'checkpoint_8w']

    for c, checkpoint in enumerate([checkpoint_0w, checkpoint_2w_slice, checkpoint_8w_slice]):

        #Init core keys in a temporary dict.
        d = {'battles': 0, 'tier': 0, 'wn8': 0}
        #Init basic metrics.
        d.update({key: 0 for key in collect_metrics})
        #Init percentiles.
        d.update({'perc_' + key: 0 for key in collect_percentiles})



        for tank in checkpoint:

            tier = tankopedia.get(str(tank['tank_id']), {}).get('tier')
            if not tier:
                continue

            d['battles'] += tank['battles']
            d['wn8']     += tank['battles'] * wn8.calculate_for_tank(tank)
            d['tier']    += tank['battles'] * tier

            for key in collect_metrics:
                d[key] += tank[key]
            for key in collect_percentiles:
                d['perc_' + key] += tank['battles'] * percentile.calculate(key, tank)

        output[keys[c]] = d

    return output


@app.route('/api/home/', methods=['POST'])
def api_page_home():
    '''Endpoint for PageHome. Accepts JSON as the body.

    Required JSON keys:
        server:str     - server of the requesting player.
        account_id:int - account_id of the requesting player.
        filters:[str]  - List of turned on filter ids. Empty list = filter everything out.
    Returned JSON keys:
        always:  error:None/str     - Error message on error.
        success: server:str         - server of the requested player.
        success: account_id:int     - account_id of the requested player.
        success: daily_chart:[dict] - Daily bar chart data.
        success: table_data:dict    - Table data.
        success: time:float         - Time took to execute the request.
    '''


    start_time = time.time()


    #Validation & data extraction.
    try:
        body = request.get_json()
        server, account_id, filters = body['server'], body['account_id'], body['filters']
        assert server in ('xbox', 'ps4'), 'server must be either \'xbox\' or \'ps4\''
        assert type(account_id) == int, 'account_id must be of type int'
        assert type(filters) == list, 'filters must be a list of strings'
        assert len(filters) <= 15, 'filters can include maximum 15 items representing tiers and types'
    except (KeyError, AssertionError) as e:
        return Response(json.dumps({
            'error': str(e)
        }), mimetype='application/json')


    #Get current checkpoint.
    error, _ = wgapi.find_cached_or_request(server, account_id)
    if error:
        return Response(json.dumps({'error': error}), mimetype='application/json')


    #Calculating times & getting checkpoints.
    two_months_ago = time.time() - 60 * 60 * 24 * 60
    fifteen_days_ago = time.time() - 60 * 60 * 24 * 15
    checkpoints = db.get_all_checkpoints(server, account_id, min_created_at=two_months_ago)


    #Assigning checkpoints for charts. Up to 11 to calculate difference for 10 days.
    chart_timestamps = [x['created_at'] for x in checkpoints[-11::]]
    chart_checkpoints = [filter_data(x['data'], filters, tankopedia) for x in checkpoints[-11::]]


    #Selecting timestamps for table.
    timestamps = [x['created_at'] for x in checkpoints]
    checkpoint_8w_timestamp = min(timestamps)
    checkpoint_2w_timestamp = min([x for x in timestamps if x > fifteen_days_ago])
    checkpoint_0w_timestamp = max(timestamps)


    #Selecting checkpoints according to the timestamps.
    for checkpoint in checkpoints:
        if checkpoint['created_at'] == checkpoint_8w_timestamp:
            checkpoint_8w = filter_data(checkpoint['data'], filters, tankopedia)
        if checkpoint['created_at'] == checkpoint_2w_timestamp:
            checkpoint_2w = filter_data(checkpoint['data'], filters, tankopedia)
        if checkpoint['created_at'] == checkpoint_0w_timestamp:
            checkpoint_0w = filter_data(checkpoint['data'], filters, tankopedia)


    #Calculation output for the table.
    output_chart = calculate_chart_data(chart_timestamps, chart_checkpoints)


    #Calculation output for the table.
    checkpoint_8w_slice = find_difference(checkpoint_8w, checkpoint_0w)
    checkpoint_2w_slice = find_difference(checkpoint_2w, checkpoint_0w)
    output_table = calculate_table_data(checkpoint_0w, checkpoint_2w_slice, checkpoint_8w_slice)


    return Response(json.dumps({
        'error':       None,
        'server':      server,
        'account_id':  account_id,
        'chart_data':  output_chart,
        'table_data':  output_table,
        'time':        time.time() - start_time
    }), mimetype='application/json')
