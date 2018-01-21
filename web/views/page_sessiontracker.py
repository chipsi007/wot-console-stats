from flask import Response, abort 
import json
import time


from .. import app
from .. import wgapi
from .. import database as db
from .. import tankopedia
from ..percentile import percentile
from ..wn8 import wn8
from ..functions import find_difference


#Page sessiontracker.


class pageSessionTracker():
    def __init__(self, server, account_id, player_data):
        self.server = server
        self.account_id = account_id
        self.player_data = player_data
    @staticmethod
    def get_timestamps(search):
        #Return list of timestamps excluding today.
        now = time.gmtime()
        today = (now.tm_year, now.tm_yday)

        output = []
        for row in search:
            timestamp = row['created_at']
            time_struct = time.gmtime(timestamp)
            date = (time_struct.tm_year, time_struct.tm_yday)

            if today != date:
                output.append(timestamp)

        return output
    def get_radar_data(self, tank_data, tank_id):
        temp_dict = {
            'dmgc': tank_data['damage_dealt'] / tank_data['battles'],
            'exp':  tank_data['xp'] / tank_data['battles'],
            'rass': tank_data['damage_assisted_radio'] / tank_data['battles'],
            'dmgr': tank_data['damage_received'] / tank_data['battles'],
            'acc':  tank_data['hits'] / tank_data['shots'] * 100 if tank_data['shots'] > 0 else 0.0
        }

        temp_dict['radar'] = [
            percentile.calculate('accuracy', tank_data),
            percentile.calculate('damage_dealt', tank_data),
            percentile.calculate('damage_assisted_radio', tank_data),
            percentile.calculate('xp', tank_data),
            abs(percentile.calculate('damage_received', tank_data) - 100)
        ]

        return temp_dict
    @staticmethod
    def get_other_data(tank_data):
        return({
            'battles':  tank_data['battles'],
            'wins':     tank_data['wins'],
            'lifetime': tank_data['battle_life_time'] / tank_data['battles'],
            'dpm':      tank_data['damage_dealt'] / tank_data['battle_life_time'] * 60,
            'wn8':      wn8.calculate_for_tank(tank_data)
        })
    def calculateSessionTracker(self, timestamp, search):

        timestamps = self.get_timestamps(search)

        #If nothing to compare with (no checkpoints not from today).
        if len(timestamps) == 0:
            return({
                'session_tanks': [],
                'timestamps': [],
                'timestamp': 0
            })

        #Timestamp comes as str in url.
        timestamp = int(timestamp)

        #If wrong timestamp.
        if timestamp not in timestamps:
            timestamp = timestamps[0]

        #Get the snapshot_data.
        for row in search:
            row_timestamp = row['created_at']
            if timestamp == row_timestamp:
                snapshot_data = row['data']
                break

        #Slicing.
        slice_data = find_difference(snapshot_data, self.player_data)

        #Calculating output.
        output = []
        for slice_tank in slice_data:
            tank_id = slice_tank['tank_id']
            for player_tank in self.player_data:
                if tank_id == player_tank['tank_id']:
                    output.append({
                        'tank_id': tank_id,
                        'tank_name': tankopedia.get(str(tank_id), {}).get('short_name', 'Unknown'),
                        'all': {
                            **self.get_radar_data(player_tank, tank_id),
                            **self.get_other_data(player_tank)
                        },
                        'session': {
                            **self.get_radar_data(slice_tank, tank_id),
                            **self.get_other_data(slice_tank)
                        }
                    })
                    break

        return({
            'session_tanks':    output,
            'timestamps':       self.get_timestamps(search),
            'timestamp':        timestamp
        })


@app.route('/api/session_tracker/<server>/<int:account_id>/<int:timestamp>/<filters>/')
def api_sessiontracker(server, account_id, timestamp, filters):

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

    user = pageSessionTracker(server, account_id, data)
    fourteen_days_ago = int(time.time()) - 60 * 60 * 24 * 14
    search = db.get_all_checkpoints(server, account_id, min_created_at=fourteen_days_ago)
    output = user.calculateSessionTracker(timestamp, search)

    return Response(json.dumps({
        'status':     'ok',
        'message':    'ok',
        'count':      len(output),
        'server':     server,
        'account_id': account_id,
        'data':       output,
        'time':       time.time() - start
    }), mimetype='application/json')
