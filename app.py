from flask import Flask, render_template, request, redirect, url_for, make_response, Response
import psycopg2
import requests
import json
import datetime
import time

#Getting Heroku keys.
import os
if 'DATABASE_URL' in os.environ:
    database_url = os.environ['DATABASE_URL']
else:
    import heroku_database_url_file
    database_url = heroku_database_url_file.database_url


with open('references/tankopedia.json', 'r') as f:
    tankopedia = json.load(f)
with open('references/percentiles.json', 'r') as f:
    percentiles = json.load(f)
with open('references/percentiles_generic.json', 'r') as f:
    percentiles_generic = json.load(f)
with open('references/wn8console.json', 'r') as f:
    wn8console = json.load(f)['data']
with open('references/wn8pc.json', 'r') as f:
    wn8pc = json.load(f)['data']


app = Flask(__name__)


#Data persistence interface.
class database(object):
    def __init__(self, database_url):
        self.database_url = database_url
        self.conn = None
    #Open connection if closed or doesn't exist.
    def open_conn(self):
        if self.conn is None or self.conn.closed > 0:
            try:
                self.conn = psycopg2.connect(self.database_url)
                status = 'Connected to db'
            except error:
                status = error
            finally:
                print(status)

    ####Checkpoint functions.
    #Returns: (table_id, timestamp, account_id, server, [data]) (int, int, int, string, []dict)
    def request_latest_checkpoint(self, server, account_id):
        self.open_conn()

        with self.conn.cursor() as cur:
            query = "SELECT * FROM checkpoints WHERE server = '{}' AND account_id = '{}' ORDER BY created_at DESC LIMIT 1;"
            cur.execute(query.format(server, account_id))
            search = cur.fetchone()

        if search is not None:
            found_timestamp = search[1]
            timestamp = time.time()

            if timestamp - found_timestamp <= 300:
                return(search)

        return(None)
    #Returns list of tuples, same as above.
    def request_checkpoints(self, server, account_id):
        self.open_conn()

        with self.conn.cursor() as cur:
            query = "SELECT * FROM checkpoints WHERE server = '{}' AND account_id = '{}' ORDER BY created_at ASC;"
            cur.execute(query.format(server, account_id))
            search = cur.fetchall()

        return(search)
    def add_or_update_checkpoint(self, server, account_id, player_data):
        self.open_conn()
        #Getting the entry with biggest timestamp.
        with self.conn.cursor() as cur:
            query = "SELECT MAX(created_at) FROM checkpoints WHERE server = '{}' AND account_id = '{}'"
            cur.execute(query.format(server, account_id))
            found_timestamp = cur.fetchone()[0]
            timestamp = int(time.time())

            if found_timestamp is not None:
                found_date = time.strftime('%Y%m%d', time.gmtime(found_timestamp))
                current_date = time.strftime('%Y%m%d', time.gmtime(time.time()))

                #If latest timestamp is from today, deleting it.
                if found_date == current_date:
                    query = "DELETE FROM checkpoints WHERE created_at = '{}' AND server = '{}' AND account_id = '{}';"
                    cur.execute(query.format(found_timestamp, server, account_id))

            #If None or the record was not created today, creating new record.
            query = "INSERT INTO checkpoints (created_at, account_id, server, player_data) VALUES ('{}', '{}', '{}', '{}')"
            cur.execute(query.format(timestamp, account_id, server, json.dumps(player_data)))

        self.conn.commit()
    def delete_expired_checkpoints(self):
        self.open_conn()

        period = 12 * 24 * 60 * 60
        timestamp = int(time.time())

        with self.conn.cursor() as cur:
            cur.execute("DELETE FROM checkpoints WHERE created_at <= (%s);", [timestamp - period])

        self.conn.commit()
sql = database(database_url)


#App ID
app_id = 'demo'


#Main page.
@app.route('/')
def index():
    sql.delete_expired_checkpoints()
    return render_template("index.html")

#React.js test page.
@app.route('/test')
def test_index():
    sql.delete_expired_checkpoints()
    return render_template("test_index.html")


#Root app class.
class user_cls:
    def __init__(self, server, account_id):
        self.app_id = 'demo'
        self.server = server
        self.account_id = account_id

    #Request player data by account_id.
    def request_vehicles(self):
        url = 'https://api-{}-console.worldoftanks.com/wotx/tanks/stats/?application_id={}&account_id={}'\
            .format(self.server, self.app_id, self.account_id)
        request = requests.get(url)
        vehicles = request.json()
        #If no vehicles on the account
        if vehicles['status'] == 'error':
            self.status = 'error'
            self.message = 'ERROR: ' + str(vehicles['error']['message'])
        elif vehicles['data'][str(self.account_id)] == None:
            self.status = 'error'
            self.message = 'ERROR: No vehicles found on the account'
        else:
            self.status = 'ok'
            #Extracting into dictionaries.
            self.player_data = []
            for vehicle in vehicles['data'][str(self.account_id)]:
                #Dictionary from main values.
                temp_dict = vehicle['all']
                #Adding other values.
                temp_dict['account_id'] = vehicle['account_id']
                temp_dict['battle_life_time'] = vehicle['battle_life_time']
                temp_dict['last_battle_time'] = vehicle['last_battle_time']
                temp_dict['mark_of_mastery'] = vehicle['mark_of_mastery']
                temp_dict['max_frags'] = vehicle['max_frags']
                temp_dict['max_xp'] = vehicle['max_xp']
                temp_dict['tank_id'] = vehicle['tank_id']
                temp_dict['trees_cut'] = vehicle['trees_cut']
                self.player_data.append(temp_dict)

    #Function to eiter find SQL cached player data or to request and save in SQL.
    def request_or_find_cached(self):
        #Trying to get results from SQL first.
        current_user = sql.request_latest_checkpoint(self.server, self.account_id)

        #If no cached results, requesting from WG API.
        if current_user == None:
            self.request_vehicles()
            if self.status == 'ok':
                sql.add_or_update_checkpoint(self.server, self.account_id, self.player_data)
            return

        #If found cached.
        self.status = 'ok'
        self.player_data = current_user[4]
        self.account_id = current_user[2]

    #Decode string sent by a client into a filter input.
    def decode_filters_string(self, filters_string):
        #'ab&cd&ef&' -> ['ab', 'cd', 'ef']
        output = []
        new_list = filters_string.split('&')
        output = [item for item in new_list if len(item) > 0]
        return(output)

    #Filter player data by filter input.
    def filter_data(self, filter_input, tankopedia):
        filtered_player_data = []
        for tank in self.player_data:
            #Calling tankopedia tank dictionary.
            if str(tank['tank_id']) in tankopedia:
                tp_dict = tankopedia[str(tank['tank_id'])]
                #Filtering.
                if tp_dict['type'] in filter_input and str(tp_dict['tier']) in filter_input:
                    filtered_player_data.append(tank)
        self.player_data = filtered_player_data

    #Find one closest number from sorted array and return its index.
    def find_index_of_closest_value(self, array, number):
        pair_found = False
        beg = 0
        end = len(array) - 1

        #Looking for closest pair.
        while abs(beg - end) != 1 and pair_found == False:
            mid = (beg + end) // 2
            if array[mid] == number:
                pair_found = True
                beg, end = mid, mid
            elif number < array[mid]:
                end = mid
            elif number > array[mid]:
                beg = mid
            else:
                raise

        #Getting the closest index.
        if abs(number - array[beg]) > abs(number - array[end]):
            return(end)
        else:
            return(beg)
    #Calculate percentile for single tank based on parameters.
    def percentile_calculator(self, kind, tank_id, number):

        if number == 0:
            return(0)

        # Checking if the tank in percentiles dictionary.
        array = percentiles[kind].get(str(tank_id))

        #If tank is in the pre-calculated table. (DEFAULT)
        if array:
            index = self.find_index_of_closest_value(array, number)
            return(index)

        #If tank in tankopedia, getting generic percentile (tier-class).
        temp_tank = tankopedia.get(str(tank_id))
        if temp_tank:
            tier_class = str(temp_tank['tier']) + temp_tank['type']
            array = percentiles_generic[kind].get(tier_class)

        #If generic percentile exist. (MUST EXIST!)
        if array:
            index = self.find_index_of_closest_value(array, number)
            return(index)

        return(0)

    def wn8_calculator(self, tank_data, WN8_dict):
        #Loading expected values
        exp_values = {}
        for item in WN8_dict:
            if len(item) > 0 and tank_data['tank_id'] == item['IDNum']:
                exp_values = item

        #If there are no expected values in the table, return 0
        if len(exp_values) == 0:
            return(0)
        #step 0 - assigning the variables
        expDmg      = exp_values['expDamage']
        expSpot     = exp_values['expSpot']
        expFrag     = exp_values['expFrag']
        expDef      = exp_values['expDef']
        expWinRate  = exp_values['expWinRate']

        #step 1
        rDAMAGE = tank_data['damage_dealt']             /   tank_data['battles']     / expDmg
        rSPOT   = tank_data['spotted']                  /   tank_data['battles']     / expSpot
        rFRAG   = tank_data['frags']                    /   tank_data['battles']     / expFrag
        rDEF    = tank_data['dropped_capture_points']   /   tank_data['battles']     / expDef
        rWIN    = tank_data['wins']                     /   tank_data['battles']*100 / expWinRate

        #step 2
        rWINc    = max(0,                     (rWIN    - 0.71) / (1 - 0.71) )
        rDAMAGEc = max(0,                     (rDAMAGE - 0.22) / (1 - 0.22) )
        rFRAGc   = max(0, min(rDAMAGEc + 0.2, (rFRAG   - 0.12) / (1 - 0.12)))
        rSPOTc   = max(0, min(rDAMAGEc + 0.1, (rSPOT   - 0.38) / (1 - 0.38)))
        rDEFc    = max(0, min(rDAMAGEc + 0.1, (rDEF    - 0.10) / (1 - 0.10)))

        #step 3
        WN8 = 980*rDAMAGEc + 210*rDAMAGEc*rFRAGc + 155*rFRAGc*rSPOTc + 75*rDEFc*rFRAGc + 145*min(1.8,rWINc)

        return(WN8)

    #Function substracts old_data from new_data.
    def find_difference(self, old_data, new_data):
        #Making a copy to prevent changing the input.
        old_data = old_data[:]
        #Deleting tanks from 'old_data' that were not played.
        for new_tank in new_data:
            for s, old_tank in enumerate(old_data):
                if new_tank['tank_id'] == old_tank['tank_id'] and new_tank['battles'] == old_tank['battles']:
                    old_data.pop(s)
                    break

        #Return if empty.
        if any(old_data) == False:
            return([])

        #Deleting tanks from 'new_data' that aren't in filtered 'old_data'.
        old_tank_ids = [tank['tank_id'] for tank in old_data]
        temp_list = []
        for new_tank in new_data:
            if new_tank['tank_id'] in old_tank_ids:
                temp_list.append(new_tank)
        new_data = temp_list

        #Substracting difference.
        slice_data = []
        for old_tank in old_data:
            for new_tank in new_data:
                if old_tank['tank_id'] == new_tank['tank_id']:
                    #Iterating through tank dictionary.
                    temp_dict = {}
                    for key, value in new_tank.items():
                        temp_dict[key] = new_tank[key] - old_tank[key]
                    #Preserving 'tank_id'
                    temp_dict['tank_id'] = new_tank['tank_id']
                    #Appending to output list.
                    slice_data.append(temp_dict)
                    break

        return(slice_data)

class player_profile_cls(user_cls):
    def __init__(self, server, account_id):
        user_cls.__init__(self, server, account_id)

    def calculate_general_account_stats(self, userdata):
        battles, hits, shots, dmgc, rass, dmgr, frags, survived, wins = (0 for i in range(9))
        for tank in userdata:

            battles     += tank['battles']
            hits        += tank['hits']
            shots       += tank['shots']
            dmgc        += tank['damage_dealt']
            rass        += tank['damage_assisted_radio']
            dmgr        += tank['damage_received']
            frags       += tank['frags']
            survived    += tank['survived_battles']
            wins        += tank['wins']

        if battles > 0:
            acc =       hits / shots * 100            if shots > 0                else 0
            k_d =       frags / (battles - survived)  if (battles - survived) > 0 else 100
            dmgc_dmgr = dmgc / dmgr                   if dmgr > 0                 else 100

            output_dict = {'acc':       round(acc, 2),
                           'dmgc':      round(dmgc / battles, 2),
                           'rass':      round(rass / battles, 2),
                           'dmgr':      round(dmgr / battles, 2),
                           'k_d':       round(k_d, 2),
                           'dmgc_dmgr': round(dmgc_dmgr, 2),
                           'wr':        round(wins / battles * 100, 2)}
        else:
            output_dict = {'acc': 0, 'dmgc': 0, 'rass': 0, 'dmgr': 0, 'k_d': 0, 'dmgc_dmgr': 0, 'wr': 0}

        return(output_dict)

    def calculate_percentiles_for_all_tanks(self, userdata):
        dmgc_temp, wr_temp, rass_temp, dmgr_temp, acc_temp = ([] for i in range(5))
        output_dict = {}
        #Iterating through vehicles.
        dmgc, wr, rass, dmgr, acc = (0 for i in range(5))
        battle_counter = 0
        for vehicle in userdata:
            if vehicle['battles'] > 0:
                battle_counter += vehicle['battles']

                dmgc += self.percentile_calculator('dmgc', vehicle['tank_id'], vehicle['damage_dealt']/vehicle['battles']) * vehicle['battles']
                wr +=   self.percentile_calculator('wr', vehicle['tank_id'], vehicle['wins']/vehicle['battles']*100) * vehicle['battles']
                rass += self.percentile_calculator('rass', vehicle['tank_id'], vehicle['damage_assisted_radio']/vehicle['battles']) * vehicle['battles']
                dmgr += self.percentile_calculator('dmgr', vehicle['tank_id'], vehicle['damage_received']/vehicle['battles']) * vehicle['battles']

                #If no hits, percentile would be 0 anyways.
                if vehicle['hits'] > 0:
                    acc += self.percentile_calculator('acc', vehicle['tank_id'], vehicle['hits']/vehicle['shots']*100) * vehicle['battles']

        #Preparing output.
        if battle_counter == 0:
            #In case nothing found.
            output_dict = {'dmgc': 0.0, 'wr': 0.0, 'rass': 0.0, 'dmgr': 0.0, 'acc': 0.0}
        else:
            #If at least one vehicle with "vehicle['battles'] > 0"
            output_dict = {'dmgc':  round(dmgc / battle_counter, 2),
                           'wr':    round(wr / battle_counter, 2),
                           'rass':  round(rass / battle_counter, 2),
                           'dmgr':  abs(round(dmgr / battle_counter, 2) - 100),
                           'acc':   round(acc / battle_counter, 2)}
        return(output_dict)

    def calculate_overall_percentile(self, percentile_dict):
        total = sum([value for _, value in percentile_dict.items()])
        #There are 5 percentiles.
        output = total / 5
        return(round(output, 2))

    def calculate_wn8_for_all_tanks(self, userdata):
        battle_counter, wn8_counter = 0, 0
        for tank in userdata:
            wn8_temp = self.wn8_calculator(tank, wn8console) * tank['battles']
            #Adding up only if WN8 value is more than 0.
            if wn8_temp > 0:
                battle_counter += tank['battles']
                wn8_counter += wn8_temp

        if battle_counter > 0:
            return(int(wn8_counter / battle_counter))
        else:
            return(0.0)

class vehicles_cls(user_cls):
    def __init__(self, server, account_id):
        user_cls.__init__(self, server, account_id)

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
            if str(temp_dict['tank_id']) in tankopedia:
                temp_dict['short_name'] = tankopedia[str(temp_dict['tank_id'])]['short_name']
                temp_dict['name'] = tankopedia[str(temp_dict['tank_id'])]['name']
                temp_dict['tier'] = tankopedia[str(temp_dict['tank_id'])]['tier']
                temp_dict['type'] = tankopedia[str(temp_dict['tank_id'])]['type']
            else:
                temp_dict['short_name'] = 'Unknown'
                temp_dict['name'] = 'Unknown'
                temp_dict['tier'] = 0
                temp_dict['type'] = 'Unknown'

            #WN8
            temp_dict['wn8'] = self.wn8_calculator(vehicle, wn8console)
            temp_dict['wn8pc'] = self.wn8_calculator(vehicle, wn8pc)

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
            temp_dict['dmg_perc'] = self.percentile_calculator('dmgc', vehicle['tank_id'], temp_dict['avg_dmg'])

            temp_dict['wr'] = vehicle['wins'] / vehicle['battles'] * 100
            temp_dict['wr_perc'] = self.percentile_calculator('wr', vehicle['tank_id'], temp_dict['wr'])

            temp_dict['avg_exp'] = vehicle['xp'] / vehicle['battles']
            temp_dict['exp_perc'] = self.percentile_calculator('exp', vehicle['tank_id'], temp_dict['avg_exp'])


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

class time_series_cls(user_cls):
    def __init__(self, server, account_id):
        user_cls.__init__(self, server, account_id)

    def calculate_percentiles_for_all_tanks(self, userdata):
        dmgc_temp, wr_temp, rass_temp, dmgr_temp, acc_temp = ([] for i in range(5))
        output_dict = {}
        #Iterating through vehicles.
        dmgc, wr, rass, dmgr, acc = (0 for i in range(5))
        battle_counter = 0
        for vehicle in userdata:
            if vehicle['battles'] > 0:
                battle_counter = battle_counter + vehicle['battles']

                dmgc = dmgc + self.percentile_calculator('dmgc', vehicle['tank_id'], vehicle['damage_dealt']/vehicle['battles']) * vehicle['battles']
                wr = wr + self.percentile_calculator('wr', vehicle['tank_id'], vehicle['wins']/vehicle['battles']*100) * vehicle['battles']
                rass = rass + self.percentile_calculator('rass', vehicle['tank_id'], vehicle['damage_assisted_radio']/vehicle['battles']) * vehicle['battles']
                dmgr = dmgr + self.percentile_calculator('dmgr', vehicle['tank_id'], vehicle['damage_received']/vehicle['battles']) * vehicle['battles']

                #If no hits, percentile would be 0 anyways.
                if vehicle['hits'] > 0:
                    acc = acc + self.percentile_calculator('acc', vehicle['tank_id'], vehicle['hits']/vehicle['shots']*100) * vehicle['battles']

        #Preparing output.
        if battle_counter == 0:
            #In case nothing found.
            output_dict = {'dmgc': 0.0, 'wr': 0.0, 'rass': 0.0, 'dmgr': 0.0, 'acc': 0.0}
        else:
            #If at least one vehicle with "vehicle['battles'] > 0"
            output_dict = {'dmgc': round(dmgc / battle_counter, 2),
                           'wr': round(wr / battle_counter, 2),
                           'rass': round(rass / battle_counter, 2),
                           'dmgr': abs(round(dmgr / battle_counter, 2)-100),
                           'acc': round(acc / battle_counter, 2)}
        return(output_dict)

    def calculate_wn8_for_all_tanks(self, userdata):
        battle_counter, wn8_counter = 0, 0
        for tank in userdata:
            wn8_temp = self.wn8_calculator(tank, wn8console) * tank['battles']
            #Adding up only if WN8 value is more than 0.
            if wn8_temp > 0:
                battle_counter = battle_counter + tank['battles']
                wn8_counter = wn8_counter + wn8_temp

        if battle_counter > 0:
            output_wn8 = int(wn8_counter/battle_counter)
        else:
            output_wn8 = 0.0

        return(output_wn8)

    def calculate_charts(self, user_history_query, filter_input, tankopedia):

        self.xlabels = []

        self.percentiles_totals, self.percentiles_change = [], []

        self.wn8_totals, self.wn8_change = [], []

        for r, row in enumerate(user_history_query):

            #Getting 'xlabels'.
            user_timestamp = row[1]
            timedelta = datetime.datetime.utcnow().date() - datetime.datetime.utcfromtimestamp(user_timestamp).date()
            if timedelta.days > 0:
                self.xlabels.append(str(timedelta.days) + 'd ago')
            else:
                self.xlabels.append('Today')

            #Loading and filtering player data.
            self.player_data = row[4]
            #Filtering data using function of the same class.
            self.filter_data(filter_input, tankopedia)
            #Calculating Percentile totals.
            self.percentiles_totals.append(self.calculate_percentiles_for_all_tanks(self.player_data))
            #Calculating WN8 totals.
            self.wn8_totals.append(self.calculate_wn8_for_all_tanks(self.player_data))

            #Calculating day-to-day change. Skipping the first item.
            if r != 0:
                #Substracting snapshot_data from player_data.
                self.slice_data = self.find_difference(self.snapshot_data, self.player_data)
                #Calculating day-to-day percentiles.
                self.percentiles_change.append(self.calculate_percentiles_for_all_tanks(self.slice_data))
                #Calculating day-to-day WN8.
                self.wn8_change.append(self.calculate_wn8_for_all_tanks(self.slice_data))

            #Assigning snapshot.
            self.snapshot_data = self.player_data
        return

class session_tracker_cls(user_cls):
    def __init__(self, server, account_id):
        user_cls.__init__(self, server, account_id)

    def get_snapshots(self, search):
        snapshots = []
        if len(search) > 0:
            for row in search:
                timestamp = row[1]
                timedelta = datetime.datetime.utcnow().date() - datetime.datetime.utcfromtimestamp(timestamp).date()
                #Passing data points that are older than today.
                if timedelta.days > 0:
                    snapshots.append(timestamp)
        return(snapshots)

    def get_radar_data(self, tank_data, tank_id):
        temp_dict = {'dmgc': tank_data['damage_dealt'] / tank_data['battles'],
                     'exp':  tank_data['xp'] / tank_data['battles'],
                     'rass': tank_data['damage_assisted_radio'] / tank_data['battles'],
                     'dmgr': tank_data['damage_received'] / tank_data['battles'],
                     'acc':  tank_data['hits'] / tank_data['shots'] * 100 if tank_data['shots'] > 0 else 0.0}

        dmgc_perc = self.percentile_calculator('dmgc', tank_id, temp_dict['dmgc'])
        exp_perc =  self.percentile_calculator('exp', tank_id, temp_dict['exp'])
        rass_perc = self.percentile_calculator('rass', tank_id, temp_dict['rass'])
        dmgr_perc = self.percentile_calculator('dmgr', tank_id, temp_dict['dmgr'])
        acc_perc =  self.percentile_calculator('acc', tank_id, temp_dict['acc'])

        temp_dict['radar'] = [round(acc_perc, 2), round(dmgc_perc, 2), round(rass_perc, 2), round(exp_perc, 2),
                  abs(round(dmgr_perc, 2) - 100)]

        return(temp_dict)

    def get_other_data(self, tank_data):
        temp_dict = {'battles':  tank_data['battles'],
                     'wins':     tank_data['wins'],
                     'lifetime': tank_data['battle_life_time'] / tank_data['battles'],
                     'dpm':      tank_data['damage_dealt'] / tank_data['battle_life_time'] * 60,
                     'wn8':      self.wn8_calculator(tank_data, wn8console)}
        return(temp_dict)

class wn8_estimates_cls(user_cls):
    def __init__(self, server, account_id):
        user_cls.__init__(self, server, account_id)

    def calculate_wn8_damage_targets(self, tank_data, WN8_dict):
        #Loading expected values
        exp_values = {}
        for item in WN8_dict:
            if item.get('IDNum') == tank_data['tank_id']:
                exp_values = item
                break

        #If there are no expected values in the table, return 0
        if len(exp_values) == 0:
            return(0)

        #step 0 - WN8 calculation algo - assigning the variables.
        expDmg      = exp_values['expDamage']
        expSpot     = exp_values['expSpot']
        expFrag     = exp_values['expFrag']
        expDef      = exp_values['expDef']
        expWinRate  = exp_values['expWinRate']
        #step 1
        rSPOT   = tank_data['spotted']                  /   tank_data['battles']     / expSpot
        rFRAG   = tank_data['frags']                    /   tank_data['battles']     / expFrag
        rDEF    = tank_data['dropped_capture_points']   /   tank_data['battles']     / expDef
        rWIN    = tank_data['wins']                     /   tank_data['battles']*100 / expWinRate

        #Iterating through damage targets.
        output = []
        targets = [300, 450, 650, 900, 1200, 1600, 2000, 2450, 2900]
        count = 0
        #Iterating through possible average damage (ONCE)
        for avg_dmg in range(20, 4500, 5):
            rDAMAGE = avg_dmg / expDmg
            rWINc    = max(0, (rWIN - 0.71) / (1 - 0.71))
            rDAMAGEc = max(0, (rDAMAGE - 0.22) / (1 - 0.22))
            rFRAGc   = max(0, min(rDAMAGEc + 0.2, (rFRAG - 0.12) / (1 - 0.12)))
            rSPOTc   = max(0, min(rDAMAGEc + 0.1, (rSPOT - 0.38) / (1 - 0.38)))
            rDEFc    = max(0, min(rDAMAGEc + 0.1, (rDEF - 0.10) / (1 - 0.10)))
            temp_score = 980*rDAMAGEc + 210*rDAMAGEc*rFRAGc + 155*rFRAGc*rSPOTc + 75*rDEFc*rFRAGc + 145*min(1.8,rWINc)

            if temp_score >= targets[count]:
                output.append(avg_dmg)
                count += 1
                if count >= len(targets):
                    break

        return(output)

    def extract_data_for_wn8(self, wn8_list, tankopedia_dict):
        output = []
        #Iterating through tanks in player data.
        for vehicle in self.player_data:
            #Skip if no battles on tank.
            if vehicle['battles'] == 0:
                continue

            tank_id = vehicle['tank_id']
            tank_dict = {}

            #Get WN8 expected values.
            for wn8_item in wn8_list:
                if wn8_item.get('IDNum') == tank_id:
                    tank_dict.update(wn8_item)
                    break

            #Skip if tank not in WN8 expected values.
            if len(tank_dict) == 0:
                continue

            #Skip if tank not in tankopedia.
            tankopedia_item = tankopedia_dict.get(str(tank_id))
            if not tankopedia_item:
                continue
            tank_dict.update(tankopedia_item)

            #Adding additional values.
            tank_dict['Damage']     = vehicle['damage_dealt'] / vehicle['battles']
            tank_dict['Def']        = vehicle['dropped_capture_points'] / vehicle['battles']
            tank_dict['Frag']       = vehicle['frags'] / vehicle['battles']
            tank_dict['Spot']       = vehicle['spotted'] / vehicle['battles']
            tank_dict['WinRate']    = vehicle['wins'] / vehicle['battles'] * 100

            #Calculating damage targets.
            tank_dict['dmgTargets'] = self.calculate_wn8_damage_targets(vehicle, wn8_list)

            output.append(tank_dict)

        self.player_data = output


#Main API.
@app.route('/api/<request_type>/<server>/<account_id>/<timestamp>/<filters>/')
def api_main(request_type, server, account_id, timestamp, filters):

    start_time = time.time()

    #Defaults.
    output = {'status':     'error',
              'message':    'Bad request',
              'count':      0,
              'server':     None,
              'account_id': None,
              'data':       None,
              'time':       0}


    #Validation.
    try:
        int(account_id), int(timestamp)
        if server not in ['xbox', 'ps4']:
            raise
    except:
        output['message'] = 'Wrong server/account_id/timestamp'
        return Response(json.dumps(output), mimetype='application/json')


    #Processing according to request type.
    if request_type == 'profile':
        user = player_profile_cls(server, account_id)
        user.request_or_find_cached()
        #Return error If status != 'ok'.
        if user.status != 'ok':
            output['status'] = 'error'
            output['message'] = user.message
            return Response(json.dumps(output), mimetype='application/json')


        #Placeholders.
        all_time, recent, difference = ({} for i in range(3))
        xlabels, percentiles_totals, wn8_totals = ([] for i in range(3))

        #Converting filters into a list.
        filters = user.decode_filters_string(filters)

        #Calculations.
        user.filter_data(filters, tankopedia)

        all_time = user.calculate_general_account_stats(user.player_data)
        all_time['wn8'] = user.calculate_wn8_for_all_tanks(user.player_data)
        all_time['percentiles'] = user.calculate_percentiles_for_all_tanks(user.player_data)
        all_time['total_perc'] = user.calculate_overall_percentile(all_time['percentiles'])

        #Searching all records of the player in SQL 'checkpoints' and taking the first available.
        user_history_search = sql.request_checkpoints(user.server, user.account_id)
        if len(user_history_search) > 0:
            found_player_data = user_history_search[0][4]
            user.player_data = user.find_difference(found_player_data, user.player_data)

        user.filter_data(filters, tankopedia)

        recent = user.calculate_general_account_stats(user.player_data)
        recent['wn8'] = user.calculate_wn8_for_all_tanks(user.player_data)
        recent['percentiles'] = user.calculate_percentiles_for_all_tanks(user.player_data)
        recent['total_perc'] = user.calculate_overall_percentile(recent['percentiles'])

        #Calculating charts.
        for r, row in enumerate(user_history_search):
            #Getting 'xlabels'.
            checkpoint_timestamp = row[1]
            timedelta = datetime.datetime.utcnow().date() - datetime.datetime.utcfromtimestamp(checkpoint_timestamp).date()
            if timedelta.days > 0:
                xlabels.append(str(timedelta.days) + 'd ago')
            else:
                xlabels.append('Today')
            #Loading and filtering player data.
            user.player_data = row[4]
            #Filtering data using function of the same class.
            user.filter_data(filters, tankopedia)
            #Calculating Percentile totals.
            percentiles_totals.append(user.calculate_percentiles_for_all_tanks(user.player_data))
            #Calculating WN8 totals.
            wn8_totals.append(user.calculate_wn8_for_all_tanks(user.player_data))

        #Calculating overall percentile.
        new_list = []
        for item in percentiles_totals:
            new_list.append(sum([value for key, value in item.items()])/5)
        percentiles_totals = new_list

        #Generating output.
        output['data'] = {'all_time': all_time,
                          'recent': recent,
                          'xlabels': xlabels,
                          'percentiles_totals': percentiles_totals,
                          'wn8_totals': wn8_totals}
        output['count'] = len(output['data'])
        output['status'], output['message'] = 'ok', 'ok'
        output['server'] = user.server
        output['account_id'] = user.account_id

    elif request_type == 'vehicles':
        user = vehicles_cls(server, account_id)
        user.request_or_find_cached()
        #Return error If status != 'ok'.
        if user.status != 'ok':
            output['status'] = 'error'
            output['message'] = user.message
            return Response(json.dumps(output), mimetype='application/json')

        #Calculations.
        user.extract_vehicle_data()
        #Generating output.
        output['data'] = user.player_data
        output['count'] = len(user.player_data)
        output['status'], output['message'] = 'ok', 'ok'
        output['server'] =  user.server
        output['account_id'] = user.account_id

    elif request_type == 'time_series':
        user = time_series_cls(server, account_id)
        user.request_or_find_cached()
        #Return error If status != 'ok'.
        if user.status != 'ok':
            output['status'] = 'error'
            output['message'] = user.message
            return Response(json.dumps(output), mimetype='application/json')

        #Converting filters into a list.
        filters = user.decode_filters_string(filters)
        #Searching all records of the player in SQL 'history'.
        user_history_search = sql.request_checkpoints(user.server, user.account_id)
        #Calculating WN8 charts.
        user.calculate_charts(user_history_search, filters, tankopedia)
        #Generating output.
        output['data'] = {'xlabels':            user.xlabels,
                          'percentiles_change': user.percentiles_change,
                          'wn8_totals':         user.wn8_totals[1:],
                          'wn8_change':         user.wn8_change,
                          'wn8_labels':         user.xlabels[1:]}
        output['count'] = len(output['data'])
        output['status'], output['message'] = 'ok', 'ok'
        output['server'] = user.server
        output['account_id'] = user.account_id

    elif request_type == 'session_tracker':
        user = session_tracker_cls(server, account_id)
        user.request_or_find_cached()
        #Return error If status != 'ok'.
        if user.status != 'ok':
            output['status'] = 'error'
            output['message'] = user.message
            return Response(json.dumps(output), mimetype='application/json')

        #Calling all 'userdata_history' snapshots from SQL.
        search = sql.request_checkpoints(user.server, user.account_id)
        snapshots = user.get_snapshots(search)

        #If the checkpoint is not in the database return the list of checkpoints.
        if int(timestamp) not in snapshots:
            output['data'] = {
                'timestamp': None,
                'snapshots': snapshots,
            }
            output['count'] = len(output['data'])
            output['status'] = 'ok'
            output['message'] = 'Timestamp is not present'
            output['account_id'] = user.account_id
            output['server'] = user.server
            return Response(json.dumps(output), mimetype='application/json')

        #If the checkpoint is in the database
        for row in search:
            row_timestamp = row[1]
            if int(timestamp) == row_timestamp:
                user.snapshot_data = row[4]
                break


        #Calculations.
        user.slice_data = user.find_difference(user.snapshot_data, user.player_data)

        #List for output.
        session_tanks = []
        #Calculating data.
        for session_tank in user.slice_data:
            tank_id = session_tank['tank_id']

            for alltime_tank in user.player_data:
                if tank_id == alltime_tank['tank_id']:

                    current_tank = {'all': {**user.get_radar_data(alltime_tank, tank_id),
                                            **user.get_other_data(alltime_tank)},
                                    'session': {**user.get_radar_data(session_tank, tank_id),
                                                **user.get_other_data(session_tank)},
                                    'tank_id': tank_id,
                                    'tank_name': tankopedia[str(tank_id)]['name'] if str(tank_id) in tankopedia else 'Unknown'}

                    session_tanks.append(current_tank)
                    break

        #Preparing output.
        output['status'], output['message'] = 'ok', 'ok'
        output['account_id'], output['server'] = user.account_id, user.server
        output['data'] = {'session_tanks': session_tanks,
                          'timestamp':     timestamp,
                          'snapshots':     snapshots}
        output['count'] = len(output['data'])

    elif request_type == 'wn8_estimates':
        user = wn8_estimates_cls(server, account_id)
        user.request_or_find_cached()
        #Return error If status != 'ok'.
        if user.status != 'ok':
            output['status'] = 'error'
            output['message'] = user.message
            return Response(json.dumps(output), mimetype='application/json')
        #Extracting data.
        user.extract_data_for_wn8(wn8console, tankopedia)
        #Generating output.
        output['data'] = user.player_data
        output['count'] = len(user.player_data)
        output['status'], output['message'] = 'ok', 'ok'
        output['server'] = user.server
        output['account_id'] = user.account_id


    output['time'] = time.time() - start_time
    return Response(json.dumps(output), mimetype='application/json')

#Request different files.
@app.route('/api-request-file/<file_type>/')
def api_request_file(file_type):

    #Defaults.
    output = {'status': 'error',
              'message': 'Bad request',
              'data': None,
              'count': 0}

    #File types.
    if file_type == 'percentiles':
        output['data'] = percentiles
    elif file_type == 'percentiles_generic':
        output['data'] = percentiles_generic
    elif file_type == 'tankopedia':
        output['data'] = tankopedia
    elif file_type == 'wn8console':
        output['data'] = wn8console
    elif file_type == 'wn8pc':
        output['data'] = wn8pc
    else:
        output['message'] = 'Wrong file type'
        return Response(json.dumps(output), mimetype='application/json')

    #Output if success.
    output['count'] = len(output['data'])
    output['status'], output['message'] = 'ok', 'ok'
    return Response(json.dumps(output), mimetype='application/json')

#Request snapshots straight from SQL.
@app.route('/api-request-snapshots/<server>/<account_id>/')
def api_request_snapshots(server, account_id):

    #Defaults.
    output = {'status': 'error',
              'message': 'Bad request',
              'count': 0,
              'server': None,
              'account_id': None,
              'data': None}

    #Validation.
    try:
        int(account_id)
        if server not in ['xbox', 'ps4']:
            raise
    except:
        output['message'] = 'Wrong server/account_id/timestamp'
        return Response(json.dumps(output), mimetype='application/json')

    #Database fetch and output.
    output['data'] = sql.request_checkpoints(server, account_id)
    output['count'] = len(output['data'])
    output['status'], output['message'] = 'ok', 'ok'
    output['server'] = server
    output['account_id'] = account_id

    return Response(json.dumps(output), mimetype='application/json')

@app.route('/save/<server>/<account_id>/')
def save(server, account_id):

    #Validation.
    try:
        int(account_id)
        if server not in ['xbox', 'ps4']:
            raise
    except:
        return('Validation error')

    #Fetching the player.
    user = player_profile_cls(server, account_id)
    user.request_or_find_cached()

    #If error.
    if user.status != 'ok':
        return('Player couldn\'t be fetched')

    #Adding to the database.
    sql.add_or_update_checkpoint(user.server, user.account_id, user.player_data)
    sql.delete_expired_checkpoints()
    return('ok')



if __name__ == '__main__':
    app.run()
