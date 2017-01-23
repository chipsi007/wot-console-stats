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
with open('references/wn8pc.json','r') as infile:
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
    gamertag = db.Column(db.String(100))
    server = db.Column(db.String(20))
    timestamp = db.Column(db.Integer)
    count = db.Column(db.Integer)
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

    def filter_data(self, filter_by_50):
        #Either 'checked' or 'unchecked'
        filtered_player_data = []
        if filter_by_50 == 'checked':
            for tank in self.player_data:
                if tank['battles'] >= 50:
                    filtered_player_data.append(tank)
            self.player_data = filtered_player_data

    def extract_needed_data(self, checkbox_input):
        extracted_data = []
        #asembling the header
        header = ['tank_id']
        #same order as in the code that follows
        header_elements = ['wr', 'battles', 'wn8',
                           'avg_dmg', 'avg_frags', 'survived',
                           'avg_dpm', 'avg_fpm', 'avg_exp',
                           'pen_hits_ratio', 'avg_radio_assist', 'avg_trees_cut',
                           'bounced_hits_r', 'assist_dmg_r', 'he_received',
                           'total_time', 'avg_lifetime', 'last_time']

        for element in header_elements:
            for item in checkbox_input:
                if element == item:
                    header.append(item)
        extracted_data.append(header)

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
            if 'wn8' in checkbox_input:
                temp_list.append(calculate_wn8(vehicle, WN8_dict))
            ###############################
            if 'avg_dmg' in checkbox_input:
                temp_list.append(vehicle['damage_dealt']/vehicle['battles'])
            if 'avg_frags' in checkbox_input:
                temp_list.append(vehicle['frags']/vehicle['battles'])
            if 'survived' in checkbox_input:
                temp_list.append(vehicle['survived_battles']/vehicle['battles'])
            ###############################
            if 'avg_dpm' in checkbox_input:
                battle_life_time = vehicle['battle_life_time']
                damage_dealt = vehicle['damage_dealt']
                if battle_life_time == 0:
                    temp_list.append(0)
                else:
                    temp_list.append(damage_dealt/battle_life_time*60)
            if 'avg_fpm' in checkbox_input:
                battle_life_time = vehicle['battle_life_time']
                frags = vehicle['frags']
                if battle_life_time == 0:
                    temp_list.append(0)
                else:
                    temp_list.append(frags/battle_life_time*60)
            if 'avg_exp' in checkbox_input:
                temp_list.append(vehicle['xp']/vehicle['battles'])
            ################################
            if 'pen_hits_ratio' in checkbox_input:
                hits = vehicle['hits']
                piercings = vehicle['piercings']
                if hits == 0:
                    temp_list.append(0)
                else:
                    temp_list.append(piercings/hits)
            if 'avg_radio_assist' in checkbox_input:
                temp_list.append(vehicle['damage_assisted_radio']/vehicle['battles'])
            if 'avg_trees_cut' in checkbox_input:
                temp_list.append(vehicle['trees_cut']/vehicle['battles'])
            ################################
            if 'bounced_hits_r' in checkbox_input:
                if vehicle['direct_hits_received'] == 0:
                    temp_list.append(0)
                else:
                    temp_list.append(vehicle['no_damage_direct_hits_received']/vehicle['direct_hits_received'])
            if 'assist_dmg_r' in checkbox_input:
                damage_dealt = vehicle['damage_dealt']
                damage_assisted_radio = vehicle['damage_assisted_radio']
                damage_assisted_track = vehicle['damage_assisted_track']
                if damage_dealt == 0:
                    temp_list.append(1)
                else:
                    temp_list.append((damage_assisted_radio+damage_assisted_track)/damage_dealt)
            if 'he_received' in checkbox_input:
                if vehicle['direct_hits_received'] == 0:
                    temp_list.append(0)
                else:
                    temp_list.append(vehicle['explosion_hits_received']/vehicle['direct_hits_received'])
            ################################
            if 'total_time' in checkbox_input:
                temp_list.append(vehicle['battle_life_time']/60)
            if 'avg_lifetime' in checkbox_input:
                temp_list.append(vehicle['battle_life_time']/vehicle['battles'])
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
        #separing headers
        headers = self.player_data[0]
        requested_data = self.player_data[1:]

        #creating new list
        processed_list = []
        processed_list.append(headers)

        #column to sort
        n = self.sorting_index

        sorted_list = [row[n] for row in requested_data]
        sorted_list = sorted(sorted_list, reverse=True)

        temp_list = []
        for item in sorted_list:
            for r, row in enumerate(requested_data):
                if item == row[n]:
                    processed_list.append(row)
                    #deleting the row in case there are rows with same values
                    requested_data.pop(r)

        self.player_data = processed_list

    def make_data_readable(self):
        final_data = []
        interim_data = []
        #transposing into columns
        for column in zip(*self.player_data):
            temp_list = [column[0]]

            #round with 0 decimals
            if column[0] == 'avg_dmg' or column[0] == 'avg_exp' or column[0] == 'avg_dpm' or column[0] == 'avg_radio_assist':
                for item in column[1:]:
                    temp_list.append(int(round(item, 0)))

            #round with 1 decimal
            elif column[0] == 'avg_trees_cut':
                for item in column[1:]:
                    temp_list.append(round(item, 1))

            #round with 2 decimals
            elif column[0] == 'avg_frags' or column[0] == 'avg_fpm':
                for item in column[1:]:
                    temp_list.append(round(item, 2))

            #percent with 0 decimals
            elif column[0] == 'pen_hits_ratio' or column[0] == 'assdmgr' or column[0] == 'bounced_hits_r' or column[0] == 'he_received' or column[0] == 'assist_dmg_r':
                for item in column[1:]:
                    item = int(round(item*100, 0))
                    temp_list.append(str(item)+' %')

            #percent with 1 decimal
            elif column[0] == 'wr' or column[0] == 'survived':
                for item in column[1:]:
                    item = round(item * 100, 1)
                    item = str(item) + ' %'
                    temp_list.append(item)
            #wn8
            elif column[0] == 'wn8':
                wn8_table = [[-999, 299, 'DARKRED'],
                             [300,449, 'ORANGERED'],
                             [450,649, 'DARKORANGE'],
                             [650,899, 'GOLD'],
                             [900,1199, 'YELLOWGREEN'],
                             [1200,1599, 'LIME'],
                             [1600,1999, 'DEEPSKYBLUE'],
                             [2000,2449, 'DODGERBLUE'],
                             [2450,2899, 'MEDIUMSLATEBLUE'],
                             [2900,99999, 'REBECCAPURPLE']]
                for item in column[1:]:
                    wn8 = int(round(item, 0))
                    color = 'BLACK'
                    for value in wn8_table:
                        if value[0] <= wn8 <= value[1]:
                            color = value[2]
                    string = "%04d" % (wn8,) + ' ' + '<font color=\'' + color + '\'>&#9679;</font>'
                    temp_list.append(string)

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

            #Return without changes. For 'tank_id', 'battles'.
            else:
                for item in column[1:]:
                    temp_list.append(item)


            interim_data.append(temp_list)

        #transposing back
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
        new_data = [self.player_data[0]]

        for row in self.player_data[1:]:
            temp_list = []
            #Setting default name.
            name = 'Unknown'
            #Checking if the name is in the dict.
            if str(row[0]) in tanks_dict:
                name = tanks_dict[str(row[0])]
            #Appending name.
            temp_list.append(name)
            for item in row[1:]:
                temp_list.append(item)
            new_data.append(temp_list)

        self.player_data = new_data
#Function to calculate WN8.
def calculate_wn8(tank_data, WN8_dict):
    #Loading expected values
    exp_values = {}
    for item in WN8_dict['data']:
        if tank_data['tank_id'] == item['IDNum']:
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


#Misc data that never changes.
app_id = 'demo'
top_panel = []
footer =[['Changelog', '/changelog'], ['GitHub', 'https://github.com/IDDT/wot-console-stats']]


@app.route('/', methods=["GET", "POST"])
def index():

    #Class to handle form data.
    class form_data:

        def __init__(self):
            self.header_clicked = 'none'
            self.playername = ''
            self.server = 'xbox'
            self.filter_by_50 = 'unchecked'
            self.checkboxes = [['WinRate', 'wr', ''],
                              ['Battles', 'battles', ''],
                              ['WN8', 'wn8', ''],

                              ['Avg Damage', 'avg_dmg', ''],
                              ['Avg Frags', 'avg_frags', ''],
                              ['Survived', 'survived', ''],

                              ['Avg DPM', 'avg_dpm', ''],
                              ['Avg FPM', 'avg_fpm', ''],
                              ['Avg EXP', 'avg_exp', ''],

                              ['Penetrated/Hits caused', 'pen_hits_ratio', ''],
                              ['Average Radio Assist', 'avg_radio_assist', ''],
                              ['Average Trees Cut', 'avg_trees_cut', ''],

                              ['Bounced/Hits received', 'bounced_hits_r', ''],
                              ['Assisted/Caused DMG', 'assist_dmg_r', ''],
                              ['HE hits/Hits received', 'he_received', ''],

                              ['Total Lifetime', 'total_time', ''],
                              ['Average Lifetime', 'avg_lifetime', ''],
                              ['Last battle time', 'last_time', '']]

        def request_cookies(self, playername, server, checkboxes_input, filter_by_50):
            if playername is not None:
                self.playername = playername

            if server is not None:
                self.server = server

            if checkboxes_input is None:
                self.checkboxes_input = ['wr', 'battles', 'wn8']
            else:
                self.checkboxes_input = json.loads(checkboxes_input)

            if filter_by_50 is not None:
                self.filter_by_50 = filter_by_50

        def request_form(self, ):
            pass

        def generate_checkboxes(self):
            for item in self.checkboxes:
                if item[1] in self.checkboxes_input:
                    item[2] = 'checked'
                else:
                    item[2] = ''

    title = 'Check tank statistics'
    header = template.generate_header(0)

    #Calling the form_data class.
    form = form_data()

    #Requesting cookies.
    playername = request.cookies.get('playername')
    server = request.cookies.get('server')
    filter_by_50 = request.cookies.get('filter_by_50')
    checkboxes_input = request.cookies.get('checkboxes_input')
    form.request_cookies(playername, server, checkboxes_input, filter_by_50)


    if request.method == "GET":
        submit_button = template.single_submit_button('Enter the details above and click this button to <strong>Submit</strong>')
        form.generate_checkboxes()
        return render_template("tanks_statistics.html", title=title, top_panel=top_panel, header=header, footer=footer,
                                                        playername=form.playername, server=form.server, checkboxes=form.checkboxes,
                                                        filter_by_50=form.filter_by_50, submit_button=submit_button)


    if request.method == "POST":

        #Collecting form items.
        user = user_data(app_id, request.form["server"], request.form["playername"])
        form.playername, form.server = user.gamertag, user.server
        form.checkboxes_input = request.form.getlist('checkboxes_input')
        if 'header' in request.form:
            form.header_clicked = request.form['header']
        else:
            form.header_clicked = ''
        if 'filter_by_50' in request.form:
            form.filter_by_50 = request.form['filter_by_50']
        else:
            form.filter_by_50 = 'unchecked'


        #Checking if user in SQL 'cache_user_data'
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
            #Proceed to requesting vehicle data only if the status is 'ok'
            if user.status == 'ok':
                user.request_vehicles()
            #Handling possible error
            if user.status != 'ok':
                button_message = user.message + ' Click here to <b>submit</b> again.'
                code = '<section class="tabs"><div><ul><li>'
                code = code + '<button type="submit" class="current">' + str(button_message) + '</button>'
                code = code + '</li></ul></div></section>'
                return render_template("tanks_statistics.html", title=title, top_panel=top_panel, header=header, footer=footer,
                                                                playername=form.playername, server=form.server, checkboxes=form.checkboxes,
                                                                filter_by_50=form.filter_by_50,
                                                                submit_button=code)

            #Save data into SQL 'cache_user_data'
            timestamp = int((datetime.datetime.utcnow()-datetime.datetime(1970,1,1)).total_seconds())
            action = usercache(timestamp = timestamp, player_id=user.account_id, gamertag=user.gamertag, server=user.server, player_data=pickle.dumps(user.player_data))
            db.session.add(action)
            db.session.commit()

        #If actual data found in SQL 'cache_user_data'
        else:
            user.player_data = pickle.loads(current_user.player_data)
            user.gamertag = current_user.gamertag

        #Add entry into SQL 'log_user'
        def log_user_func(gamertag, server):
            #Getting current timestamp in UTC
            timestamp = int((datetime.datetime.utcnow()-datetime.datetime(1970,1,1)).total_seconds())
            #Checking if user is already in the database
            logged_user_search = userlog.query.filter_by(gamertag=gamertag, server=server).first()
            #Adding new entry if not found
            if logged_user_search == None:
                action = userlog(gamertag=gamertag, server=server, timestamp=timestamp, count=1)
                db.session.add(action)
                db.session.commit()
            #Updating timestamp and count if found
            else:
                logged_user_search.timestamp = timestamp
                logged_user_search.count = logged_user_search.count + 1
                db.session.commit()
            return()
        log_user_func(user.gamertag, user.server)

        #Filtering and extracting data based on checkbox_input.
        user.filter_data(form.filter_by_50)
        user.extract_needed_data(form.checkboxes_input)

        #Sorting the data.
        user.find_sorting_column(form.header_clicked, form.checkboxes)
        user.sort()

        #Formatting table values. Naming headers acc. to values in checkboxes. Replacing tank IDs with names.
        user.make_data_readable()
        user.name_headers(form.checkboxes)
        user.name_tanks(tanks_dict)


        #Generating output.
        form.playername = user.gamertag
        form.generate_checkboxes()
        message = 'Found data for <b>'+str(user.gamertag)+'</b>  Click here to <b>resubmit</b> or any of the headers to sort by column'
        submit_button = template.single_submit_button(message)
        tank_table = template.generate_tanks_table(user.player_data)

        #Making response & assigning cookies.
        response = make_response(render_template("tanks_statistics.html", title=title, top_panel=top_panel, header=header, footer=footer,
                                                                          playername=form.playername, server=form.server, checkboxes=form.checkboxes,
                                                                          filter_by_50=form.filter_by_50, submit_button=submit_button, tank_table=tank_table))
        expire_date = datetime.datetime.now() + datetime.timedelta(days=7)
        response.set_cookie('playername', form.playername, expires=expire_date)
        response.set_cookie('server', form.server, expires=expire_date)
        response.set_cookie('filter_by_50', form.filter_by_50, expires=expire_date)
        response.set_cookie('checkboxes_input', json.dumps(form.checkboxes_input), expires=expire_date)
        return response
    return redirect(url_for('index'))


@app.route('/about')
def about():

    title = 'About'
    header = template.generate_header(1)

    with open('references/about.txt','r') as infile:
        text = infile.read()

    checkboxes_help = [['<b>Checkbox</b>' , '<b>Meaning</b>'],
                       ['WinRate', 'Winning battles/total number of battles'],
                       ['Battles', 'Total battles on the account'],
                       ['WN8', 'WN8 rating, more on that <a href="http://wiki.wnefficiency.net/pages/WN8">here</a>'],
                       ['Avg Damage', 'Average damage dealt per battle'],
                       ['Avg Frags', 'Average number of frags per battle'],
                       ['Survived', 'Percent of the battles where player survived'],
                       ['Avg DPM', 'The actual Damage Per Minute that player achieved on the tank'],
                       ['Avg FPM', 'Frags per minute'],
                       ['Avg EXP', 'Average experience per battle'],
                       ['Penetrated/Hits caused', 'Percentage of player\'s penetrating hits out of all hits, excluding misses'],
                       ['Average Radio Assist', 'Average radio assist (spotting damage) points per battle'],
                       ['Average Trees Cut', 'Trees cut per battle on average'],
                       ['Bounced/Hits received', 'Percent of all non-damage hits that hit the player'],
                       ['Assisted/Caused DMG', '(tracking assist + spotting assist) / Damage dealt'],
                       ['HE hits/Hits received', 'Percent of how many of all shells were High Explosives that hit the player'],
                       ['Total Lifetime', 'Total number of minutes spent driving the tank ***'],
                       ['Average Lifetime', 'Average lifetime ***'],
                       ['Last battle time', 'How many (min, h, d, m, y) ago the tank was driven']]

    checkboxes_disclaimer = [['*** Only the time between the actual start of the battle (15:00 on battle timer) and player death is included']]

    text = text + template.generate_simple_table(checkboxes_help)
    text = text + template.generate_simple_table(checkboxes_disclaimer)

    return render_template("text_page.html", title=title, top_panel=top_panel, header=header, footer=footer, text=text)


@app.route('/changelog')
def changelog():

    title = 'Changelog'
    header = template.generate_header(99)

    with open('references/changelog.txt','r') as infile:
        changelog = infile.read()

    text = ''
    for line in changelog.split('\n'):
        if line != '':
            text = text + str(line) + '<br>'

    return render_template("text_page.html", title=title, top_panel=top_panel, header=header, footer=footer, text=text)

if __name__ == '__main__':
    app.run()
