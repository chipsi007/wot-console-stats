from flask import Response, abort
import datetime
import json
import time


from .. import app
from ..wgapi import wgapi
from ..database import db
from .. import tankopedia
from ..percentile import percentile
from ..wn8 import wn8
from ..secret import app_id
from ..functions import decode_filters_string, filter_data, find_difference


#First pages on this website implemeted as classes.


class pageProfile():
    def __init__(self, server, account_id, player_data):
        self.server = server
        self.account_id = account_id
        self.player_data = player_data
    @staticmethod
    def calculate_general_account_stats(userdata):
        battles, hits, shots, dmgc, rass, dmgr, frags, survived, wins = (0 for i in range(9))

        for tank in userdata:
            battles  += tank['battles']
            hits     += tank['hits']
            shots    += tank['shots']
            dmgc     += tank['damage_dealt']
            rass     += tank['damage_assisted_radio']
            dmgr     += tank['damage_received']
            frags    += tank['frags']
            survived += tank['survived_battles']
            wins     += tank['wins']

        if battles > 0:
            acc =       hits / shots * 100           if shots > 0                else 0
            k_d =       frags / (battles - survived) if (battles - survived) > 0 else 100
            dmgc_dmgr = dmgc / dmgr                  if dmgr > 0                 else 100

            return({
                'acc':       round(acc, 2),
                'dmgc':      round(dmgc / battles, 2),
                'rass':      round(rass / battles, 2),
                'dmgr':      round(dmgr / battles, 2),
                'k_d':       round(k_d, 2),
                'dmgc_dmgr': round(dmgc_dmgr, 2),
                'wr':        round(wins / battles * 100, 2)
            })

        return {'acc': 0, 'dmgc': 0, 'rass': 0, 'dmgr': 0, 'k_d': 0, 'dmgc_dmgr': 0, 'wr': 0}
    def calculate_percentiles_for_all_tanks(self, userdata):
        dmgc_temp, wr_temp, rass_temp, dmgr_temp, acc_temp = ([] for i in range(5))
        output_dict = {}
        #Iterating through vehicles.
        dmgc, wr, rass, dmgr, acc = (0 for i in range(5))
        battle_counter = 0
        for vehicle in userdata:

            battles = vehicle['battles']
            battle_counter += battles

            if battles > 0:
                dmgc += percentile.calculate('damage_dealt', vehicle)           * battles
                wr +=   percentile.calculate('wins', vehicle)                   * battles
                rass += percentile.calculate('damage_assisted_radio', vehicle)  * battles
                dmgr += percentile.calculate('damage_received', vehicle)        * battles
                acc +=  percentile.calculate('accuracy', vehicle)               * battles

        #Preparing output.
        if battle_counter == 0:
            #In case nothing found.
            return {'dmgc': 0.0, 'wr': 0.0, 'rass': 0.0, 'dmgr': 0.0, 'acc': 0.0}
        else:
            #If at least one vehicle with "vehicle['battles'] > 0"
            return({
                'dmgc':  round(dmgc / battle_counter, 2),
                'wr':    round(wr / battle_counter, 2),
                'rass':  round(rass / battle_counter, 2),
                'dmgr':  abs(round(dmgr / battle_counter, 2) - 100),
                'acc':   round(acc / battle_counter, 2)
            })
    @staticmethod
    def calculate_overall_percentile(percentile_dict):
        total = sum([value for _, value in percentile_dict.items()])
        #There are 5 percentiles.
        return round(total / 5, 2)
    def calculate_page_profile(self, filters, recent_checkpoints):

        #Getting player data from first checkpont. Must exist!
        first_recent_checkpoint = []
        if any(recent_checkpoints):
            first_recent_data = recent_checkpoints[0]['data']

        #Placeholders.
        all_time, recent, difference = ({} for i in range(3))
        xlabels, percentiles_totals, wn8_totals = ([] for i in range(3))

        #Calculating all-time player performance.
        self.player_data =          filter_data(self.player_data, filters, tankopedia)
        all_time =                  self.calculate_general_account_stats(self.player_data)
        all_time['wn8'] =           int(wn8.calculate_for_all_tanks(self.player_data))
        all_time['percentiles'] =   self.calculate_percentiles_for_all_tanks(self.player_data)
        all_time['total_perc'] =    self.calculate_overall_percentile(all_time['percentiles'])


        #Calculating recent player performance.
        self.player_data = find_difference(first_recent_data, self.player_data)
        self.player_data = filter_data(self.player_data, filters, tankopedia)
        recent =                self.calculate_general_account_stats(self.player_data)
        recent['wn8'] =         int(wn8.calculate_for_all_tanks(self.player_data))
        recent['percentiles'] = self.calculate_percentiles_for_all_tanks(self.player_data)
        recent['total_perc'] =  self.calculate_overall_percentile(recent['percentiles'])


        #Calculating charts.
        for r, row in enumerate(recent_checkpoints):
            #Getting 'xlabels'.
            checkpoint_timestamp = row['created_at']
            timedelta = datetime.datetime.utcnow().date() - datetime.datetime.utcfromtimestamp(checkpoint_timestamp).date()
            if timedelta.days > 0:
                xlabels.append(str(timedelta.days) + 'd ago')
            else:
                xlabels.append('Today')
            #Loading and filtering player data.
            self.player_data = row['data']
            #Filtering data using function of the same class.
            self.player_data = filter_data(self.player_data, filters, tankopedia)
            #Calculating Percentile totals.
            percentiles_totals.append(self.calculate_percentiles_for_all_tanks(self.player_data))
            #Calculating WN8 totals.
            wn8_totals.append(round(wn8.calculate_for_all_tanks(self.player_data), 2))


        #Calculating overall percentile.
        new_list = []
        for item in percentiles_totals:
            new_list.append(sum([value for key, value in item.items()]) / 5)
        percentiles_totals = new_list

        return({
            'all_time':             all_time,
            'recent':               recent,
            'xlabels':              xlabels,
            'percentiles_totals':   percentiles_totals,
            'wn8_totals':           wn8_totals
        })


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


@app.route('/api/<page>/<server>/<int:account_id>/<int:timestamp>/<filters>/')
def api_main(page, server, account_id, timestamp, filters):
    start = time.time()

    #Validation.
    try:
        assert server in ('xbox', 'ps4')
        assert page in ('profile', 'vehicles', 'session_tracker')
    except:
        abort(404)

    #Request player data or find cached.
    status, message, data = wgapi.find_cached_or_request(server, account_id, app_id)
    if status != 'ok':
        return Response(json.dumps({
            'status': status,
            'message': message
        }), mimetype='application/json')

    #Convert filters into an array.
    filters = decode_filters_string(filters)

    #Processing according to request type.
    if page == 'profile':
        user = pageProfile(server, account_id, data)
        recent_checkpoints = db.get_all_recent_checkpoints(server, account_id)
        output = user.calculate_page_profile(filters, recent_checkpoints)
    elif page == 'vehicles':
        user = pageVehicles(server, account_id, data)
        user.extract_vehicle_data()
        output = user.player_data
    elif page == 'session_tracker':
        user = pageSessionTracker(server, account_id, data)
        search = db.get_all_recent_checkpoints(server, account_id)
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
