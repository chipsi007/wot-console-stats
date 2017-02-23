from flask import Flask, render_template, request, redirect, url_for, make_response, Response
from flask_sqlalchemy import SQLAlchemy
import requests
import json
import pickle
import datetime


#Importing necessary files.
with open('references/tanks_dict.json','r') as infile:
    tanks_dict = json.load(infile)
with open('references/tankopedia.json','r') as infile:
    tankopedia = json.load(infile)
with open('references/percentiles.json','r') as infile:
    percentiles = json.load(infile)
with open('references/percentiles_generic.json','r') as infile:
    percentiles_generic = json.load(infile)
with open('references/wn8console.json','r') as infile:
    WN8_dict = json.load(infile)


app = Flask(__name__)


#SQL database parameters & classes.
SQLALCHEMY_DATABASE_URI = 'sqlite:///./sql_database.db'
app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
app.config["SQLALCHEMY_POOL_RECYCLE"] = 299
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
class userlog(db.Model):
    __tablename__ = "userlog"
    id = db.Column(db.Integer, primary_key=True)
    nickname = db.Column(db.String(100))
    server = db.Column(db.String(20))
    timestamp = db.Column(db.Integer)
    count = db.Column(db.Integer)

    @classmethod
    def add_entry(cls, nickname, server):
        #Getting current timestamp in UTC
        timestamp = int((datetime.datetime.utcnow()-datetime.datetime(1970,1,1)).total_seconds())
        #Checking if user is already in the database
        logged_user_search = cls.query.filter_by(nickname=nickname, server=server).first()
        #Adding new entry if not found
        if logged_user_search == None:
            action = cls(nickname=nickname, server=server, timestamp=timestamp, count=1)
            db.session.add(action)
        #Updating timestamp and count if found
        else:
            logged_user_search.timestamp = timestamp
            logged_user_search.count = logged_user_search.count + 1
        db.session.commit()
class userdata_history(db.Model):
    __tablename__ = "history"
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.Integer)
    account_id = db.Column(db.Integer)
    nickname = db.Column(db.String(100))
    server = db.Column(db.String(20))
    player_data = db.Column(db.PickleType)

    @classmethod
    def add_or_update(cls, nickname, server, account_id, player_data):
        #Searching for all entries for nickname-server.
        user_history_search = cls.query.filter_by(nickname=nickname, server=server).all()
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
                entry = cls(timestamp = timestamp, account_id=account_id, nickname=nickname, server=server, player_data=player_data)
                db.session.add(entry)
                db.session.commit()
        #If no entries found.
        else:
            timestamp = int((datetime.datetime.utcnow()-datetime.datetime(1970,1,1)).total_seconds())
            entry = userdata_history(timestamp = timestamp, account_id=account_id, nickname=nickname, server=server, player_data=player_data)
            db.session.add(entry)
            db.session.commit()
        return

    @classmethod
    def delete_expired(cls):
        #Setting the period.
        period = 8 * 24 * 60 * 60
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
    def request_cache(cls, nickname, server):
        #Searching by 'nickname'-'server'.
        search = cls.query.filter_by(nickname=nickname, server=server).all()
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


#Class to handle form data.
class form_data:
    def __init__(self, index_of_current_page):
        self.header_clicked = 'none'
        self.nickname = ''
        self.server = 'xbox'
        self.filter_by_50 = 'unchecked'
        self.checkboxes_input = ['wr', 'exp_perc', 'avg_lifetime']
        self.filter_input = []
        self.checkboxes = [['WinRate', 'wr', ''],
                           ['Battles', 'battles', ''],
                           ['WN8', 'wn8', ''],

                           ['Avg Dmg', 'avg_dmg', ''],
                           ['Avg Frags', 'avg_frags', ''],
                           ['Avg Exp', 'avg_exp', ''],

                           ['Avg DPM', 'avg_dpm', ''],
                           ['Avg FPM', 'avg_fpm', ''],
                           ['Avg EPM', 'avg_epm', ''],

                           ['Dmg Percentile', 'dmg_perc', ''],
                           ['WR Percentile', 'wr_perc', ''],
                           ['Exp Percentile', 'exp_perc', ''],

                           ['Penetrated/Hits caused', 'pen_hits_ratio', ''],
                           ['Bounced/Hits received', 'bounced_hits_r', ''],
                           ['Survived', 'survived', ''],

                           ['Total Lifetime', 'total_time', ''],
                           ['Average Lifetime', 'avg_lifetime', ''],
                           ['Last battle time', 'last_time', '']]
        self.checkboxes_filter = [['T7', '7', ''],
                                  ['T4', '4', ''],
                                  ['T1', '1', ''],

                                  ['T8', '8', ''],
                                  ['T5', '5', ''],
                                  ['T2', '2', ''],

                                  ['T9', '9', ''],
                                  ['T6', '6', ''],
                                  ['T3', '3', ''],

                                  ['T10', '10', ''],
                                  ['AT', 'AT-SPG', ''],
                                  ['SPG', 'SPG', ''],

                                  ['HT', 'heavyTank', ''],
                                  ['MT', 'mediumTank', ''],
                                  ['LT', 'lightTank', '']]
        self.top_panel = []
        self.header = [['Player Profile', '/player-profile/', 'not_current'],
                       ['Statistics table', '/statistics-table/', 'not_current'],
                       ['Time Series', '/time-series/', 'not_current'],
                       ['Session Tracker', '/session-tracker/', 'not_current'],
                       ['About', '/about', 'not_current']]
        #Generating header. Using 'index_of_current_page' for highlighting.
        for i, item in enumerate(self.header):
            if i == index_of_current_page:
                item[2] = 'current'

    def request_cookies(self, nickname, server, filter_by_50, checkboxes_input, filter_input):
        if nickname is not None:
            self.nickname = nickname

        if server is not None:
            self.server = server

        #Checkboxes.
        if checkboxes_input is not None:
            self.checkboxes_input = json.loads(checkboxes_input)

        #Loading filter parameters.
        if filter_input is not None:
            self.filter_input = json.loads(filter_input)

        #Filter by 50 battles option.
        if filter_by_50 is not None:
            self.filter_by_50 = filter_by_50

    def generate_checkboxes(self):
        for item in self.checkboxes:
            if item[1] in self.checkboxes_input:
                item[2] = 'checked'
            else:
                item[2] = ''
        for item in self.checkboxes_filter:
            if item[1] in self.filter_input:
                item[2] = 'checked'
            else:
                item[2] = ''
#Class to handle user data.
class user_data:
    def __init__(self, server, nickname):
        self.app_id = 'demo'
        self.server = server
        self.nickname = nickname

    #Search by nickname and server and get account_id.
    def search_by_nickname(self):
        url = 'https://api-' + self.server + '-console.worldoftanks.com/wotx/account/list/?application_id=' + self.app_id + '&search='
        url = url + self.nickname
        request = requests.get(url)
        search_data = request.json()
        #If player found, selecting the first one
        if search_data['status'] == 'ok':
            self.count = search_data['meta']['count']
            if self.count > 0:
                self.status = 'ok'
                self.account_id = search_data['data'][0]['account_id']
                self.nickname = search_data['data'][0]['nickname']
            else:
                self.status = 'error'
                self.message = 'ERROR: No such player found.'
        elif search_data['status'] == 'error':
            self.status = 'error'
            self.message = 'ERROR: ' + str(search_data['error']['message'])

    #Request player data when account_id is known.
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
        action = usercache(timestamp = timestamp, account_id=self.account_id, nickname=self.nickname,
                           server=self.server, player_data=pickle.dumps(self.player_data))
        db.session.add(action)
        db.session.commit()

    #Function to eiter find cached player data or to request and save in cache.
    def request_or_find_cached(self):
        #Using 'usercache' db model classmethod.
        current_user = usercache.request_cache(self.nickname, self.server)
        #If nothing found in SQL 'cache_user_data', searching by nickname and requesting vehicles data.
        if current_user == None:
            self.search_by_nickname()
            #Request vehicle data only if the status is 'ok'.
            if self.status == 'ok':
                self.request_vehicles()
            #Return error If status not 'ok'.
            if self.status != 'ok':
                return
            #SQL operations if all conditions passed.
            if self.status == 'ok':
                #Delete all expired records from SQL 'cache_user_data'.
                usercache.delete_expired_cache()
                #Logging and caching and adding history data point into SQL.
                userlog.add_entry(self.nickname, self.server)
                self.save_to_cache()
                userdata_history.add_or_update(self.nickname, self.server, self.account_id, pickle.dumps(self.player_data))
        #If recent data found in SQL 'cache_user_data'.
        if current_user != None:
            self.status = 'ok'
            self.player_data = pickle.loads(current_user.player_data)
            self.nickname = current_user.nickname
            self.account_id = current_user.account_id
        return

    def filter_data(self, filter_by_50, filter_input, tankopedia):
        #Either 'checked' or 'unchecked'
        filtered_player_data = []
        if filter_by_50 == 'checked':
            for tank in self.player_data:
                if tank['battles'] >= 50:
                    filtered_player_data.append(tank)
            self.player_data = filtered_player_data

        #Processing 'filter_input'.
        filtered_player_data = []
        if 15 > len(filter_input) > 0:
            #Conditions to filter.
            filter_by_tiers = any(i in filter_input for i in ['1','2','3','4','5','6','7','8','9','10'])
            filter_by_classes = any(i in filter_input for i in ['AT-SPG', 'SPG', 'heavyTank', 'mediumTank', 'lightTank'])
            if filter_by_tiers == False:
                filter_input = filter_input + ['1','2','3','4','5','6','7','8','9','10']
            if filter_by_classes == False:
                filter_input = filter_input + ['AT-SPG', 'SPG', 'heavyTank', 'mediumTank', 'lightTank']
            #Iterating through tankopedia.
            for row in tankopedia:
                #Iterating through player data.
                for tank in self.player_data:
                    #If 'tank_id' matches.
                    if tank['tank_id'] == row[0]:
                        #Filtering
                        if row[3] in filter_input and str(row[2]) in filter_input:
                            filtered_player_data.append(tank)
            self.player_data = filtered_player_data
        else:
            return

    def percentile_calculator(self, kind, tank_id, value):
        #If tank is in the pre-calculated table.
        if str(tank_id) in percentiles[kind] and value != 0:
            percentiles_list = percentiles[kind][str(tank_id)]
            #Requesting the list for current tank_id, looking for the closest value and its index.
            closest_value = min(percentiles_list, key=lambda x: abs(x - value))
            index = percentiles_list.index(closest_value)
        #If tank is in tankopedia. Taking the value from generic percentiles.
        elif tank_id in [row[0] for row in tankopedia] and value != 0:
            for row in tankopedia:
                if tank_id == row[0]:
                    tier_class = str(row[2]) + row[3]
                    break
            percentiles_list = percentiles_generic[kind][tier_class]
            closest_value = min(percentiles_list, key=lambda x: abs(x - value))
            index = percentiles_list.index(closest_value)
        #If tank not in tankopedia
        else:
            return(0)

        return(index)

    def wn8_calculator(self, tank_data, WN8_dict):
        #Loading expected values
        exp_values = {}
        for item in WN8_dict['data']:
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

@app.route('/')
def index():
    return redirect(url_for('player_profile'))

@app.route('/player-profile/', methods=["GET", "POST"])
def player_profile():

    #Class to handle 'player_profile' page.
    class player_profile_cls(user_data):
        def __init__(self, server, nickname):
            user_data.__init__(self, server, nickname)
            self.title = 'Player Profile'

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
                wn8_temp = self.wn8_calculator(tank, WN8_dict) * tank['battles']
                #Adding up only if WN8 value is more than 0.
                if wn8_temp > 0:
                    battle_counter = battle_counter + tank['battles']
                    wn8_counter = wn8_counter + wn8_temp

            if battle_counter > 0:
                output_wn8 = int(wn8_counter/battle_counter)
            else:
                output_wn8 = 0.0

            return(output_wn8)

        def wn8_color_picker(self, wn8):
            color_scale = [[-999, 299, 'DARKRED'],
                           [300,449, 'ORANGERED'],
                           [450,649, 'DARKORANGE'],
                           [650,899, 'GOLD'],
                           [900,1199, 'YELLOWGREEN'],
                           [1200,1599, 'LIME'],
                           [1600,1999, 'DEEPSKYBLUE'],
                           [2000,2449, 'DODGERBLUE'],
                           [2450,2899, 'MEDIUMSLATEBLUE'],
                           [2900,99999, 'REBECCAPURPLE']]

            color = 'BLACK'
            for value in color_scale:
                if value[0] <= wn8 < value[1]:
                    color = value[2]

            code = '<font color=\'' + color + '\'>&#10029;</font>'
            return(code)

        def calculate_difference_markers(self, all_time, recent):
            symbols = {'up': '<font color="#89b891">&#9650;</font>',
                       'down': '<font color="#c28080">&#9660;</font>',
                       'straight': '&#9654;'}
            output_dict = {}
            for key, value in all_time.items():
                if key == 'percentiles':
                    continue
                elif recent[key] == 0:
                    output_dict[key] = symbols['straight']
                elif all_time[key] < recent[key]:
                    output_dict[key] = symbols['up']
                elif all_time[key] > recent[key]:
                    output_dict[key] = symbols['down']
                else:
                    output_dict[key] = symbols['straight']
            return(output_dict)

    #Initiating 'form_data' class and requesting cookies.
    form = form_data(0)
    form.checkboxes_filter = [['T1', '1', ''], ['T2', '2', ''], ['T3', '3', ''],
                              ['T4', '4', ''], ['T5', '5', ''], ['T6', '6', ''],
                              ['T7', '7', ''], ['T8', '8', ''], ['T9', '9', ''],
                              ['T10', '10', ''], ['HT', 'heavyTank', ''], ['MT', 'mediumTank', ''],
                              ['LT', 'lightTank', ''], ['AT', 'AT-SPG', ''], ['SPG', 'SPG', '']]
    form.request_cookies(request.cookies.get('nickname'), request.cookies.get('server'), request.cookies.get('filter_by_50'),
                         request.cookies.get('checkboxes_input'), request.cookies.get('filter_input'))

    #Setting defaults.
    return_empty = True
    button = 'Enter the details above and click here to <b>Submit</b>'

    #Checking if there is info in cookies.
    if form.nickname != '' and form.server in ['xbox', 'ps4']:
        return_empty = False

    #If there is new input.
    if request.method == "POST":
        return_empty = False
        form.server, form.nickname = request.form["server"], request.form["nickname"]
        form.filter_input = request.form.getlist('filter_input')

    #Initiating 'time_series_cls'.
    user = player_profile_cls(form.server, form.nickname)

    #Eiter find cached player data or request from API and save into 'usercache'.
    current_user = None
    if return_empty == False:
        user.request_or_find_cached()
        #Return error If status not 'ok'.
        if user.status != 'ok':
            return_empty = True
            button = user.message + ' Click here to <b>submit</b> again.'

    #Placeholders.
    all_time, recent, difference = ({} for i in range(3))
    xlabels, percentiles_totals, wn8_totals = [], [], []

    #Calculations.
    if return_empty == False:

        user.filter_data('unchecked', form.filter_input, tankopedia)
        all_time = user.calculate_general_account_stats(user.player_data)
        all_time['wn8'] = user.calculate_wn8_for_all_tanks(user.player_data)
        all_time['percentiles'] = user.calculate_percentiles_for_all_tanks(user.player_data)
        all_time['total_perc'] = user.calculate_overall_percentile(all_time['percentiles'])

        #Searching all records of the player in SQL 'history' and taking first available.
        user_history_search = userdata_history.query.filter_by(nickname=user.nickname, server=user.server).all()
        if len(user_history_search) > 0:
            user.player_data = user.find_difference(pickle.loads(user_history_search[0].player_data), user.player_data)

        user.filter_data('unchecked', form.filter_input, tankopedia)
        recent = user.calculate_general_account_stats(user.player_data)
        recent['wn8'] = user.calculate_wn8_for_all_tanks(user.player_data)
        recent['percentiles'] = user.calculate_percentiles_for_all_tanks(user.player_data)
        recent['total_perc'] = user.calculate_overall_percentile(recent['percentiles'])

        difference = user.calculate_difference_markers(all_time, recent)
        all_time['wn8_color'] = user.wn8_color_picker(all_time['wn8'])

        #Calculating charts
        xlabels = []
        percentiles_totals, wn8_totals = [], []

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
            user.filter_data('unchecked', form.filter_input, tankopedia)
            #Calculating Percentile totals.
            percentiles_totals.append(user.calculate_percentiles_for_all_tanks(user.player_data))
            #Calculating WN8 totals.
            wn8_totals.append(user.calculate_wn8_for_all_tanks(user.player_data))

        new_list = []
        for item in percentiles_totals:
            new_list.append(sum([value for key, value in item.items()])/5)
        percentiles_totals = json.dumps(new_list)
        xlabels = json.dumps(xlabels)

    #Generating output.
    if return_empty == False:
        form.nickname = user.nickname
        button = 'Found data for <b>'+str(user.nickname)+'</b> &nbsp;Click here to <b>resubmit</b>'

    #Making response & assigning cookies.
    form.generate_checkboxes()
    response = make_response(render_template("player-profile.html", title=user.title, top_panel=form.top_panel, header=form.header,
                                                                    button=button,
                                                                    nickname=form.nickname, server=form.server,
                                                                    checkboxes_filter=form.checkboxes_filter,

                                                                    all_time=all_time, recent=recent, difference=difference,
                                                                    xlabels=xlabels, percentiles_totals=percentiles_totals, wn8_totals=wn8_totals))
    #Assigning cookies if not empty.
    if return_empty == False:
        expire_date = datetime.datetime.now() + datetime.timedelta(days=7)
        response.set_cookie('nickname', form.nickname, expires=expire_date)
        response.set_cookie('server', form.server, expires=expire_date)
        response.set_cookie('filter_input', json.dumps(form.filter_input), expires=expire_date)

    return response

@app.route('/statistics-table/', methods=["GET", "POST"])
def statistics_table():

    #Class to handle 'statistics_table' page.
    class statistics_table_cls(user_data):
        def __init__(self, server, nickname):
            user_data.__init__(self, server, nickname)
            self.title = 'Statistics table'

        def extract_needed_data(self, checkboxes, checkbox_input):
            extracted_data = []
            #Asembling the header.
            header = ['tank_id']
            #Control order of columns.
            header_elements = [row[1] for row in checkboxes]
            for element in header_elements:
                for item in checkbox_input:
                    if element == item:
                        header.append(item)
            extracted_data.append(header)
            #Extracting the data.
            for vehicle in self.player_data:
                #Creating the row.
                temp_list = []
                #Appending default data.
                temp_list.append(vehicle['tank_id'])
                #Requesting items from 'checkbox_input'.
                if 'wr' in checkbox_input:
                    temp_list.append(vehicle['wins']/vehicle['battles'])
                if 'battles' in checkbox_input:
                    temp_list.append(vehicle['battles'])
                if 'wn8' in checkbox_input:
                    temp_list.append(self.wn8_calculator(vehicle, WN8_dict))
                if 'avg_dmg' in checkbox_input:
                    temp_list.append(vehicle['damage_dealt']/vehicle['battles'])
                if 'avg_frags' in checkbox_input:
                    temp_list.append(vehicle['frags']/vehicle['battles'])
                if 'avg_exp' in checkbox_input:
                    temp_list.append(vehicle['xp']/vehicle['battles'])
                if 'avg_dpm' in checkbox_input:
                    if vehicle['battle_life_time'] > 0:
                        temp_list.append(vehicle['damage_dealt'] / vehicle['battle_life_time'] * 60)
                    else:
                        temp_list.append(0)
                if 'avg_fpm' in checkbox_input:
                    if vehicle['battle_life_time'] > 0:
                        temp_list.append(vehicle['frags'] / vehicle['battle_life_time'] * 60)
                    else:
                        temp_list.append(0)
                if 'avg_epm' in checkbox_input:
                    if vehicle['battle_life_time'] > 0:
                        temp_list.append(vehicle['xp'] / vehicle['battle_life_time'] * 60)
                    else:
                        temp_list.append(0)
                if 'dmg_perc' in checkbox_input:
                    value = vehicle['damage_dealt']/vehicle['battles']
                    perc = self.percentile_calculator('dmgc', vehicle['tank_id'], value)
                    temp_list.append(perc)
                if 'wr_perc' in checkbox_input:
                    value = vehicle['wins']/vehicle['battles']*100
                    perc = self.percentile_calculator('wr', vehicle['tank_id'], value)
                    temp_list.append(perc)
                if 'exp_perc' in checkbox_input:
                    value = vehicle['xp']/vehicle['battles']
                    perc = self.percentile_calculator('exp', vehicle['tank_id'], value)
                    temp_list.append(perc)
                if 'pen_hits_ratio' in checkbox_input:
                    if vehicle['hits'] > 0:
                        temp_list.append(vehicle['piercings'] / vehicle['hits'])
                    else:
                        temp_list.append(0)
                if 'bounced_hits_r' in checkbox_input:
                    if vehicle['direct_hits_received'] > 0:
                        temp_list.append(vehicle['no_damage_direct_hits_received'] / vehicle['direct_hits_received'])
                    else:
                        temp_list.append(0)
                if 'survived' in checkbox_input:
                    temp_list.append(vehicle['survived_battles']/vehicle['battles'])
                if 'total_time' in checkbox_input:
                    temp_list.append(vehicle['battle_life_time'] / 60)
                if 'avg_lifetime' in checkbox_input:
                    temp_list.append(vehicle['battle_life_time'] / vehicle['battles'])
                if 'last_time' in checkbox_input:
                    temp_list.append(vehicle['last_battle_time'])

                #Appending row (temp_list) to data.
                extracted_data.append(temp_list)
            self.player_data = extracted_data

        def name_headers(self, checkboxes):
            new_headers = []
            for header in self.player_data[0]:
                if header == 'tank_id':
                    header = 'Tank'

                for item in checkboxes:
                    if header == item[1]:
                        header = item[0]
                new_headers.append(header)
            self.player_data[0] = new_headers

        def name_tanks(self, tanks_dict):
            #Headers.
            new_data = [self.player_data[0]]
            #Data.
            for row in self.player_data[1:]:
                temp_list = []
                #Checking if the name is in the dict.
                if str(row[0]) in tanks_dict:
                    name = tanks_dict[str(row[0])]
                else:
                    name = 'Unknown'
                #Appending name.
                temp_list.append(name)
                #Appending what's left.
                [temp_list.append(item) for item in row[1:]]
                #Adding to the rest of the data.
                new_data.append(temp_list)
            self.player_data = new_data

    #Initializing 'form_data'.
    form = form_data(1)
    #Requesting cookies.
    form.request_cookies(request.cookies.get('nickname'), request.cookies.get('server'), request.cookies.get('filter_by_50'),
                         request.cookies.get('checkboxes_input'), request.cookies.get('filter_input'))

    #Setting defaults.
    return_empty = True
    button = 'Enter the details above and click here to <b>Submit</b>'

    if request.method == "POST":
        return_empty = False
        #Collecting form items.
        form.server, form.nickname = request.form['server'], request.form['nickname']
        form.checkboxes_input = request.form.getlist('checkboxes_input')
        form.filter_input = request.form.getlist('filter_input')
        form.filter_by_50 = request.form['filter_by_50'] if 'filter_by_50' in request.form else ''

    #Initiating 'statistics_table_cls'.
    user = statistics_table_cls(form.server, form.nickname)

    #Eiter find cached player data or request from API and save into 'usercache'.
    current_user = None
    if return_empty == False:
        user.request_or_find_cached()
        #Return error If status not 'ok'.
        if user.status != 'ok':
            return_empty = True
            button = user.message + ' Click here to <b>submit</b> again.'

    #Calculations.
    table_array = ''
    if return_empty == False:
        #Filtering and extracting data based on checkbox_input.
        user.filter_data(form.filter_by_50, form.filter_input, tankopedia)
        user.extract_needed_data(form.checkboxes, form.checkboxes_input)
        #Naming headers and tanks.
        user.name_tanks(tanks_dict)
        #Generating output.
        table_array = json.dumps(user.player_data)
        button = 'Found data for <b>'+str(user.nickname)+'</b> &nbsp;Click here to <b>resubmit</b> or any of the headers to sort by column'

    #Generating output.
    form.nickname = user.nickname
    form.generate_checkboxes()
    response = make_response(render_template("statistics-table.html", title=user.title, top_panel=form.top_panel, header=form.header,
                                                                      nickname=form.nickname, server=form.server, filter_by_50=form.filter_by_50,
                                                                      checkboxes=form.checkboxes, checkboxes_filter=form.checkboxes_filter,
                                                                      button=button, table_array=table_array))

    #Assigning cookies.
    if return_empty == False:
        expire_date = datetime.datetime.now() + datetime.timedelta(days=7)
        response.set_cookie('nickname', form.nickname, expires=expire_date)
        response.set_cookie('server', form.server, expires=expire_date)
        response.set_cookie('filter_by_50', form.filter_by_50, expires=expire_date)
        response.set_cookie('checkboxes_input', json.dumps(form.checkboxes_input), expires=expire_date)
        response.set_cookie('filter_input', json.dumps(form.filter_input), expires=expire_date)

    return response

@app.route('/time-series/', methods=["GET", "POST"])
def time_series():

    #Class to handle 'time_series' page.
    class time_series_cls(user_data):
        def __init__(self, server, nickname):
            user_data.__init__(self, server, nickname)
            self.title = 'Time Series'

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
                wn8_temp = self.wn8_calculator(tank, WN8_dict) * tank['battles']
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
                self.filter_data('unchecked', filter_input, tankopedia)
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

    #Initiating 'form_data' class and requesting cookies.
    form = form_data(2)
    form.checkboxes_filter = [['T1', '1', ''], ['T2', '2', ''], ['T3', '3', ''],
                              ['T4', '4', ''], ['T5', '5', ''], ['T6', '6', ''],
                              ['T7', '7', ''], ['T8', '8', ''], ['T9', '9', ''],
                              ['T10', '10', ''], ['HT', 'heavyTank', ''], ['MT', 'mediumTank', ''],
                              ['LT', 'lightTank', ''], ['AT', 'AT-SPG', ''], ['SPG', 'SPG', '']]
    form.request_cookies(request.cookies.get('nickname'), request.cookies.get('server'), request.cookies.get('filter_by_50'),
                         request.cookies.get('checkboxes_input'), request.cookies.get('filter_input'))

    #Setting defaults.
    return_empty = True
    button = 'Enter the details above and click here to <b>Submit</b>'

    #Checking if there is info in cookies.
    if form.nickname != '' and form.server in ['xbox', 'ps4']:
        return_empty = False

    #If there is new input.
    if request.method == "POST":
        return_empty = False
        form.server, form.nickname = request.form["server"], request.form["nickname"]
        form.filter_input = request.form.getlist('filter_input')

    #Initiating 'time_series_cls'.
    user = time_series_cls(form.server, form.nickname)

    #Eiter find cached player data or request from API and save into 'usercache'.
    current_user = None
    if return_empty == False:
        user.request_or_find_cached()
        #Return error If status not 'ok'.
        if user.status != 'ok':
            return_empty = True
            button = user.message + ' Click here to <b>submit</b> again.'

    #Placeholders.
    percentiles_change, x_labels = ([] for i in range(2))
    wn8_totals, wn8_change, wn8_labels = ([] for i in range(3))

    #Calculations.
    if return_empty == False:
        #Searching all records of the player in SQL 'history'.
        user_history_search = userdata_history.query.filter_by(nickname=user.nickname, server=user.server).all()
        #Calculating WN8 charts.
        user.calculate_charts(user_history_search, form.filter_input, tankopedia)
        #Variables for export.
        #1st tab (nonexistent)
        x_labels = json.dumps(user.xlabels)
        #2nd tab
        percentiles_change = user.percentiles_change
        #3rd tab
        wn8_totals = json.dumps(user.wn8_totals[1:])
        wn8_change = json.dumps(user.wn8_change)
        wn8_labels = json.dumps(user.xlabels[1:])

    #Generating output.
    if return_empty == False:
        form.nickname = user.nickname
        button = 'Found data for <b>'+str(user.nickname)+'</b> &nbsp;Click here to <b>resubmit</b>'

    #Making response & assigning cookies.
    form.generate_checkboxes()
    response = make_response(render_template("time-series.html", title=user.title, top_panel=form.top_panel, header=form.header,
                                                                 button=button,
                                                                 nickname=form.nickname, server=form.server,
                                                                 checkboxes_filter=form.checkboxes_filter,
                                                                 percentiles_change=percentiles_change, x_labels=x_labels,
                                                                 wn8_totals=wn8_totals, wn8_change=wn8_change, wn8_labels=wn8_labels))
    #Assigning cookies if not empty.
    if return_empty == False:
        expire_date = datetime.datetime.now() + datetime.timedelta(days=7)
        response.set_cookie('nickname', form.nickname, expires=expire_date)
        response.set_cookie('server', form.server, expires=expire_date)
        response.set_cookie('filter_input', json.dumps(form.filter_input), expires=expire_date)

    return response

@app.route('/session-tracker/', methods=["GET", "POST"])
def session_tracker():

    #Class to handle 'session_tracker' page.
    class session_tracker_cls(user_data):
        def __init__(self, server, nickname, selected_radio):
            user_data.__init__(self, server, nickname)
            self.request = selected_radio
            self.title = 'Session tracker'

        def convert_seconds_to_str(self, seconds):
            if seconds >= 60:
                m = int(seconds/60)
                s = int(seconds - m * 60)
                return(str(m) + 'm ' + str(s) + 's')
            else:
                return(str(int(seconds)) + 's')

    #Requesting cookies.
    form = form_data(3)
    form.request = ''
    form.request_cookies(request.cookies.get('nickname'), request.cookies.get('server'), request.cookies.get('filter_by_50'),
                         request.cookies.get('checkboxes_input'), request.cookies.get('filter_input'))

    #Setting defaults.
    return_empty = True
    button = '<strong>Submit</strong>'
    history_checkpoints =  [['', 'XX', 0], ['', 'XX', 0], ['', 'XX', 0], ['', 'XX', 0], ['', 'XX', 0], ['', 'XX', 0], ['', 'XX', 0]]

    if request.method == "POST":
        form.server, form.nickname = request.form["server"], request.form["nickname"]
        form.request = request.form['checkpoints'] if 'checkpoints' in request.form else ''
        return_empty = False


    #Initiating 'session_tracker_cls'.
    user = session_tracker_cls(form.server, form.nickname, form.request)


    #Eiter find cached player data or request from API and save into 'usercache'.
    current_user = None
    if return_empty == False:
        user.request_or_find_cached()
        #Return error If status not 'ok'.
        if user.status != 'ok':
            return_empty = True
            button = user.message + ' Click here to <b>submit</b> again.'


    #Calling all 'userdata_history' datapoints to show in the form.
    if user.nickname != '':
        search = userdata_history.query.filter_by(nickname=user.nickname, server=user.server).all()
        if len(search) > 0:
            for row in search:
                timedelta = datetime.datetime.utcnow().date() - datetime.datetime.utcfromtimestamp(row.timestamp).date()
                #Passing data points that are older than today.
                if 8 > timedelta.days > 0:
                    history_checkpoints[int(timedelta.days)-1] = [timedelta.days, str(timedelta.days) + 'd', row.timestamp]

    #If user is found, but the checkpoint is not selected.
    if return_empty == False and user.request == '':
        return_empty = True
        button = 'Found data for <b>' + user.nickname + '</b>, please select the checkpoint. If no checkpoints available, come tomorrow to see your statistics.'


    #Placeholders.
    session_tanks = []
    if return_empty == False:
        user.snapshot_data = []
        session_tanks = []
        button = 'Must be an error. Please reload the page.'

    #Request to compare with history point.
    if return_empty == False:
        timestamp_to_search = None
        for row in  history_checkpoints:
            if user.request == str(row[0]):
                timestamp_to_search = row[2]

        if timestamp_to_search == None:
            button = 'No such checkpoint exist.'
            return_empty = True
        else:
            search = userdata_history.query.filter_by(nickname=user.nickname, server=user.server, timestamp=timestamp_to_search).first()
            user.snapshot_data = pickle.loads(search.player_data)
            button = 'Viewing last ' + str(user.request) + ' day(s) of player statistics.'

    #Calculations.
    if return_empty == False:
        #Deleteting tanks from 'snapshot_data' that were not played.
        for tank in user.player_data:
            for s, snapshot_tank in enumerate(user.snapshot_data):
                if tank['tank_id'] == snapshot_tank['tank_id'] and tank['battles'] == snapshot_tank['battles']:
                    user.snapshot_data.pop(s)

        #Deleting tanks from 'player_data' that aren't in filtered 'snapshot_data'.
        snapshot_tank_ids = [tank['tank_id'] for tank in user.snapshot_data]
        temp_list = []
        for tank_id in snapshot_tank_ids:
            for tank in user.player_data:
                if tank['tank_id'] == tank_id:
                    temp_list.append(tank)
        user.player_data = temp_list

        #Finding difference.
        for s_tank in user.snapshot_data:
            for c_tank in user.player_data:
                if s_tank['tank_id'] == c_tank['tank_id']:
                    for key, value in c_tank.items():
                        s_tank[key] = value - s_tank[key]
                    s_tank['tank_id'] = c_tank['tank_id']

        #List for output.
        session_tanks = []
        #Calculating data.
        for s_tank in user.snapshot_data:
            for a_tank in user.player_data:
                if s_tank['tank_id'] == a_tank['tank_id']:

                    #Creating a dictionary.
                    temp_dict = {}

                    #For 'radar_all'.
                    temp_dict['dmgc_all'] = a_tank['damage_dealt'] / a_tank['battles']
                    temp_dict['exp_all'] = a_tank['xp'] / a_tank['battles']
                    temp_dict['rass_all'] = a_tank['damage_assisted_radio'] / a_tank['battles']
                    temp_dict['dmgr_all'] = a_tank['damage_received'] / a_tank['battles']
                    if a_tank['shots'] > 0:
                        temp_dict['acc_all'] = a_tank['hits'] / a_tank['shots'] * 100
                    else:
                        temp_dict['acc_all'] = 0.0

                    dmgc_perc, exp_perc, rass_perc, dmgr_perc, acc_perc = (0.0 for i in range(5))
                    dmgc_perc = user.percentile_calculator('dmgc', a_tank['tank_id'], temp_dict['dmgc_all'])
                    exp_perc = user.percentile_calculator('exp', a_tank['tank_id'], temp_dict['exp_all'])
                    rass_perc = user.percentile_calculator('rass', a_tank['tank_id'], temp_dict['rass_all'])
                    dmgr_perc = user.percentile_calculator('dmgr', a_tank['tank_id'], temp_dict['dmgr_all'])
                    acc_perc = user.percentile_calculator('acc', a_tank['tank_id'], temp_dict['acc_all'])

                    temp_dict['radar_all'] = json.dumps([round(acc_perc, 2), round(dmgc_perc, 2), round(rass_perc, 2),
                                                         round(exp_perc, 2), abs(round(dmgr_perc, 2)-100)])

                    #For 'radar_session'.
                    temp_dict['dmgc_session'] = s_tank['damage_dealt'] / s_tank['battles']
                    temp_dict['exp_session'] = s_tank['xp'] / s_tank['battles']
                    temp_dict['rass_session'] = s_tank['damage_assisted_radio'] / s_tank['battles']
                    temp_dict['dmgr_session'] = s_tank['damage_received'] / s_tank['battles']
                    if s_tank['shots'] > 0:
                        temp_dict['acc_session'] = s_tank['hits'] / s_tank['shots'] * 100
                    else:
                        temp_dict['acc_session'] = 0.0

                    dmgc_perc, exp_perc, rass_perc, dmgr_perc, acc_perc = (0.0 for i in range(5))
                    dmgc_perc = user.percentile_calculator('dmgc', s_tank['tank_id'], temp_dict['dmgc_session'])
                    exp_perc = user.percentile_calculator('exp', s_tank['tank_id'], temp_dict['exp_session'])
                    rass_perc = user.percentile_calculator('rass', s_tank['tank_id'], temp_dict['rass_session'])
                    dmgr_perc = user.percentile_calculator('dmgr', s_tank['tank_id'], temp_dict['dmgr_session'])
                    acc_perc = user.percentile_calculator('acc', s_tank['tank_id'], temp_dict['acc_session'])

                    temp_dict['radar_session'] = json.dumps([round(acc_perc, 2), round(dmgc_perc, 2), round(rass_perc, 2),
                                                             round(exp_perc, 2), abs(round(dmgr_perc, 2)-100)])

                    #Other values.
                    temp_dict['tank_id'] = a_tank['tank_id']
                    if str(temp_dict['tank_id']) in tanks_dict:
                        temp_dict['tank_name'] = tanks_dict[str(temp_dict['tank_id'])]
                    else:
                        temp_dict['tank_name'] = 'Unknown'

                    temp_dict['battles_session'] = s_tank['battles']
                    temp_dict['wins_session'] = s_tank['wins']

                    temp_dict['lifetime_session'] = user.convert_seconds_to_str(s_tank['battle_life_time']/s_tank['battles'])
                    temp_dict['lifetime_all'] = user.convert_seconds_to_str(a_tank['battle_life_time']/a_tank['battles'])

                    temp_dict['dpm_session'] = s_tank['damage_dealt'] / s_tank['battle_life_time']*60
                    temp_dict['dpm_all'] = a_tank['damage_dealt'] / a_tank['battle_life_time']*60

                    temp_dict['wn8_session'] = user.wn8_calculator(s_tank, WN8_dict)
                    temp_dict['wn8_all'] = user.wn8_calculator(a_tank, WN8_dict)

                    #Appending dictionary.
                    session_tanks.append(temp_dict)

        #If data didn't change.
        if len(session_tanks) < 1:
            button = 'No tanks were played.'

    radar_names = ['Accuracy', 'Damage Caused', 'Radio Assist', 'Experience', 'Damage Received (inv)']


    #Generating output.
    form.nickname, form.server = user.nickname, user.server
    response = make_response(render_template("session-tracker.html", title=user.title, top_panel=form.top_panel, header=form.header,
                                                                     button=button,
                                                                     nickname=form.nickname, server=form.server,
                                                                     session_tanks=session_tanks,
                                                                     radar_names=radar_names,
                                                                     history_checkpoints=history_checkpoints))
    #Assigning cookies.
    if return_empty == False:
        expire_date = datetime.datetime.now() + datetime.timedelta(days=7)
        response.set_cookie('nickname', form.nickname, expires=expire_date)
        response.set_cookie('server', form.server, expires=expire_date)
    return response

@app.route('/about')
def about():

    form = form_data(4)

    return render_template("about.html", title='About', top_panel=form.top_panel, header=form.header)

@app.route('/export/<export_type>/<server>/<nickname>/')
def export(export_type, server, nickname):

    class export_table_cls(user_data):
        def __init__(self, server, nickname):
            user_data.__init__(self, server, nickname)
            self.checkboxes = [['tier', 'tier', ''],
                               ['class', 'class', ''],
                               ['winrate', 'wr', ''],
                               ['battles', 'battles', ''],
                               ['wn8console', 'wn8', ''],
                               ['wn8pc', 'wn8pc', ''],

                               ['Average Damage per battle', 'avg_dmg', ''],
                               ['Avg Frags per battle', 'avg_frags', ''],
                               ['Avg Experience per battle', 'avg_exp', ''],

                               ['Avg Damage Per Minute', 'avg_dpm', ''],
                               ['Avg Frags Per Minute', 'avg_fpm', ''],
                               ['Avg Experience Per Minute', 'avg_epm', ''],

                               ['Damage Percentile', 'dmg_perc', ''],
                               ['Winrate Percentile', 'wr_perc', ''],
                               ['Experience per battle Percentile', 'exp_perc', ''],

                               ['Penetrated Hits caused Ratio', 'pen_hits_ratio', ''],
                               ['Bounced Hits received Ratio', 'bounced_hits_r', ''],
                               ['Survived', 'survived', ''],

                               ['Total Lifetime minutes', 'total_time', ''],
                               ['Average Lifetime seconds', 'avg_lifetime', ''],
                               ['Last battle time (UNIX timestamp)', 'last_time', '']]

        def extract_needed_data(self):
            extracted_data = []
            #Asembling the header.
            header = ['tank_id']
            #Control order of columns.
            header_elements = [row[1] for row in self.checkboxes]
            checkbox_input = header_elements
            for element in header_elements:
                for item in checkbox_input:
                    if element == item:
                        header.append(item)
            extracted_data.append(header)
            #Extracting the data.
            for vehicle in self.player_data:
                #creating a row
                temp_list = []
                #appending default data
                temp_list.append(vehicle['tank_id'])
                #requesting items from checkbox_input
                if 'tier' in checkbox_input:
                    tier = 0
                    for row in tankopedia:
                        if row[0] == vehicle['tank_id']:
                            tier = row[2]
                    temp_list.append(tier)
                if 'class' in checkbox_input:
                    v_class = 'unknown'
                    for row in tankopedia:
                        if row[0] == vehicle['tank_id']:
                            v_class = row[3]
                    temp_list.append(v_class)
                if 'wr' in checkbox_input:
                    temp_list.append(vehicle['wins']/vehicle['battles'])
                if 'battles' in checkbox_input:
                    temp_list.append(vehicle['battles'])
                if 'wn8' in checkbox_input:
                    temp_list.append(self.wn8_calculator(vehicle, WN8_dict))
                if 'wn8pc' in checkbox_input:
                    temp_list.append(self.wn8_calculator(vehicle, wn8pc))
                if 'avg_dmg' in checkbox_input:
                    temp_list.append(vehicle['damage_dealt']/vehicle['battles'])
                if 'avg_frags' in checkbox_input:
                    temp_list.append(vehicle['frags']/vehicle['battles'])
                if 'avg_exp' in checkbox_input:
                    temp_list.append(vehicle['xp']/vehicle['battles'])
                if 'avg_dpm' in checkbox_input:
                    if vehicle['battle_life_time'] > 0:
                        temp_list.append(vehicle['damage_dealt'] / vehicle['battle_life_time'] * 60)
                    else:
                        temp_list.append(0)
                if 'avg_fpm' in checkbox_input:
                    if vehicle['battle_life_time'] > 0:
                        temp_list.append(vehicle['frags'] / vehicle['battle_life_time'] * 60)
                    else:
                        temp_list.append(0)
                if 'avg_epm' in checkbox_input:
                    if vehicle['battle_life_time'] > 0:
                        temp_list.append(vehicle['xp'] / vehicle['battle_life_time'] * 60)
                    else:
                        temp_list.append(0)
                if 'dmg_perc' in checkbox_input:
                    value = vehicle['damage_dealt']/vehicle['battles']
                    perc = self.percentile_calculator('dmgc', vehicle['tank_id'], value)
                    temp_list.append(perc)
                if 'wr_perc' in checkbox_input:
                    value = vehicle['wins']/vehicle['battles']*100
                    perc = self.percentile_calculator('wr', vehicle['tank_id'], value)
                    temp_list.append(perc)
                if 'exp_perc' in checkbox_input:
                    value = vehicle['xp']/vehicle['battles']
                    perc = self.percentile_calculator('exp', vehicle['tank_id'], value)
                    temp_list.append(perc)
                if 'pen_hits_ratio' in checkbox_input:
                    if vehicle['hits'] > 0:
                        temp_list.append(vehicle['piercings'] / vehicle['hits'])
                    else:
                        temp_list.append(0)
                if 'bounced_hits_r' in checkbox_input:
                    if vehicle['direct_hits_received'] > 0:
                        temp_list.append(vehicle['no_damage_direct_hits_received'] / vehicle['direct_hits_received'])
                    else:
                        temp_list.append(0)
                if 'survived' in checkbox_input:
                    temp_list.append(vehicle['survived_battles']/vehicle['battles'])
                if 'total_time' in checkbox_input:
                    temp_list.append(vehicle['battle_life_time'] / 60)
                if 'avg_lifetime' in checkbox_input:
                    temp_list.append(vehicle['battle_life_time'] / vehicle['battles'])
                if 'last_time' in checkbox_input:
                    temp_list.append(vehicle['last_battle_time'])

                #appending row (temp_list) to data
                extracted_data.append(temp_list)
            self.player_data = extracted_data

        def name_headers(self):
            new_headers = []
            for header in self.player_data[0]:
                if header == 'tank_id':
                    header = 'Tank'

                for item in self.checkboxes:
                    if header == item[1]:
                        header = item[0]
                new_headers.append(header)
            self.player_data[0] = new_headers

        def name_tanks(self, tanks_dict):
            #Headers.
            new_data = [self.player_data[0]]
            #Data.
            for row in self.player_data[1:]:
                temp_list = []
                #Checking if the name is in the dict.
                if str(row[0]) in tanks_dict:
                    name = tanks_dict[str(row[0])].replace(',','')
                else:
                    name = 'Unknown'
                #Appending name.
                temp_list.append(name)
                #Appending what's left.
                [temp_list.append(item) for item in row[1:]]
                #Adding to the rest of the data.
                new_data.append(temp_list)
            self.player_data = new_data

        def convert_to_csv(self):
            text = ''
            for row in self.player_data:
                for cell in row:
                    text = text + str(cell) + ', '
                text = text + '\n'
            return(text)

    #If request is to export WN8 table.
    if export_type == 'wn8':
        user = export_table_cls(None, None)
        wn8_list = []
        wn8_list.append(['Name', 'Tier', 'Class', 'Nation', 'expDamage', 'expDef', 'expFrag', 'expSpot', 'expWinRate'])
        for tank in WN8_dict['data']:
            if len(tank) > 0:
                for row in tankopedia:
                    if row[0] == tank['IDNum']:
                        wn8_row = [row[1].replace(',',''), row[2], row[3], row[4],
                                   tank['expDamage'], tank['expDef'], tank['expFrag'], tank['expSpot'], tank['expWinRate']]
                        wn8_list.append(wn8_row)
                        break

        user.player_data = wn8_list
        return Response(user.convert_to_csv(), mimetype='text/csv')

    #Validation.
    if server in ['xbox', 'ps4'] and export_type in ['csv', 'json']:
        return_empty = False
    else:
        return_empty = True
        message = 'Wrong server or export type.'

    #Requesting player data.
    if return_empty == False:
        #Initiating 'tanks_table_cls'.
        user = export_table_cls(server, nickname)
        #Either find cached player data or request from API and save into 'usercache'.
        user.request_or_find_cached()
        #Return error If status not 'ok'.
        if user.status != 'ok':
            return_empty = True
            message = user.message

    #Calculations.
    if return_empty == False:
        #Loading WN8 Pc dictionary.
        with open('references/wn8pc.json','r') as infile:
            wn8pc = json.load(infile)
        user.extract_needed_data()
        user.name_headers()
        user.name_tanks(tanks_dict)

    #Generating response.
    if export_type == 'csv' and return_empty == False:
        return Response(user.convert_to_csv(), mimetype='text/csv')
    if export_type == 'json' and return_empty == False:
        return Response(json.dumps(user.player_data), mimetype='application/json')
    else:
        return(message)


if __name__ == '__main__':
    app.run()
