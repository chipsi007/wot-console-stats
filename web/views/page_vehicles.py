from flask import Response, abort
import json
import time


from .. import app
from .. import wgapi
from .. import database as db
from .. import tankopedia
from ..percentile import percentile
from ..wn8 import wn8


#Page vehicles.


class pageVehicles():
    def __init__(self, server, account_id, player_data):
        self.server = server
        self.account_id = account_id
        self.player_data = player_data
    def extract_vehicle_data(self):
        extracted_data = []
        for vehicle in self.player_data:

            if vehicle['battles'] < 1:
                continue

            #Creating the dictionary.
            temp_dict = {}

            temp_dict['tank_id'] = vehicle['tank_id']
            temp_dict['battles'] = vehicle['battles']
            temp_dict['survived'] = vehicle['survived_battles'] / vehicle['battles']

            #Naming.
            tp_dict = tankopedia.get(str(temp_dict['tank_id']))
            if tp_dict:
                temp_dict['short_name'] = tp_dict['short_name']
                temp_dict['name'] = tp_dict['name']
                temp_dict['tier'] = tp_dict['tier']
                temp_dict['type'] = tp_dict['type']
            else:
                temp_dict['short_name'] = 'Unknown'
                temp_dict['name'] = 'Unknown'
                temp_dict['tier'] = 0
                temp_dict['type'] = 'Unknown'

            #WN8
            temp_dict['wn8'] = wn8.calculate_for_tank(vehicle)

            temp_dict['avg_dmg'] = vehicle['damage_dealt'] / vehicle['battles']
            temp_dict['avg_frags'] = vehicle['frags'] / vehicle['battles']

            #'avg_dpm', 'avg_fpm', 'avg_epm'
            if vehicle['battle_life_time'] > 0:
                temp_dict['avg_dpm'] = vehicle['damage_dealt'] / vehicle['battle_life_time'] * 60
                temp_dict['avg_fpm'] = vehicle['frags'] / vehicle['battle_life_time'] * 60
                temp_dict['avg_epm'] = vehicle['xp'] / vehicle['battle_life_time'] * 60
            else:
                temp_dict['avg_dpm'] = 0
                temp_dict['avg_fpm'] = 0
                temp_dict['avg_epm'] = 0

            #Percentiles
            temp_dict['avg_dmg'] = vehicle['damage_dealt'] / vehicle['battles']
            temp_dict['dmg_perc'] = percentile.calculate('damage_dealt', vehicle)

            temp_dict['wr'] = vehicle['wins'] / vehicle['battles'] * 100
            temp_dict['wr_perc'] = percentile.calculate('wins', vehicle)

            temp_dict['avg_exp'] = vehicle['xp'] / vehicle['battles']
            temp_dict['exp_perc'] = percentile.calculate('xp', vehicle)


            #'pen_hits_ratio'
            if vehicle['hits'] > 0:
                temp_dict['pen_hits_ratio'] = vehicle['piercings'] / vehicle['hits']
            else:
                temp_dict['pen_hits_ratio'] = 0

            #'bounced_hits_ratio'
            if vehicle['direct_hits_received'] > 0:
                temp_dict['bounced_hits_ratio'] = vehicle['no_damage_direct_hits_received'] / vehicle['direct_hits_received']
            else:
                temp_dict['bounced_hits_ratio'] = 0

            #Time values.
            temp_dict['total_time_m'] = vehicle['battle_life_time'] / 60
            temp_dict['avg_lifetime_s'] = vehicle['battle_life_time'] / vehicle['battles']
            temp_dict['last_time'] = vehicle['last_battle_time']


            extracted_data.append(temp_dict)
        self.player_data = extracted_data


@app.route('/api/vehicles/<server>/<int:account_id>/<int:timestamp>/<filters>/')
def api_vehicles(server, account_id, timestamp, filters):

    start = time.time()

    #Validation.
    try:
        assert server in ('xbox', 'ps4')
    except:
        abort(404)

    #Request player data or find cached.
    message, data = wgapi.find_cached_or_request(server, account_id)
    if message:
        return Response(json.dumps({
            'status': 'error',
            'message': message
        }), mimetype='application/json')

    user = pageVehicles(server, account_id, data)
    user.extract_vehicle_data()
    output = user.player_data

    return Response(json.dumps({
        'status':     'ok',
        'message':    'ok',
        'count':      len(output),
        'server':     server,
        'account_id': account_id,
        'data':       output,
        'time':       time.time() - start
    }), mimetype='application/json')
