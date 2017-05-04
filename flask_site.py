from flask import Flask, render_template, request, redirect, url_for, make_response, Response
from flask_sqlalchemy import SQLAlchemy
import requests
import json
import pickle
import datetime
import time

#Importing necessary files.
with open('references/tankopedia.json','r') as infile:
    tankopedia = json.load(infile)
with open('references/percentiles.json','r') as infile:
    percentiles = json.load(infile)
with open('references/percentiles_generic.json','r') as infile:
    percentiles_generic = json.load(infile)
with open('references/wn8console.json','r') as infile:
    wn8console = json.load(infile)['data']
with open('references/wn8pc.json','r') as infile:
    wn8pc = json.load(infile)['data']


app = Flask(__name__)


#SQL database parameters & classes.
SQLALCHEMY_DATABASE_URI = 'sqlite:///./sql_database.db'
app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
app.config["SQLALCHEMY_POOL_RECYCLE"] = 299
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


class userdata_history(db.Model):
    __tablename__ = "history"
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.Integer)
    account_id = db.Column(db.Integer)
    nickname = db.Column(db.String(100))
    server = db.Column(db.String(20))
    player_data = db.Column(db.PickleType)

    @classmethod
    def add_or_update(cls, server, account_id, player_data):
        #Searching for all entries for nickname-server.
        user_history_search = cls.query.filter_by(account_id=account_id, server=server).all()
        #If entries found.
        if len(user_history_search) > 0:
            #Looking for latest entry.
            max_timestamp = 0
            for row in user_history_search:
                if row.timestamp > max_timestamp:
                    max_timestamp = row.timestamp
            #If latest entry is today, updating today's record.
            if datetime.datetime.utcfromtimestamp(max_timestamp).date() == datetime.datetime.utcnow().date():
                for row in user_history_search:
                    if row.timestamp == max_timestamp:
                        current_user = row

                current_user.timestamp = int((datetime.datetime.utcnow()-datetime.datetime(1970,1,1)).total_seconds())
                current_user.player_data = player_data
                db.session.commit()
            #If max timestamp is not today, creating new record.
            else:
                timestamp = int((datetime.datetime.utcnow()-datetime.datetime(1970,1,1)).total_seconds())
                entry = cls(timestamp = timestamp, account_id=account_id, nickname='api_call', server=server, player_data=player_data)
                db.session.add(entry)
                db.session.commit()
        #If no entries found.
        else:
            timestamp = int((datetime.datetime.utcnow()-datetime.datetime(1970,1,1)).total_seconds())
            entry = cls(timestamp = timestamp, account_id=account_id, nickname='api_call', server=server, player_data=player_data)
            db.session.add(entry)
            db.session.commit()
        return

    @classmethod
    def delete_expired(cls):
        #Setting the period.
        period = 12 * 24 * 60 * 60
        #Calling timestamp.
        timestamp = int((datetime.datetime.utcnow()-datetime.datetime(1970,1,1)).total_seconds())
        #Searching for all entries which are older than 'period'.
        search = cls.query.filter(cls.timestamp <= timestamp-period).all()
        #If found anything, delete all.
        if len(search) > 0:
            for row in search:
                db.session.delete(row)
            db.session.commit()
        return
userdata_history.delete_expired()

class usercache(db.Model):
    __tablename__ = "usercache"
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.Integer)
    account_id = db.Column(db.Integer)
    nickname = db.Column(db.String(100))
    server = db.Column(db.String(20))
    player_data = db.Column(db.PickleType)

    @classmethod
    def request_cache(cls, server, account_id):
        #Searching by 'nickname'-'server'.
        search = cls.query.filter_by(server=server, account_id=account_id).all()
        #If anything found, searching max timestamp.
        if len(search) > 0:
            max_timestamp = max([row.timestamp for row in search])
            #Requesting current timestamp.
            timestamp = int((datetime.datetime.utcnow()-datetime.datetime(1970,1,1)).total_seconds())
            #Checking if the searched timestamp is not older than 5 minutes.
            if timestamp - max_timestamp <= 300:
                for row in search:
                    #Using cached data if 'max_timestamp' was in last 5 minutes.
                    if row.timestamp == max_timestamp:
                        current_user = row
            #If timestamp is older than 5 minutes.
            else:
                current_user = None
        #If nothing found.
        else:
            current_user = None
        return(current_user)

    @classmethod
    def delete_expired_cache(cls):
        #Calling timestamp.
        timestamp = int((datetime.datetime.utcnow()-datetime.datetime(1970,1,1)).total_seconds())
        #Searching for all entries for nickname-server which are older than 5 minutes.
        search = cls.query.filter(cls.timestamp <= timestamp-300).all()
        #If found anything, delete all.
        if len(search) > 0:
            for row in search:
                db.session.delete(row)
            db.session.commit()
        return

    @classmethod
    def delete_all_cache(cls):
        db.session.query(cls).delete()
        db.session.commit()
        return
usercache.delete_all_cache()



#Front end.
@app.route('/')
def index():
    userdata_history.delete_expired()
    return render_template("index.html")


#Root app class.
class user_cls:
    def __init__(self, server, account_id):
        self.app_id = 'demo'
        self.server = server
        self.account_id = account_id

    #Request player data by account_id.
    def request_vehicles(self):
        url = 'https://api-' + self.server + '-console.worldoftanks.com/wotx/tanks/stats/?application_id='
        url = url + self.app_id + '&account_id=' + str(self.account_id)
        request = requests.get(url)
        vehicles = request.json()
        #if no vehicles on the account
        if vehicles['status'] == 'error':
            self.status = 'error'
            self.message = 'ERROR: ' + str(vehicles['error']['message'])
        elif vehicles['data'][str(self.account_id)] == None:
            self.status = 'error'
            self.message = 'ERROR: No vehicles found on the account'
        else:
            self.status = 'ok'
            #extracting into dictionaries
            self.player_data = []
            for vehicle in vehicles['data'][str(self.account_id)]:
                #dictionary from main values
                temp_dict = vehicle['all']
                #adding other values
                temp_dict['account_id'] = vehicle['account_id']
                temp_dict['battle_life_time'] = vehicle['battle_life_time']
                temp_dict['last_battle_time'] = vehicle['last_battle_time']
                temp_dict['mark_of_mastery'] = vehicle['mark_of_mastery']
                temp_dict['max_frags'] = vehicle['max_frags']
                temp_dict['max_xp'] = vehicle['max_xp']
                temp_dict['tank_id'] = vehicle['tank_id']
                temp_dict['trees_cut'] = vehicle['trees_cut']
                self.player_data.append(temp_dict)

    #Save user data into SQL 'usercache'.
    def save_to_cache(self):
        timestamp = int((datetime.datetime.utcnow()-datetime.datetime(1970,1,1)).total_seconds())
        action = usercache(timestamp=timestamp, account_id=self.account_id, nickname='api_call',
                           server=self.server, player_data=pickle.dumps(self.player_data))
        db.session.add(action)
        db.session.commit()

    #Function to eiter find cached player data or to request and save in cache.
    def request_or_find_cached(self):
        #Using 'usercache' db model classmethod.
        current_user = usercache.request_cache(self.server, self.account_id)
        #If nothing found in SQL 'cache_user_data', searching by nickname and requesting vehicles data.
        if current_user == None:
            self.request_vehicles()
            #Return error If status not 'ok'.
            if self.status != 'ok':
                return
            #SQL operations if all conditions passed.
            if self.status == 'ok':
                #Delete all expired records from SQL 'cache_user_data'.
                usercache.delete_expired_cache()
                #Logging and caching and adding history data point into SQL.
                self.save_to_cache()
                userdata_history.add_or_update(self.server, self.account_id, pickle.dumps(self.player_data))
        #If recent data found in SQL 'cache_user_data'.
        if current_user != None:
            self.status = 'ok'
            self.player_data = pickle.loads(current_user.player_data)
            self.account_id = current_user.account_id
        return

    #Decode string sent by a client into a filter input.
    def decode_filters_string(self, filters_string):
        #'ab&cd&ef&' -> ['ab', 'cd', 'ef']
        output = []
        new_list = filters_string.split('&')

        for item in new_list:
            if len(item) > 0:
                output.append(item)

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

        array = None
        array = percentiles[kind].get(str(tank_id))

        #If tank is in the pre-calculated table. (DEFAULT)
        if array != None:
            index = self.find_index_of_closest_value(array, number)
            return(index)

        #If tank in tankopedia.
        temp_tank = None
        temp_tank = tankopedia.get(str(tank_id))
        if temp_tank != None:
            tier_class = str(temp_tank['tier']) + temp_tank['type']
            array = percentiles_generic[kind].get(tier_class)

        #If generic percentile exist. (MUST EXIST!)
        if array != None:
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
        #Deleting tanks from 'old_data' that were not played.
        for new_tank in new_data:
            for s, old_tank in enumerate(old_data):
                if new_tank['tank_id'] == old_tank['tank_id'] and new_tank['battles'] == old_tank['battles']:
                    old_data.pop(s)

        #Deleting tanks from 'new_data' that aren't in filtered 'old_data'.
        old_tank_ids = [tank['tank_id'] for tank in old_data]
        temp_list = []
        for tank_id in old_tank_ids:
            for new_tank in new_data:
                if new_tank['tank_id'] == tank_id:
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
            acc = round(hits / shots * 100, 2)              if shots > 0                    else 0
            k_d = round(frags / (battles - survived), 2)    if (battles - survived) > 0     else 100
            dmgc_dmgr = round(dmgc / dmgr, 2)               if dmgr > 0                     else 100

            output_dict = {'acc': acc,
                           'dmgc': round(dmgc / battles, 2),
                           'rass': round(rass / battles, 2),
                           'dmgr': round(dmgr / battles, 2),
                           'k_d': k_d,
                           'dmgc_dmgr': dmgc_dmgr,
                           'wr': round(wins / battles * 100, 2)}
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

    def calculate_overall_percentile(self, percentile_dict):
        total = 0
        for key, value in percentile_dict.items():
            total = total + value
        return(round(total/5, 2))

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

class vehicles_cls(user_cls):
    def __init__(self, server, account_id):
        user_cls.__init__(self, server, account_id)

    def extract_vehicle_data(self):
        extracted_data = []
        #Asembling the header.
        header = ['tank_id']
        #Extracting the data.
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
            timedelta = datetime.datetime.utcnow().date() - datetime.datetime.utcfromtimestamp(row.timestamp).date()
            if timedelta.days > 0:
                self.xlabels.append(str(timedelta.days) + 'd ago')
            else:
                self.xlabels.append('Today')

            #Loading and filtering player data.
            self.player_data = pickle.loads(row.player_data)
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
                timedelta = datetime.datetime.utcnow().date() - datetime.datetime.utcfromtimestamp(row.timestamp).date()
                #Passing data points that are older than today.
                if timedelta.days > 0:
                    snapshots.append(row.timestamp)
        return(snapshots)

    def get_radar_data(self, tank_data, tank_id):
        temp_dict = {'dmgc': tank_data['damage_dealt'] / tank_data['battles'],
                     'exp': tank_data['xp'] / tank_data['battles'],
                     'rass': tank_data['damage_assisted_radio'] / tank_data['battles'],
                     'dmgr': tank_data['damage_received'] / tank_data['battles'],
                     'acc': tank_data['hits'] / tank_data['shots'] * 100 if tank_data['shots'] > 0 else 0.0}

        dmgc_perc = self.percentile_calculator('dmgc', tank_id, temp_dict['dmgc'])
        exp_perc = self.percentile_calculator('exp', tank_id, temp_dict['exp'])
        rass_perc = self.percentile_calculator('rass', tank_id, temp_dict['rass'])
        dmgr_perc = self.percentile_calculator('dmgr', tank_id, temp_dict['dmgr'])
        acc_perc = self.percentile_calculator('acc', tank_id, temp_dict['acc'])

        temp_dict['radar'] = [round(acc_perc, 2), round(dmgc_perc, 2), round(rass_perc, 2), round(exp_perc, 2),
                  abs(round(dmgr_perc, 2) - 100)]

        return(temp_dict)

    def get_other_data(self, tank_data):
        temp_dict = {'battles': tank_data['battles'],
                     'wins': tank_data['wins'],
                     'lifetime': tank_data['battle_life_time'] / tank_data['battles'],
                     'dpm': tank_data['damage_dealt'] / tank_data['battle_life_time'] * 60,
                     'wn8': self.wn8_calculator(tank_data, wn8console)}
        return(temp_dict)



class wn8_estimates_cls(user_cls):
    def __init__(self, server, account_id):
        user_cls.__init__(self, server, account_id)

    def calculate_wn8_damage_targets(self, tank_data, WN8_dict):
        wn8_scale = [[300, "ORANGERED"],
                     [450, "DARKORANGE"],
                     [650, "GOLD"],
                     [900, "YELLOWGREEN"],
                     [1200, "LIME"],
                     [1600, "DEEPSKYBLUE"],
                     [2000, "DODGERBLUE"],
                     [2450, "MEDIUMSLATEBLUE"],
                     [2900, "REBECCAPURPLE"]]

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
        #rDAMAGE = tank_data['damage_dealt']             /   tank_data['battles']     / expDmg
        rSPOT   = tank_data['spotted']                  /   tank_data['battles']     / expSpot
        rFRAG   = tank_data['frags']                    /   tank_data['battles']     / expFrag
        rDEF    = tank_data['dropped_capture_points']   /   tank_data['battles']     / expDef
        rWIN    = tank_data['wins']                     /   tank_data['battles']*100 / expWinRate

        def wn8_last_step(AvgDamage, expDmg, rSPOT, rFRAG, rDEF, rWIN):

            rDAMAGE = AvgDamage / expDmg

            rWINc    = max(0,                     (rWIN    - 0.71) / (1 - 0.71) )
            rDAMAGEc = max(0,                     (rDAMAGE - 0.22) / (1 - 0.22) )
            rFRAGc   = max(0, min(rDAMAGEc + 0.2, (rFRAG   - 0.12) / (1 - 0.12)))
            rSPOTc   = max(0, min(rDAMAGEc + 0.1, (rSPOT   - 0.38) / (1 - 0.38)))
            rDEFc    = max(0, min(rDAMAGEc + 0.1, (rDEF    - 0.10) / (1 - 0.10)))

            WN8 = 980*rDAMAGEc + 210*rDAMAGEc*rFRAGc + 155*rFRAGc*rSPOTc + 75*rDEFc*rFRAGc + 145*min(1.8,rWINc)

            return(WN8)


        #Iterating.
        result_list = []
        count = 0
        for i in range(20, 4500, 5):
            temp_score = wn8_last_step(i, expDmg, rSPOT, rFRAG, rDEF, rWIN)
            if int(temp_score) > wn8_scale[count][0]:
                result_list.append(i)
                count += 1
                if count >= len(wn8_scale):
                    break

        return(result_list)

    def extract_data_for_wn8(self, WN8_dict, tankopedia_dict):
        extracted_data = []
        #Extracting the data.
        for vehicle in self.player_data:
            tank_id = vehicle['tank_id']
            tank_dict = {}
            #Check if item on both sources.
            in_wn8, in_tankopedia = False, False
            #Iterating through WN8 dictionary.
            for wn8_item in WN8_dict:
                if 'IDNum' in wn8_item and wn8_item['IDNum'] == tank_id and vehicle['battles'] > 0:
                    #If match, adding all the expected values from WN8.
                    in_wn8 = True
                    for key, value in wn8_item.items():
                        tank_dict[key] = value
                    #Adding values from tankopedia if item in tankopedia.
                    if str(tank_id) in tankopedia_dict:
                        in_tankopedia = True
                        for key, value in tankopedia_dict[str(tank_id)].items():
                            tank_dict[key] = value
                    #Quitting 'WN8_dict' loop.
                    break

            #Continue only if tank both in 'WN8_dict' and 'tankopedia_dict'.
            if in_wn8 == True and in_tankopedia == True:
                tank_dict['Damage']     = vehicle['damage_dealt']/vehicle['battles']
                tank_dict['Def']        = vehicle['dropped_capture_points']/vehicle['battles']
                tank_dict['Frag']       = vehicle['frags']/vehicle['battles']
                tank_dict['Spot']       = vehicle['spotted']//vehicle['battles']
                tank_dict['WinRate']    = vehicle['wins']/vehicle['battles']*100

                #Calculating damage targets.
                tank_dict['dmgTargets'] = self.calculate_wn8_damage_targets(vehicle, WN8_dict)

            #Appending row (temp_list) to data.
            extracted_data.append(tank_dict)

        #Deleting empty rows.
        for i, item in enumerate(extracted_data):
            if len(item) == 0:
                extracted_data.pop(i)

        self.player_data = extracted_data


#Main API.
@app.route('/api/<request_type>/<server>/<account_id>/<timestamp>/<filters>/')
def api_main(request_type, server, account_id, timestamp, filters):


    start_time = time.time()

    #Defaults.
    output = {'status': 'error',
              'message': 'Bad request',
              'count': 0,
              'server': None,
              'account_id': None,
              'data': None,
              'time': 0}

    #Validations.
    try:
        aaa = int(account_id)
        if aaa not in users_to_transfer:
            users_to_transfer.append(aaa)
        if server not in ['xbox', 'ps4']:
            raise
    except:
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

        #Searching all records of the player in SQL 'history' and taking first available.
        user_history_search = userdata_history.query.filter_by(account_id=account_id, server=user.server).all()
        if len(user_history_search) > 0:
            user.player_data = user.find_difference(pickle.loads(user_history_search[0].player_data), user.player_data)

        user.filter_data(filters, tankopedia)

        recent = user.calculate_general_account_stats(user.player_data)
        recent['wn8'] = user.calculate_wn8_for_all_tanks(user.player_data)
        recent['percentiles'] = user.calculate_percentiles_for_all_tanks(user.player_data)
        recent['total_perc'] = user.calculate_overall_percentile(recent['percentiles'])

        #Calculating charts.
        for r, row in enumerate(user_history_search):
            #Getting 'xlabels'.
            timedelta = datetime.datetime.utcnow().date() - datetime.datetime.utcfromtimestamp(row.timestamp).date()
            if timedelta.days > 0:
                xlabels.append(str(timedelta.days) + 'd ago')
            else:
                xlabels.append('Today')
            #Loading and filtering player data.
            user.player_data = pickle.loads(row.player_data)
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

    if request_type == 'vehicles':
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

    if request_type == 'time_series':
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
        user_history_search = userdata_history.query.filter_by(account_id=user.account_id, server=user.server).all()
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

    if request_type == 'session_tracker':
        user = session_tracker_cls(server, account_id)
        user.request_or_find_cached()
        #Return error If status != 'ok'.
        if user.status != 'ok':
            output['status'] = 'error'
            output['message'] = user.message
            return Response(json.dumps(output), mimetype='application/json')

        #Calling all 'userdata_history' snapshots from SQL.
        search = userdata_history.query.filter_by(account_id=user.account_id, server=user.server).all()
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
            if int(timestamp) == row.timestamp:
                user.snapshot_data = pickle.loads(row.player_data)


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

    if request_type == 'wn8_estimates':
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
        output['data'] = WN8_dict['data']
    elif file_type == 'wn8pc':
        with open('references/wn8pc.json','r') as infile:
            wn8pc = json.load(infile)
        output['data'] = wn8pc['data']
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

    #Server validation.
    if server not in ['xbox', 'ps4']:
        output['message'] = 'Wrong server'
        return Response(json.dumps(output), mimetype='application/json')


    #SQL Search.
    user_history_search = userdata_history.query.filter_by(account_id=account_id, server=server).all()

    #If nothing found.
    if len(user_history_search) < 1:
        output['message'] = 'User was not found'
        return Response(json.dumps(output), mimetype='application/json')

    output['data'] = []
    for row in user_history_search:
        output['data'].append(pickle.loads(row.player_data))

    output['count'] = len(output['data'])
    output['status'], output['message'] = 'ok', 'ok'
    output['server'] = server
    output['account_id'] = user_history_search[0].account_id

    return Response(json.dumps(output), mimetype='application/json')


users_to_transfer = []
@app.route('/transfer')
def save_all():
    return(str(users_to_transfer))


if __name__ == '__main__':
    app.run()
