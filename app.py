from flask import Flask, render_template, request, redirect, url_for, make_response, Response, g
import sqlite3
import requests
import pickle
import json
import datetime
import time


from secret import app_id


with open('references/tankopedia.json', 'r') as f:
    tankopedia = json.load(f)


app = Flask(__name__)


#Sqlite3 singleton + connection opener + connection teardown.
def open_conn():
    conn = getattr(g, '_database', None)
    if conn is None:
        conn = g._database = sqlite3.connect('sqlite.db')
    return conn
@app.teardown_appcontext
def close_conn(exception):
    conn = getattr(g, '_database', None)
    if conn is not None:
        conn.commit()
        conn.close()
class sql():
    #Main functions.
    @staticmethod
    def get_cached_checkpoint(server, account_id):
        #Returns the most recent checkpoint created by user from last 10 minutes. None otherwise.
        five_minutes_ago = int(time.time()) - 600
        cur = open_conn().cursor()
        query = '''SELECT created_at, account_id, server, data FROM checkpoints
                   WHERE server = ? AND account_id = ? AND created_by_bot != 1 AND created_at >= ?
                   ORDER BY created_at DESC LIMIT 1;'''
        search = cur.execute(query, (server, account_id, five_minutes_ago)).fetchone()
        if search:
            return([search[0], search[1], search[2], pickle.loads(search[3])])
        return(None)
    @staticmethod
    def get_all_recent_checkpoints(server, account_id):
        #Returns the list of checkpoints for the last 14 days. Ordered from earliest to latest.
        fourteen_days = int(time.time()) - 60 * 60 * 24 * 14
        cur = open_conn().cursor()
        query = '''SELECT created_at, account_id, server, data FROM checkpoints
                   WHERE server = ? AND account_id = ? AND created_at >= ?
                   ORDER BY created_at ASC;'''
        search = cur.execute(query, [server, account_id, fourteen_days]).fetchall()
        output = [[row[0], row[1], row[2], pickle.loads(row[3])] for row in search]
        return(output)
    @staticmethod
    def add_or_update_checkpoint(server, account_id, player_data):
        #Add checkpoint by HUMAN if none were created today.
        #Update checkpoing (and conver to HUMAN-made) if already was created today.
        cur = open_conn().cursor()
        query = 'SELECT MAX(created_at) FROM checkpoints WHERE server = ? AND account_id = ?'
        biggest_timestamp = cur.execute(query, [server, account_id]).fetchone()[0]

        now = int(time.time())

        if biggest_timestamp:
            found_date = time.strftime('%Y%m%d', time.gmtime(biggest_timestamp))
            current_date = time.strftime('%Y%m%d', time.gmtime(now))

            #Updating if the biggest_timestamp is from today.
            if found_date == current_date:
                query = '''UPDATE checkpoints SET created_at = ?, created_by_bot = ?, data = ?
                           WHERE created_at = ? AND account_id = ? AND server = ?;'''
                cur.execute(query, (now, 0, pickle.dumps(player_data), biggest_timestamp, account_id, server))
                return

        #If None or the record was not created today.
        query = 'INSERT INTO checkpoints (created_at, created_by_bot, account_id, server, data) VALUES (?, ?, ?, ?, ?);'
        cur.execute(query, (now, 0, account_id, server, pickle.dumps(player_data)))
    @staticmethod
    def get_first_checkoint_per_week(server, account_id):
        #SQLite3:"strftime('%H%M', timestamp, 'unixepoch')" ==  Python:"time.strftime('%H%M', time.gmtime(timestamp))"
        query = '''
            SELECT created_at, data
            FROM checkpoints
            WHERE server = ? AND account_id = ? AND created_at IN (
                SELECT MIN(created_at)
                FROM checkpoints
                WHERE server = ? AND account_id = ?
                GROUP BY
                    strftime('%Y', created_at, 'unixepoch'),
                    strftime('%W', created_at, 'unixepoch')
            )
            ORDER BY created_at ASC;
        '''
        cur.execute(query, (server, account_id, server, account_id))
        return([{'created_at': row[0], 'data': pickle.loads(row[1])} for row in cur])

    #Methods for the bot to create auto-checkpoints.
    @staticmethod
    def get_users_in_period(start_timestamp, end_timestamp):
        #Find unique non-bot account ids in between timestamps.
        #Out: [](server:str, account_id:int)
        query = '''SELECT server, account_id FROM checkpoints
                   WHERE created_by_bot != 1 AND created_at >= ? AND created_at <= ?
                   GROUP BY account_id, server
                   ORDER BY account_id, server'''
        cur = open_conn().cursor()
        output = cur.execute(query, (start_timestamp, end_timestamp)).fetchall()
        return(output)
    @staticmethod
    def is_created_today(server, account_id):
        #Check if checkpoint was created today. Returns bool.
        cur = open_conn().cursor()
        #Getting the entry with biggest timestamp.
        query = 'SELECT MAX(created_at) FROM checkpoints WHERE server = ? AND account_id = ?'
        found_timestamp = cur.execute(query, [server, account_id]).fetchone()[0]

        #If returned the result.
        if found_timestamp:
            found_date = time.strftime('%Y%m%d', time.gmtime(found_timestamp))
            current_date = time.strftime('%Y%m%d', time.gmtime(time.time()))
            #If latest timestamp is from today.
            if found_date == current_date:
                return(True)
        return(False)
    @staticmethod
    def add_bot_checkpoint(server, account_id, player_data):
        #Add checkpont by BOT or do nothing if already exist today.
        cur = open_conn().cursor()
        query = 'SELECT MAX(created_at) FROM checkpoints WHERE server = ? AND account_id = ?'
        biggest_timestamp = cur.execute(query, (server, account_id)).fetchone()[0]

        now = int(time.time())

        if biggest_timestamp:
            found_date = time.strftime('%Y%m%d', time.gmtime(biggest_timestamp))
            current_date = time.strftime('%Y%m%d', time.gmtime(now))
            if found_date == current_date:
                return

        #If returned None, or result is not from today.
        query = '''INSERT INTO checkpoints (created_at, created_by_bot, account_id, server, data)
                   VALUES (?, ?, ?, ?, ?);'''
        cur.execute(query, (now, 1, account_id, server, pickle.dumps(player_data)))

    #Database optimization and cleaning up.
    @staticmethod
    def leave_first_checkpoint_per_week(server, account_id):
        #Scans through all user checkpoints and leaves 1st checkpont in a week. Leaves last 14 days untouched.
        cur = open_conn().cursor()
        fourteen_days_ago = int(time.time()) - (60 * 60 * 24 * 14)
        query = '''
            DELETE FROM checkpoints
            WHERE server = ? AND account_id = ? AND created_at < ? AND created_at NOT IN (
                SELECT MIN(created_at)
                FROM checkpoints
                WHERE server = ? AND account_id = ?
                GROUP BY
                    strftime('%Y', created_at, 'unixepoch'),
                    strftime('%W', created_at, 'unixepoch')
                );
        '''
        cur.execute(query, (server, account_id, fourteen_days_ago, server, account_id))


#Frontend.
@app.route('/')
def index():
    return render_template("index.html")
@app.route('/dev')
def index_dev():
    return render_template("index_dev.html")


#Singletons.
class wgapi:
    @staticmethod
    def get_player_data(server, account_id, app_id):
        #Request player data from WG API. Output: ('status', 'message', [data])

        url = 'https://api-{}-console.worldoftanks.com/wotx/tanks/stats/?application_id={}&account_id={}'\
               .format(server, app_id, account_id)
        try:
            resp = requests.get(url, timeout=15).json()
        except requests.exceptions.ReadTimeout:
            return('error', 'couldnt connect to WG API within specified time', None)

        #If request went through.
        status = resp.get('status')
        message = resp.get('error', {}).get('message')
        vehicles = resp.get('data', {}).get(str(account_id))
        data = None

        if status == 'error':
            pass
        elif status == 'ok' and vehicles is None:
            status, message = 'error', 'No vehicles on the account'
        elif status == 'ok':
            message, data = 'ok', []
            for vehicle in vehicles:
                #Dictionary from main values.
                temp_dict = vehicle['all']
                #Adding other values.
                temp_dict['battle_life_time'] = vehicle['battle_life_time']
                temp_dict['last_battle_time'] = vehicle['last_battle_time']
                temp_dict['mark_of_mastery'] = vehicle['mark_of_mastery']
                temp_dict['max_frags'] = vehicle['max_frags']
                temp_dict['max_xp'] = vehicle['max_xp']
                temp_dict['tank_id'] = vehicle['tank_id']
                temp_dict['trees_cut'] = vehicle['trees_cut']
                #Adding to output.
                data.append(temp_dict)
        else:
            #Unknown status
            raise

        return(status, message, data)
    @classmethod
    def find_cached_or_request(cls, server, account_id, app_id):
        #Find SQL cached player data or to request and save in SQL. Output: ('status', 'message', [data])


        #Trying to get results from SQL first.
        player_data = sql.get_cached_checkpoint(server, account_id)

        if player_data is not None:
            return('ok', 'ok', player_data[3])

        #If no cached results, requesting from WG API.
        status, message, data = cls.get_player_data(server, account_id, app_id)

        #Fallback to 'demo' app_id.
        #if status == 'error' and message in ['INVALID_APPLICATION_ID', 'INVALID_IP_ADDRESS']:
        #    self.app_id = 'demo'
        #    status, message, data = cls.get_player_data(server, account_id)

        #Updating (or creating) SQL checkpoint if went fine.
        if status == 'ok':
            sql.add_or_update_checkpoint(server, account_id, data)

        return(status, message, data)
class percentile:
    with open('references/percentiles.json', 'r') as f:
        percentiles = json.load(f)
    with open('references/percentiles_generic.json', 'r') as f:
        percentiles_generic = json.load(f)
    #Find array for specified kind and tank_id.
    @classmethod
    def get_percentiles_array(cls, kind, tank_id):
        # Checking if the tank in percentiles dictionary.
        array = cls.percentiles[kind].get(str(tank_id))

        #If tank is in the pre-calculated table. (DEFAULT)
        if array:
            return(array)

        #If tank in tankopedia, getting generic percentile (tier-class).
        temp_tank = tankopedia.get(str(tank_id))
        if temp_tank:
            tier_class = str(temp_tank['tier']) + temp_tank['type']
            array = cls.percentiles_generic[kind].get(tier_class)
            return(array)

        #If not in percentiles dictionary and not in tankopedia.
        return(None)
    #Find one closest number from sorted array and return its index.
    @staticmethod
    def find_index_of_closest_value(array, number):
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
    @classmethod
    def calculate(cls, kind, tank_id, number):
        if number > 0:
            array = cls.get_percentiles_array(kind, tank_id)
            if array is not None:
                return(cls.find_index_of_closest_value(array, number))
        return(0)
class wn8:
    with open('references/wn8console.json', 'r') as f:
        wn8console = json.load(f)['data']
    with open('references/wn8pc.json', 'r') as f:
        wn8pc = json.load(f)['data']
    @classmethod
    def get_console_values(cls, tank_id):
        for item in cls.wn8console:
            if tank_id == item.get('IDNum'):
                return(item)
        return(None)
    @classmethod
    def get_pc_values(cls, tank_id):
        for item in cls.wn8pc:
            if tank_id == item.get('IDNum'):
                return(item)
        return(None)
    @classmethod
    def calculate_for_tank(cls, tank_data, wn8_type):
        #Loading expected values
        exp_values = None
        if wn8_type == 'console':
            exp_values = cls.get_console_values(tank_data['tank_id'])
        elif wn8_type == 'pc':
            exp_values = cls.get_pc_values(tank_data['tank_id'])
        else:
            raise

        #If not found.
        if exp_values is None:
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
    @classmethod
    def calculate_for_all_tanks(cls, player_data, wn8_type):
        battle_counter, wn8_counter = 0, 0
        for tank in player_data:
            wn8_temp = cls.calculate_for_tank(tank, wn8_type) * tank['battles']
            #Adding up only if WN8 value is more than 0.
            if wn8_temp > 0:
                battle_counter += tank['battles']
                wn8_counter += wn8_temp

        if battle_counter > 0:
            return(wn8_counter / battle_counter)
        else:
            return(0.0)


#Root app class.
class base():
    def __init__(self, server, account_id, player_data):
        self.server = server
        self.account_id = account_id
        self.player_data = player_data

    #Decode string sent by a client into a filter input.
    @staticmethod
    def decode_filters_string(filters_string):
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

    #Function substracts old_data from new_data.
    @staticmethod
    def find_difference(old_data, new_data):
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

class pageProfile(base):
    def __init__(self, server, account_id, player_data):
        base.__init__(self, server, account_id, player_data)

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

            return({'acc':       round(acc, 2),
                    'dmgc':      round(dmgc / battles, 2),
                    'rass':      round(rass / battles, 2),
                    'dmgr':      round(dmgr / battles, 2),
                    'k_d':       round(k_d, 2),
                    'dmgc_dmgr': round(dmgc_dmgr, 2),
                    'wr':        round(wins / battles * 100, 2)})

        return({'acc': 0, 'dmgc': 0, 'rass': 0, 'dmgr': 0, 'k_d': 0, 'dmgc_dmgr': 0, 'wr': 0})

    def calculate_percentiles_for_all_tanks(self, userdata):
        dmgc_temp, wr_temp, rass_temp, dmgr_temp, acc_temp = ([] for i in range(5))
        output_dict = {}
        #Iterating through vehicles.
        dmgc, wr, rass, dmgr, acc = (0 for i in range(5))
        battle_counter = 0
        for vehicle in userdata:
            if vehicle['battles'] > 0:
                battle_counter += vehicle['battles']

                dmgc += percentile.calculate('dmgc', vehicle['tank_id'], vehicle['damage_dealt']/vehicle['battles']) * vehicle['battles']
                wr +=   percentile.calculate('wr', vehicle['tank_id'], vehicle['wins']/vehicle['battles']*100) * vehicle['battles']
                rass += percentile.calculate('rass', vehicle['tank_id'], vehicle['damage_assisted_radio']/vehicle['battles']) * vehicle['battles']
                dmgr += percentile.calculate('dmgr', vehicle['tank_id'], vehicle['damage_received']/vehicle['battles']) * vehicle['battles']

                #If no hits, percentile would be 0 anyways.
                if vehicle['hits'] > 0:
                    acc += percentile.calculate('acc', vehicle['tank_id'], vehicle['hits']/vehicle['shots']*100) * vehicle['battles']

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

    @staticmethod
    def calculate_overall_percentile(percentile_dict):
        total = sum([value for _, value in percentile_dict.items()])
        #There are 5 percentiles.
        output = total / 5
        return(round(output, 2))

    def calculate_page_profile(self, filters, recent_checkpoints):

        #Converting filters into a list.
        filters = self.decode_filters_string(filters)

        #Getting player data from first checkpont.
        first_recent_checkpoint = []
        if len(recent_checkpoints) > 0:
            first_recent_data = recent_checkpoints[0][3]


        #Placeholders.
        all_time, recent, difference = ({} for i in range(3))
        xlabels, percentiles_totals, wn8_totals = ([] for i in range(3))


        #Calculating all-time player performance.
        self.filter_data(filters, tankopedia)
        all_time =                  self.calculate_general_account_stats(self.player_data)
        all_time['wn8'] =           wn8.calculate_for_all_tanks(self.player_data, 'console')
        all_time['percentiles'] =   self.calculate_percentiles_for_all_tanks(self.player_data)
        all_time['total_perc'] =    self.calculate_overall_percentile(all_time['percentiles'])


        #Calculating recent player performance.
        self.player_data = self.find_difference(first_recent_data, self.player_data)
        self.filter_data(filters, tankopedia)
        recent =                self.calculate_general_account_stats(self.player_data)
        recent['wn8'] =         wn8.calculate_for_all_tanks(self.player_data, 'console')
        recent['percentiles'] = self.calculate_percentiles_for_all_tanks(self.player_data)
        recent['total_perc'] =  self.calculate_overall_percentile(recent['percentiles'])


        #Calculating charts.
        for r, row in enumerate(recent_checkpoints):
            #Getting 'xlabels'.
            checkpoint_timestamp = row[0]
            timedelta = datetime.datetime.utcnow().date() - datetime.datetime.utcfromtimestamp(checkpoint_timestamp).date()
            if timedelta.days > 0:
                xlabels.append(str(timedelta.days) + 'd ago')
            else:
                xlabels.append('Today')
            #Loading and filtering player data.
            self.player_data = row[3]
            #Filtering data using function of the same class.
            self.filter_data(filters, tankopedia)
            #Calculating Percentile totals.
            percentiles_totals.append(self.calculate_percentiles_for_all_tanks(self.player_data))
            #Calculating WN8 totals.
            wn8_totals.append(round(wn8.calculate_for_all_tanks(self.player_data, 'console'), 2))


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

class pageVehicles(base):
    def __init__(self, server, account_id, player_data):
        base.__init__(self, server, account_id, player_data)

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
            temp_dict['wn8'] = wn8.calculate_for_tank(vehicle, 'console')
            temp_dict['wn8pc'] = wn8.calculate_for_tank(vehicle, 'pc')

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
            temp_dict['dmg_perc'] = percentile.calculate('dmgc', vehicle['tank_id'], temp_dict['avg_dmg'])

            temp_dict['wr'] = vehicle['wins'] / vehicle['battles'] * 100
            temp_dict['wr_perc'] = percentile.calculate('wr', vehicle['tank_id'], temp_dict['wr'])

            temp_dict['avg_exp'] = vehicle['xp'] / vehicle['battles']
            temp_dict['exp_perc'] = percentile.calculate('exp', vehicle['tank_id'], temp_dict['avg_exp'])


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

class pageTimeSeries(pageProfile):
    def __init__(self, server, account_id, player_data):
        base.__init__(self, server, account_id, player_data)

    def calculate_charts(self, user_history_query, filter_input, tankopedia):

        self.xlabels = []

        self.percentiles_totals, self.percentiles_change = [], []

        self.wn8_totals, self.wn8_change = [], []

        for r, row in enumerate(user_history_query):

            #Getting 'xlabels'.
            user_timestamp = row[0]
            timedelta = datetime.datetime.utcnow().date() - datetime.datetime.utcfromtimestamp(user_timestamp).date()
            if timedelta.days > 0:
                self.xlabels.append(str(timedelta.days) + 'd ago')
            else:
                self.xlabels.append('Today')

            #Loading and filtering player data.
            self.player_data = row[3]
            #Filtering data using function of the same class.
            self.filter_data(filter_input, tankopedia)
            #Calculating Percentile totals.
            self.percentiles_totals.append(self.calculate_percentiles_for_all_tanks(self.player_data))
            #Calculating WN8 totals.
            self.wn8_totals.append(wn8.calculate_for_all_tanks(self.player_data, 'console'))

            #Calculating day-to-day change. Skipping the first item.
            if r != 0:
                #Substracting snapshot_data from player_data.
                self.slice_data = self.find_difference(self.snapshot_data, self.player_data)
                #Calculating day-to-day percentiles.
                self.percentiles_change.append(self.calculate_percentiles_for_all_tanks(self.slice_data))
                #Calculating day-to-day WN8.
                self.wn8_change.append(wn8.calculate_for_all_tanks(self.slice_data, 'console'))

            #Assigning snapshot.
            self.snapshot_data = self.player_data
        return

class pageSessionTracker(base):
    def __init__(self, server, account_id, player_data):
        base.__init__(self, server, account_id, player_data)
    @staticmethod
    def get_timestamps(search):
        #Return list of timestamps excluding today.
        now = time.gmtime()
        today = (now.tm_year, now.tm_yday)

        output = []
        for row in search:
            timestamp = row[0]
            time_struct = time.gmtime(timestamp)
            date = (time_struct.tm_year, time_struct.tm_yday)

            if today != date:
                output.append(timestamp)

        return(output)
    def get_radar_data(self, tank_data, tank_id):
        temp_dict = {'dmgc': tank_data['damage_dealt'] / tank_data['battles'],
                     'exp':  tank_data['xp'] / tank_data['battles'],
                     'rass': tank_data['damage_assisted_radio'] / tank_data['battles'],
                     'dmgr': tank_data['damage_received'] / tank_data['battles'],
                     'acc':  tank_data['hits'] / tank_data['shots'] * 100 if tank_data['shots'] > 0 else 0.0}

        temp_dict['radar'] = [
            percentile.calculate('acc', tank_id, temp_dict['acc']),
            percentile.calculate('dmgc', tank_id, temp_dict['dmgc']),
            percentile.calculate('rass', tank_id, temp_dict['rass']),
            percentile.calculate('exp', tank_id, temp_dict['exp']),
            abs(percentile.calculate('dmgr', tank_id, temp_dict['dmgr']) - 100)
        ]

        return(temp_dict)
    @staticmethod
    def get_other_data(tank_data):
        return({
            'battles':  tank_data['battles'],
            'wins':     tank_data['wins'],
            'lifetime': tank_data['battle_life_time'] / tank_data['battles'],
            'dpm':      tank_data['damage_dealt'] / tank_data['battle_life_time'] * 60,
            'wn8':      wn8.calculate_for_tank(tank_data, 'console')
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
            row_timestamp = row[0]
            if timestamp == row_timestamp:
                snapshot_data = row[3]
                break

        #Slicing.
        slice_data = self.find_difference(snapshot_data, self.player_data)

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
class pageWn8Estimates(base):
    def __init__(self, server, account_id, player_data):
        base.__init__(self, server, account_id, player_data)
    @staticmethod
    def calculate_wn8_damage_targets(tank_data):
        #Loading expected values.
        exp_values = wn8.get_console_values(tank_data['tank_id'])
        if any(exp_values) == False:
            return([0 for i in range(9)])

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
    def calculate_wn8_estimates(self):
        output = []
        #Iterating through tanks in player data.
        for vehicle in self.player_data:
            #Skip if no battles on tank.
            if vehicle['battles'] == 0:
                continue

            #Get WN8 expected values.
            tank_dict = wn8.get_console_values(vehicle['tank_id'])

            #Skip if tank not in WN8 expected values.
            if tank_dict is None:
                continue

            #Skip if tank not in tankopedia.
            tankopedia_item = tankopedia.get(str(vehicle['tank_id']))
            if tankopedia_item is None:
                continue
            tank_dict.update(tankopedia_item)

            #Adding additional values.
            tank_dict['Damage']     = vehicle['damage_dealt'] / vehicle['battles']
            tank_dict['Def']        = vehicle['dropped_capture_points'] / vehicle['battles']
            tank_dict['Frag']       = vehicle['frags'] / vehicle['battles']
            tank_dict['Spot']       = vehicle['spotted'] / vehicle['battles']
            tank_dict['WinRate']    = vehicle['wins'] / vehicle['battles'] * 100

            #Calculating damage targets.
            tank_dict['dmgTargets'] = self.calculate_wn8_damage_targets(vehicle)

            output.append(tank_dict)

        return(output)


#Main API.
@app.route('/api/<request_type>/<server>/<account_id>/<timestamp>/<filters>/')
def api_main(request_type, server, account_id, timestamp, filters):

    start = time.time()


    #Validation.
    try:
        int(account_id), int(timestamp)
        if server not in ['xbox', 'ps4']:
            raise
        if request_type not in ['profile', 'vehicles', 'time_series', 'session_tracker', 'wn8_estimates']:
            raise
    except:
        return Response(json.dumps({
            'status': 'error',
            'message': 'invalid server / account_id / timestamp'
        }), mimetype='application/json')


    #Request player data or find cached.
    status, message, data = wgapi.find_cached_or_request(server, account_id, app_id)
    if status != 'ok':
        return Response(json.dumps({
            'status': status,
            'message': message
        }), mimetype='application/json')


    #Processing according to request type.
    if request_type == 'profile':
        user = pageProfile(server, account_id, data)
        recent_checkpoints = sql.get_all_recent_checkpoints(server, account_id)
        output = user.calculate_page_profile(filters, recent_checkpoints)

    elif request_type == 'vehicles':
        user = pageVehicles(server, account_id, data)
        user.extract_vehicle_data()
        output = user.player_data

    elif request_type == 'time_series':
        user = pageTimeSeries(server, account_id, data)
        filters = user.decode_filters_string(filters)
        user_history_search = sql.get_all_recent_checkpoints(server, account_id)
        user.calculate_charts(user_history_search, filters, tankopedia)
        output = {
            'xlabels':            user.xlabels,
            'percentiles_change': user.percentiles_change,
            'wn8_totals':         user.wn8_totals[1:],
            'wn8_change':         user.wn8_change,
            'wn8_labels':         user.xlabels[1:]
        }

    elif request_type == 'session_tracker':
        user = pageSessionTracker(server, account_id, data)
        search = sql.get_all_recent_checkpoints(server, account_id)
        output = user.calculateSessionTracker(timestamp, search)

    elif request_type == 'wn8_estimates':
        user = pageWn8Estimates(server, account_id, data)
        output = user.calculate_wn8_estimates()


    return Response(json.dumps({
        'status':     'ok',
        'message':    'ok',
        'count':      len(output),
        'server':     server,
        'account_id': account_id,
        'data':       output,
        'time':       time.time() - start
    }), mimetype='application/json')

#Request various files.
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
    output['data'] = sql.get_all_recent_checkpoints(server, account_id)
    output['count'] = len(output['data'])
    output['status'], output['message'] = 'ok', 'ok'
    output['server'] = server
    output['account_id'] = account_id

    return Response(json.dumps(output), mimetype='application/json')

@app.route('/users-in-period/<start_timestamp>/<end_timestamp>/')
def users_in_period(start_timestamp, end_timestamp):
    start = time.time()
    #Validation.
    try:
        int(start_timestamp), int(end_timestamp)
    except:
        return Response(json.dumps({
            'status': 'error',
            'message': 'timestamp cant be converted to integer',
        }), mimetype='application/json')

    users = sql.get_users_in_period(start_timestamp, end_timestamp)

    return Response(json.dumps({
        'status': 'ok',
        'message': 'ok',
        'data': users,
        'count': len(users),
        'time': time.time() - start
    }), mimetype='application/json')

#Add checkpoint marked as bot-created if was not created today already.
@app.route('/add-bot-checkpoint/<server>/<account_id>/')
def add_bot_checkpoint(server, account_id):

    #Validation.
    try:
        account_id = int(account_id)
        if server not in ['xbox', 'ps4']:
            raise
    except:
        return('error: wrong server or account id')

    #Cleaning up.
    sql.leave_first_checkpoint_per_week(server, account_id)

    #Checking if the checkpoint already was created today before sending http request for data.
    if sql.is_created_today(server, account_id) == True:
        return('ok')

    #Fetching the player.
    status, message, data = wgapi.get_player_data(server, account_id, app_id)

    if status != 'ok':
        return('error: player couldnt be fetched')

    #Adding to the database.
    sql.add_bot_checkpoint(server, account_id, data)
    return('ok')

@app.route('/diag')
def diag():
    return('nothing here yet')



if __name__ == '__main__':
    app.run()
