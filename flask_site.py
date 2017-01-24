from flask import Flask, render_template, request, redirect, url_for, make_response
from flask_sqlalchemy import SQLAlchemy
import requests
import json
import pickle
import datetime
import template_functions as template


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
def userlog_add_entry(gamertag, server):
    #Getting current timestamp in UTC
    timestamp = int((datetime.datetime.utcnow()-datetime.datetime(1970,1,1)).total_seconds())
    #Checking if user is already in the database
    logged_user_search = userlog.query.filter_by(gamertag=gamertag, server=server).first()
    #Adding new entry if not found
    if logged_user_search == None:
        action = userlog(gamertag=gamertag, server=server, timestamp=timestamp, count=1)
        db.session.add(action)
    #Updating timestamp and count if found
    else:
        logged_user_search.timestamp = timestamp
        logged_user_search.count = logged_user_search.count + 1
    db.session.commit()
    return()
class usercache(db.Model):
    __tablename__ = "usercache"
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.Integer)
    player_id = db.Column(db.Integer)
    gamertag = db.Column(db.String(100))
    server = db.Column(db.String(20))
    player_data = db.Column(db.PickleType)
#Clearing 'usercache' on start.
db.session.query(usercache).delete()
db.session.commit()

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
                perc = self.percentile_calculator('dmg', vehicle['tank_id'], value)
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

#Misc data that never changes.
app_id = 'demo'
top_panel = []
footer =[['GitHub', 'https://github.com/IDDT/wot-console-stats']]


@app.route('/', methods=["GET", "POST"])
def index():

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

    title = 'Check tank statistics'
    header = template.generate_header(0)

    #Requesting cookies.
    form = form_data()
    form.request_cookies(request.cookies.get('playername'), request.cookies.get('server'), request.cookies.get('filter_by_50'),
                         request.cookies.get('checkboxes_input'), request.cookies.get('filter_input'))


    if request.method == "GET":
        submit_button = template.single_submit_button('Enter the details above and click this button to <strong>Submit</strong>')
        form.generate_checkboxes()
        return render_template("tanks_table.html", title=title, top_panel=top_panel, header=header, footer=footer,
                                                   playername=form.playername, server=form.server, filter_by_50=form.filter_by_50,
                                                   checkboxes=form.checkboxes, checkboxes_filter=form.checkboxes_filter,
                                                   submit_button=submit_button)

    if request.method == "POST":

        #Collecting form items.
        user                         = user_data(app_id, request.form["server"], request.form["playername"])
        form.playername, form.server = user.gamertag, user.server
        form.checkboxes_input        = request.form.getlist('checkboxes_input')
        form.filter_input            = request.form.getlist('filter_input')
        form.header_clicked          = request.form['header'] if 'header' in request.form else ''
        form.filter_by_50            = request.form['filter_by_50'] if 'filter_by_50' in request.form else ''


        #Checking if user in SQL 'cache_user_data'.
        current_user = None
        cached_user_search = usercache.query.filter_by(gamertag=user.gamertag, server=user.server).all()
        if len(cached_user_search) > 0:
            max_timestamp = 0
            for row in cached_user_search:
                if row.timestamp > max_timestamp:
                    max_timestamp = row.timestamp

            #Checking if the timestamp is not older than 5 minutes. If so, using cached data instead of requesting new one.
            timestamp = int((datetime.datetime.utcnow()-datetime.datetime(1970,1,1)).total_seconds())
            if timestamp - max_timestamp <= 300:
                for row in cached_user_search:
                    if row.timestamp == max_timestamp:
                        current_user = row
            else:
                #Delete all expired records for this user from SQL 'cache_user_data'
                for row in cached_user_search:
                    db.session.delete(row)
                db.session.commit()


        #If nothing found in SQL 'cache_user_data', searching by gamertag and requesting vehicles data.
        if current_user == None:
            user.search_by_playername()
            #Request vehicle data only if the status is 'ok'.
            if user.status == 'ok':
                user.request_vehicles()
            #Return error If status not 'ok'.
            if user.status != 'ok':
                button_message = user.message + ' Click here to <b>submit</b> again.'
                code = '<section class="tabs"><div><ul><li>'
                code = code + '<button type="submit" class="current">' + str(button_message) + '</button>'
                code = code + '</li></ul></div></section>'
                return render_template("tanks_table.html", title=title, top_panel=top_panel, header=header, footer=footer,
                                                           playername=form.playername, server=form.server, filter_by_50=form.filter_by_50,
                                                           checkboxes=form.checkboxes, checkboxes_filter=form.checkboxes_filter,
                                                           submit_button=code)

            #Save data into SQL 'cache_user_data'
            timestamp = int((datetime.datetime.utcnow()-datetime.datetime(1970,1,1)).total_seconds())
            action = usercache(timestamp = timestamp, player_id=user.account_id, gamertag=user.gamertag, server=user.server, player_data=pickle.dumps(user.player_data))
            db.session.add(action)
            db.session.commit()
        #If recent data found in SQL 'cache_user_data'.
        else:
            user.player_data = pickle.loads(current_user.player_data)
            user.gamertag = current_user.gamertag

        #Add entry into SQL 'log_user'.
        userlog_add_entry(user.gamertag, user.server)

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
        response = make_response(render_template("tanks_table.html", title=title, top_panel=top_panel, header=header, footer=footer,
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



@app.route('/about')
def about():

    title = 'About'
    header = template.generate_header(2)

    with open('references/about.txt','r') as infile:
        text = infile.read()

    checkboxes_help = [['<b>Checkbox</b>' , '<b>Meaning</b>'],
                       ['WinRate', 'Winning battles/total number of battles'],
                       ['Battles', 'Total battles on the account'],
                       ['Survived', 'Percent of the battles where player survived'],
                       ['Avg Damage', 'Average damage dealt per battle'],
                       ['Avg Frags', 'Average number of frags per battle'],
                       ['Avg EXP', 'Average experience per battle'],
                       ['Avg DPM', 'The actual Damage Per Minute that player achieved on the tank'],
                       ['Avg FPM', 'Average frags per minute'],
                       ['Avg EPM', 'Average experience per minute'],
                       ['Dmg Percentile', 'Shows the percent of players that have lower average damage per battle number'],
                       ['WR Percentile', 'Shows the percent of players that have lower average winning rate'],
                       ['Exp Percentile', 'Shows the percent of players that have lower average experience per battle'],
                       ['Penetrated/Hits caused', 'Percentage of player\'s penetrating hits out of all hits, excluding misses'],
                       ['Bounced/Hits received', 'Percent of all non-damage hits that hit the player'],
                       ['HE hits/Hits received', 'Percent of how many of all shells were High Explosives that hit the player'],
                       ['Total Lifetime', 'Total number of minutes spent driving the tank ***'],
                       ['Average Lifetime', 'Average lifetime ***'],
                       ['Last battle time', 'How many (min, h, d, m, y) ago the tank was driven']]

    checkboxes_disclaimer = [['*** Only the time between the actual start of the battle (15:00 on battle timer) and player death is included']]

    text = text + template.generate_simple_table(checkboxes_help)
    text = text + template.generate_simple_table(checkboxes_disclaimer)

    return render_template("text_page.html", title=title, top_panel=top_panel, header=header, footer=footer, text=text)


if __name__ == '__main__':
    app.run()
