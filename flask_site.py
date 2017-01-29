from flask import Flask, render_template, request, redirect, url_for, make_response
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
    gamertag = db.Column(db.String(100))
    server = db.Column(db.String(20))
    timestamp = db.Column(db.Integer)
    count = db.Column(db.Integer)

    @classmethod
    def add_entry(cls, gamertag, server):
        #Getting current timestamp in UTC
        timestamp = int((datetime.datetime.utcnow()-datetime.datetime(1970,1,1)).total_seconds())
        #Checking if user is already in the database
        logged_user_search = cls.query.filter_by(gamertag=gamertag, server=server).first()
        #Adding new entry if not found
        if logged_user_search == None:
            action = cls(gamertag=gamertag, server=server, timestamp=timestamp, count=1)
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
    player_id = db.Column(db.Integer)
    gamertag = db.Column(db.String(100))
    server = db.Column(db.String(20))
    player_data = db.Column(db.PickleType)

    @classmethod
    def add_or_update(cls, gamertag, server, account_id, player_data):
        #Searching for all entries for gamertag-server.
        user_history_search = cls.query.filter_by(gamertag=gamertag, server=server).all()
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
                entry = cls(timestamp = timestamp, player_id=account_id, gamertag=gamertag, server=server, player_data=player_data)
                db.session.add(entry)
                db.session.commit()
        #If no entries found.
        else:
            timestamp = int((datetime.datetime.utcnow()-datetime.datetime(1970,1,1)).total_seconds())
            entry = userdata_history(timestamp = timestamp, player_id=account_id, gamertag=gamertag, server=server, player_data=player_data)
            db.session.add(entry)
            db.session.commit()
        return
class usercache(db.Model):
    __tablename__ = "usercache"
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.Integer)
    player_id = db.Column(db.Integer)
    gamertag = db.Column(db.String(100))
    server = db.Column(db.String(20))
    player_data = db.Column(db.PickleType)

    @classmethod
    def request_cache(cls, playername, server):
        #Searching by 'playername'-'server'.
        search = cls.query.filter_by(gamertag=playername, server=server).all()
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
        #Searching for all entries for gamertag-server which are older than 5 minutes.
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

#Class to handle user data.
class user_data:
    def __init__(self, app_id, server, gamertag):
        self.app_id = app_id
        self.server = server
        self.gamertag = gamertag

    def search_by_playername(self):
        url = 'https://api-' + self.server + '-console.worldoftanks.com/wotx/account/list/?application_id=' + self.app_id + '&search='
        url = url + self.gamertag
        request = requests.get(url)
        search_data = request.json()
        #If player found, selecting the first one
        if search_data['status'] == 'ok':
            self.count = search_data['meta']['count']
            if self.count > 0:
                self.status = 'ok'
                self.account_id = search_data['data'][0]['account_id']
                self.gamertag = search_data['data'][0]['nickname']
            else:
                self.status = 'error'
                self.message = 'ERROR: No such player found.'
        elif search_data['status'] == 'error':
            self.status = 'error'
            self.message = 'ERROR: ' + str(search_data['error']['message'])

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
            return()

    def percentile_calculator(self, kind, tank_id, value):

        def float_range(start, stop, step=1.0):
            ''' "range()" like function which accept float type'''
            i = start
            while i < stop:
                yield i
                i += step

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
            #creating a row
            temp_list = []
            #appending default data
            temp_list.append(vehicle['tank_id'])
            #requesting items from checkbox_input
            if 'wr' in checkbox_input:
                temp_list.append(vehicle['wins']/vehicle['battles'])
            if 'battles' in checkbox_input:
                temp_list.append(vehicle['battles'])
            if 'survived' in checkbox_input:
                temp_list.append(vehicle['survived_battles']/vehicle['battles'])
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
            if 'he_received' in checkbox_input:
                if vehicle['direct_hits_received'] > 0:
                    temp_list.append(vehicle['explosion_hits_received'] / vehicle['direct_hits_received'])
                else:
                    temp_list.append(0)
            if 'total_time' in checkbox_input:
                temp_list.append(vehicle['battle_life_time'] / 60)
            if 'avg_lifetime' in checkbox_input:
                temp_list.append(vehicle['battle_life_time'] / vehicle['battles'])
            if 'last_time' in checkbox_input:
                temp_list.append(vehicle['last_battle_time'])

            #appending row (temp_list) to data
            extracted_data.append(temp_list)
        self.player_data = extracted_data

    def find_sorting_column(self, header_clicked, checkboxes):
        initial_col_name = 'none'
        self.sorting_index = 0

        #looking for intial column name (codename)
        for item in checkboxes:
            if item[0] == header_clicked:
                initial_col_name = item[1]

        #looking for index in the data
        for i, item in enumerate(self.player_data[0]):
            if item == initial_col_name:
                self.sorting_index = i

    def sort(self):
        #Separing headers.
        headers = self.player_data[0]
        data = self.player_data[1:]

        #Creating final list.
        processed_list = []
        processed_list.append(headers)

        #Picking items from every row based on 'sorting_index'.
        sorted_list = [row[self.sorting_index] for row in data]
        #Sorting the list.
        sorted_list = sorted(sorted_list, reverse=True)

        #Appending other items.
        temp_list = []
        for item in sorted_list:
            for r, row in enumerate(data):
                if item == row[self.sorting_index]:
                    processed_list.append(row)
                    #Deleting the row in case there are rows with equal values.
                    data.pop(r)

        self.player_data = processed_list

    def make_data_readable(self):
        final_data = []
        interim_data = []
        #Transposing into columns.
        for column in zip(*self.player_data):
            #Appending header.
            temp_list = [column[0]]
            #Round with 0 decimals.
            if column[0] == 'avg_dmg' or column[0] == 'avg_exp' or column[0] == 'avg_dpm' or column[0] == 'avg_epm':
                for item in column[1:]:
                    temp_list.append(int(round(item, 0)))
            #Round with 2 decimals.
            elif column[0] == 'avg_frags' or column[0] == 'avg_fpm':
                for item in column[1:]:
                    temp_list.append(round(item, 2))
            #Percent with 0 decimals.
            elif column[0] == 'pen_hits_ratio' or column[0] == 'bounced_hits_r' or column[0] == 'he_received':
                for item in column[1:]:
                    item = int(round(item*100, 0))
                    temp_list.append(str(item)+' %')
            #Percent with 1 decimal.
            elif column[0] == 'wr' or column[0] == 'survived':
                for item in column[1:]:
                    item = round(item * 100, 1)
                    item = str(item) + ' %'
                    temp_list.append(item)
            #Time.
            elif column[0] == 'total_time':
                for item in column[1:]:
                    total_time = int(round(item, 0))
                    temp_list.append(str(total_time)+'m')
            elif column[0] == 'avg_lifetime':
                for item in column[1:]:
                    minutes = int(item/60)
                    seconds = int(item-(minutes*60))
                    item = str(minutes) + 'm ' + str(seconds) + 's'
                    temp_list.append(item)
            elif column[0] == 'last_time':
                for item in column[1:]:
                    timedelta = datetime.datetime.utcnow() - datetime.datetime.utcfromtimestamp(item)
                    minutes = timedelta.seconds/60
                    hours = timedelta.seconds/3600
                    days = timedelta.days
                    months = timedelta.days/30
                    years = timedelta.days/30/12
                    if years >= 1:
                        temp_list.append(str(int(round(years, 0)))+'y ago')
                    elif months >= 1:
                        temp_list.append(str(int(round(months, 0)))+'m ago')
                    elif days >= 1:
                        temp_list.append(str(int(round(days, 0)))+'d ago')
                    elif hours >= 1:
                        temp_list.append(str(int(round(hours, 0)))+'h ago')
                    else:
                        temp_list.append(str(int(round(minutes, 0)))+'min ago')
            #If not processed above, return without changes.
            else:
                for item in column[1:]:
                    temp_list.append(item)
            interim_data.append(temp_list)
        #Transposing back.
        for row in zip(*interim_data):
            final_data.append(row)
        self.player_data = final_data

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
#Class to handle form data.
class form_data:

    def __init__(self):
        self.header_clicked = 'none'
        self.playername = ''
        self.server = 'xbox'
        self.filter_by_50 = 'unchecked'
        self.checkboxes_input = ['wr', 'exp_perc', 'avg_lifetime']
        self.filter_input = []
        self.checkboxes = [['WinRate', 'wr', ''],
                          ['Battles', 'battles', ''],
                          ['Survived', 'survived', ''],

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
                          ['HE hits/Hits received', 'he_received', ''],

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

    def request_cookies(self, playername, server, filter_by_50, checkboxes_input, filter_input):
        if playername is not None:
            self.playername = playername

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
#Class to generate HTML elements.
class template_generator:

    def __init__(self):
        self.app_id = 'demo'
        self.top_panel = []
        self.footer =[['GitHub', 'https://github.com/IDDT/wot-console-stats']]
    #generate nav_bar, set index to 99 for everything inactive
    def generate_header(self, index_of_current_page):
        header = [['Statistics table', '/', 'not_current'], ['Player Performance', '/player_performance/', 'not_current'], ['FAQ', '/faq', 'not_current']]
        for i, item in enumerate(header):
            if i == index_of_current_page:
                item[2] = 'current'
        return(header)
    #create 1-row submit button
    def single_submit_button(self, button_message):
        code = '<section class="tabs"><div><ul><li>'
        code = code + '<button type="submit" class="current">' + str(button_message) + '</button>'
        code = code + '</li></ul></div></section>'
        return(code)
    #Function to generate a table for the tank stats viewer.
    def generate_tanks_table(self, list_of_lists):
        #separating the headers
        headers = list_of_lists[0]
        cols_n = len(headers)
        list_of_lists = list_of_lists[1:]

        #starting the table
        code = '<section class="table"><div><table>'

        #generating the headers
        code = code + '<tr>'
        for header in headers:
            code = code + '<td style="width:' + str(100/cols_n) + '%;">'
            code = code + '<button type="submit" value="' + str(header) + '" name="header">'
            code = code + str(header) + '</button>'
            code = code + '</td>'
        code = code + '</tr> '

        #generating the table
        for row in list_of_lists:
            code = code + '<tr>'
            for c, cell in enumerate(row):
                #styling for tank names
                if c == 0:
                    code = code + '<td style="width:' + str(100/cols_n) + '%; font-weight: bold; text-align: left;">'
                    code = code + '&nbsp' + str(cell) + '</td>'
                else:
                    code = code + '<td>' + str(cell) + '</td>'
            code = code + '</tr>'
        code = code + '</table></div></section>'
        return(code)
    #Generate a simple HTML table out of list of lists.
    def generate_simple_table(self, list_of_lists):
        #starting the table
        code = '<table>'
        #generating the table
        for row in list_of_lists:
            code = code + '<tr>'
            for cell in row:
                code = code + '<td>' + str(cell) + '</td>'
            code = code + '</tr>'
        code = code + '</table>'
        return(code)
template = template_generator()

@app.route('/', methods=["GET", "POST"])
def index():

    title = 'Statistics table'
    header = template.generate_header(0)

    #Requesting cookies.
    form = form_data()
    form.request_cookies(request.cookies.get('playername'), request.cookies.get('server'), request.cookies.get('filter_by_50'),
                         request.cookies.get('checkboxes_input'), request.cookies.get('filter_input'))


    if request.method == "GET":
        submit_button = template.single_submit_button('Enter the details above and click this button to <strong>Submit</strong>')
        form.generate_checkboxes()
        return render_template("tanks_table.html", title=title, top_panel=template.top_panel, header=header, footer=template.footer,
                                                   playername=form.playername, server=form.server, filter_by_50=form.filter_by_50,
                                                   checkboxes=form.checkboxes, checkboxes_filter=form.checkboxes_filter,
                                                   submit_button=submit_button)

    if request.method == "POST":

        #Collecting form items.
        user                         = user_data(template.app_id, request.form["server"], request.form["playername"])
        form.playername, form.server = user.gamertag, user.server
        form.checkboxes_input        = request.form.getlist('checkboxes_input')
        form.filter_input            = request.form.getlist('filter_input')
        form.header_clicked          = request.form['header'] if 'header' in request.form else ''
        form.filter_by_50            = request.form['filter_by_50'] if 'filter_by_50' in request.form else ''


        #Checking if user in SQL 'cache_user_data'.
        current_user = usercache.request_cache(user.gamertag, user.server)
        #If nothing found in SQL 'cache_user_data', searching by gamertag and requesting vehicles data.
        if current_user == None:
            user.search_by_playername()
            #Request vehicle data only if the status is 'ok'.
            if user.status == 'ok':
                user.request_vehicles()
            #Return error If status not 'ok'.
            if user.status != 'ok':
                button_message = user.message + ' Click here to <b>submit</b> again.'
                submit_button = template.single_submit_button(button_message)
                return render_template("tanks_table.html", title=title, top_panel=template.top_panel, header=header, footer=template.footer,
                                                           playername=form.playername, server=form.server, filter_by_50=form.filter_by_50,
                                                           checkboxes=form.checkboxes, checkboxes_filter=form.checkboxes_filter,
                                                           submit_button=submit_button)
            #Delete all expired records from SQL 'cache_user_data'.
            usercache.delete_expired_cache()
            #Log user into SQL.
            userlog.add_entry(user.gamertag, user.server)
            #Save data into SQL 'cache_user_data'.
            timestamp = int((datetime.datetime.utcnow()-datetime.datetime(1970,1,1)).total_seconds())
            action = usercache(timestamp = timestamp, player_id=user.account_id, gamertag=user.gamertag, server=user.server, player_data=pickle.dumps(user.player_data))
            db.session.add(action)
            db.session.commit()
            #Adding history data point into SQL.
            userdata_history.add_or_update(user.gamertag, user.server, user.account_id, pickle.dumps(user.player_data))
        #If recent data found in SQL 'cache_user_data'.
        else:
            user.player_data = pickle.loads(current_user.player_data)
            user.gamertag = current_user.gamertag
            user.account_id = current_user.player_id


        #Filtering and extracting data based on checkbox_input.
        user.filter_data(form.filter_by_50, form.filter_input, tankopedia)
        user.extract_needed_data(form.checkboxes, form.checkboxes_input)

        #Identifying sorting column and sorting the data.
        user.find_sorting_column(form.header_clicked, form.checkboxes)
        user.sort()

        #Formatting table values. Naming headers acc. to values in checkboxes. Replacing tank IDs with names.
        user.make_data_readable()
        user.name_headers(form.checkboxes)
        user.name_tanks(tanks_dict)

        #Generating output.
        form.playername = user.gamertag
        form.generate_checkboxes()
        message = 'Found data for <b>'+str(user.gamertag)+'</b> &nbsp;Click here to <b>resubmit</b> or any of the headers to sort by column'
        submit_button = template.single_submit_button(message)
        tank_table = template.generate_tanks_table(user.player_data)

        #Making response & assigning cookies.
        response = make_response(render_template("tanks_table.html", title=title, top_panel=template.top_panel, header=header, footer=template.footer,
                                                                     playername=form.playername, server=form.server, filter_by_50=form.filter_by_50,
                                                                     checkboxes=form.checkboxes, checkboxes_filter=form.checkboxes_filter,
                                                                     submit_button=submit_button, tank_table=tank_table))
        expire_date = datetime.datetime.now() + datetime.timedelta(days=7)
        response.set_cookie('playername', form.playername, expires=expire_date)
        response.set_cookie('server', form.server, expires=expire_date)
        response.set_cookie('filter_by_50', form.filter_by_50, expires=expire_date)
        response.set_cookie('checkboxes_input', json.dumps(form.checkboxes_input), expires=expire_date)
        response.set_cookie('filter_input', json.dumps(form.filter_input), expires=expire_date)
        return response
    return redirect(url_for('index'))

@app.route('/player_performance/', methods=["GET", "POST"])
def player_performance():

    #Class to handle 'player_performance' page.
    class player_perf(user_data):
        def __init__(self, app_id, server, playername):
            user_data.__init__(self, app_id, server, playername)

    title = 'Player Performance'
    header = template.generate_header(1)

    #Requesting cookies.
    form = form_data()
    form.checkboxes_filter = [['T1', '1', ''], ['T2', '2', ''], ['T3', '3', ''],
                              ['T4', '4', ''], ['T5', '5', ''], ['T6', '6', ''],
                              ['T7', '7', ''], ['T8', '8', ''], ['T9', '9', ''],
                              ['T10', '10', ''], ['HT', 'heavyTank', ''], ['MT', 'mediumTank', ''],
                              ['LT', 'lightTank', ''], ['AT', 'AT-SPG', ''], ['SPG', 'SPG', '']]
    form.request_cookies(request.cookies.get('playername'), request.cookies.get('server'), request.cookies.get('filter_by_50'),
                         request.cookies.get('checkboxes_input'), request.cookies.get('filter_input'))


    if request.method == "GET":
        submit_button = template.single_submit_button('<strong>Submit</strong>')
        form.generate_checkboxes()
        return render_template("player_performance_empty.html", title=title, top_panel=template.top_panel, header=header, footer=template.footer,
                                                                  playername=form.playername, server=form.server,
                                                                  checkboxes_filter=form.checkboxes_filter, submit_button=submit_button)

    if request.method == "POST":

        #Collecting form items.
        user                         = player_perf(template.app_id, request.form["server"], request.form["playername"])
        form.playername, form.server = user.gamertag, user.server
        form.filter_input            = request.form.getlist('filter_input')

        #Checking if user in SQL 'cache_user_data'.
        current_user = usercache.request_cache(user.gamertag, user.server)
        #If nothing found in SQL 'cache_user_data', searching by gamertag and requesting vehicles data.
        if current_user == None:
            user.search_by_playername()
            #Request vehicle data only if the status is 'ok'.
            if user.status == 'ok':
                user.request_vehicles()
            #Return error If status not 'ok'.
            if user.status != 'ok':
                button_message = user.message + ' Click here to <b>submit</b> again.'
                submit_button = template.single_submit_button(button_message)
                return render_template("player_performance_empty.html", title=title, top_panel=template.top_panel, header=header, footer=template.footer,
                                                                          playername=form.playername, server=form.server,
                                                                          checkboxes_filter=form.checkboxes_filter, submit_button=submit_button)
            #Delete all expired records from SQL 'cache_user_data'.
            usercache.delete_expired_cache()
            #Log user into SQL.
            userlog.add_entry(user.gamertag, user.server)
            #Save data into SQL 'cache_user_data'.
            timestamp = int((datetime.datetime.utcnow()-datetime.datetime(1970,1,1)).total_seconds())
            action = usercache(timestamp = timestamp, player_id=user.account_id, gamertag=user.gamertag, server=user.server, player_data=pickle.dumps(user.player_data))
            db.session.add(action)
            db.session.commit()
            #Adding history data point into SQL.
            userdata_history.add_or_update(user.gamertag, user.server, user.account_id, pickle.dumps(user.player_data))
        #If recent data found in SQL 'cache_user_data'.
        else:
            user.player_data = pickle.loads(current_user.player_data)
            user.gamertag = current_user.gamertag
            user.account_id = current_user.player_id


        #Searching all records of the player in SQL 'history'.
        user_history_search = userdata_history.query.filter_by(gamertag=user.gamertag, server=user.server).all()



        #Calculating percentiles for line chart.
        xlabels = []
        percentiles = [['Accuracy', 'acc'],
                       ['Damage Caused', 'dmgc'],
                       ['Radio Assist', 'rass'],
                       ['WinRate', 'wr'],
                       ['Damage Received', 'dmgr']]
        #Empty list of lists to hold data.
        chart_data = [[],[],[],[],[]]
        for row in user_history_search:
            #Getting 'xlabels.'
            timedelta = datetime.datetime.utcnow().date() - datetime.datetime.utcfromtimestamp(row.timestamp).date()
            if timedelta.days > 0:
                xlabels.append(str(timedelta.days) + 'd ago')
            else:
                xlabels.append('Today')
            #Getting and filtering player data.
            user.player_data = pickle.loads(row.player_data)
            user.filter_data('unchecked', form.filter_input, tankopedia)

            dmgc_temp, wr_temp, rass_temp, dmgr_temp, acc_temp = ([] for i in range(5))
            for vehicle in user.player_data:
                if vehicle['battles'] > 0:
                    dmgc_temp.append(user.percentile_calculator('dmgc', vehicle['tank_id'], vehicle['damage_dealt']/vehicle['battles']))
                    wr_temp.append(user.percentile_calculator('wr', vehicle['tank_id'], vehicle['wins']/vehicle['battles']*100))
                    rass_temp.append(user.percentile_calculator('rass', vehicle['tank_id'], vehicle['damage_assisted_radio']/vehicle['battles']))
                    dmgr_temp.append(user.percentile_calculator('dmgr', vehicle['tank_id'], vehicle['damage_received']/vehicle['battles']))
                    if vehicle['hits'] > 0:
                        acc_temp.append(user.percentile_calculator('acc', vehicle['tank_id'], vehicle['hits']/vehicle['shots']*100))
                    else:
                        acc_temp.append(0.0)

            chart_data[1].append(round(sum(dmgc_temp)/len(dmgc_temp), 2))
            chart_data[3].append(round(sum(wr_temp)/len(wr_temp), 2))
            chart_data[2].append(round(sum(rass_temp)/len(rass_temp), 2))
            chart_data[4].append(abs(round(sum(dmgr_temp)/len(dmgr_temp), 2)-100))
            chart_data[0].append(round(sum(acc_temp)/len(acc_temp), 2))

        #Radar chart.
        RadarChart = [json.dumps([row[0] for row in percentiles]), json.dumps([item[-1] for item in chart_data])]
        #Line chart.
        x_labels = json.dumps(xlabels)
        chart_names = [item[0] for item in percentiles]
        line_charts = [json.dumps(item) for item in chart_data]


        #Generating output.
        form.playername = user.gamertag
        form.generate_checkboxes()
        message = 'Found data for <b>'+str(user.gamertag)+'</b> &nbsp;Click here to <b>resubmit</b>'
        submit_button = template.single_submit_button(message)

        #Making response & assigning cookies.
        response = make_response(render_template("player_performance.html", title=title, top_panel=template.top_panel, header=header,
                                                                              footer=template.footer, submit_button=submit_button,
                                                                              playername=form.playername, server=form.server,
                                                                              checkboxes_filter=form.checkboxes_filter,
                                                                              line_charts=line_charts, chart_names=chart_names, x_labels=x_labels,
                                                                              RadarChart=RadarChart))
        expire_date = datetime.datetime.now() + datetime.timedelta(days=7)
        response.set_cookie('playername', form.playername, expires=expire_date)
        response.set_cookie('server', form.server, expires=expire_date)
        response.set_cookie('filter_input', json.dumps(form.filter_input), expires=expire_date)
        return response
    return redirect(url_for('player_performance'))


@app.route('/faq')
def faq():

    title = 'FAQ'
    header = template.generate_header(2)

    text = '<b>What\'s the point of using percentiles instead of WN8 or other ratings?</b><br>'
    text = text + 'WN8 rating is based on PC expected statistics table. Most of the sites visualizing worldoftanks statistics for consoles use PC table even though WTE100, BatChat and many other tanks are different from the PC version of the game. '
    text = text + 'Additionally WN8 formula was build on the data from the game where it is easier to use aiming capabilities of the tank. '
    text = text + 'All these differences make WN8 rating hardly useful when evaluating console players.<br><br>'

    text = text + '<b>How percentiles were calculated?</b><br>'
    text = text + 'The data of 50,000 random WoT Console profiles was collected. To be a piece of valid data, the player must have had at least 2500 battles on the account. '
    text = text + 'Then ratios were calculated for each tank of every player. To be included in the final rating, Tier 6+ vehicles had to have more than 100 battles, 20 battles for Tier 3+ and 10 battles for Tier 4-. '
    text = text + 'After assembling all player ratios, the percentiles for each tank were calculated using a math module. '
    text = text + 'More information about percentile can be found in <a href="https://en.wikipedia.org/wiki/Percentile">Wikipedia.</a><br><br>'

    text = text + '<b>What exactly do all these selectors mean?</b><br>'
    text = text + 'WinRate -- Winning battles/total number of battles<br>'
    text = text + 'Battles -- Total battles on the account<br>'
    text = text + 'Survived -- Percent of the battles where player survived<br>'
    text = text + 'Avg Damage -- Average damage dealt per battle<br>'
    text = text + 'Avg Frags -- Average number of frags per battle<br>'
    text = text + 'Avg EXP -- Average experience per battle<br>'
    text = text + 'Avg DPM -- The actual Damage Per Minute that player achieved on the tank<br>'
    text = text + 'Avg FPM -- Average frags per minute<br>'
    text = text + 'Avg EPM -- Average experience per minute<br>'
    text = text + 'Dmg Percentile -- Shows the percent of players that have lower average damage per battle number<br>'
    text = text + 'WR Percentile -- Shows the percent of players that have lower average winning rate<br>'
    text = text + 'Exp Percentile -- Shows the percent of players that have lower average experience per battle<br>'
    text = text + 'Penetrated/Hits caused -- Percentage of player\'s penetrating hits out of all hits, excluding misses<br>'
    text = text + 'Bounced/Hits received -- Percent of all non-damage hits that hit the player<br>'
    text = text + 'HE hits/Hits received -- Percent of how many of all shells were High Explosives that hit the player<br>'
    text = text + 'Total Lifetime -- Total number of minutes spent driving the tank ***<br>'
    text = text + 'Average Lifetime -- Average lifetime ***<br>'
    text = text + 'Last battle time -- How many (min, h, d, m, y) ago the tank was driven<br>'
    text = text + '*** Only the time between the actual start of the battle (15:00 on battle timer) and player death is included<br><br>'

    text = text + '<b>How long does the website keep the data?</b><br>'
    text = text + 'I haven\'t figured out that one yet, but obviously there are limits. The biggest limiting factor right now is low amount of space on free hosting.<br><br>'

    text = text + '<b>Something doesn\'t seem to work properly and I feel helpful.</b><br>'
    text = text + 'Follow the GitHub link in the footer and submit a bug report.<br><br>'

    return render_template("text_page.html", title=title, top_panel=template.top_panel, header=header, footer=template.footer, text=text)


if __name__ == '__main__':
    app.run()
