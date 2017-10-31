from flask import g
import sqlite3
import pickle
import time


from . import app


#Sqlite3 singleton + connection opener + connection teardown.
#sql functions can't be executed outside of requests.


# TODO: make a package instead of class.


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


class db():

    #Main functions.
    @staticmethod
    def get_latest_checkpoint(server, account_id):
        cur = open_conn().cursor()
        search = cur.execute('''
            SELECT created_at, data FROM checkpoints
            WHERE server = ? AND account_id = ?
            ORDER BY created_at DESC LIMIT 1;
        ''', (server, account_id)).fetchone()

        return {'created_at': search[0], 'data': pickle.loads(search[1])} if search else {}

    @staticmethod
    def get_all_recent_checkpoints(server, account_id):
        #Returns the list of checkpoints for the last 14 days. Ordered from earliest to latest.
        fourteen_days = int(time.time()) - 60 * 60 * 24 * 14
        cur = open_conn().cursor()
        cur.execute('''
            SELECT created_at, data FROM checkpoints
            WHERE server = ? AND account_id = ? AND created_at >= ?
            ORDER BY created_at ASC;
        ''', (server, account_id, fourteen_days))

        return [{'created_at': row[0], 'data': pickle.loads(row[1])} for row in cur]

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
        cur = open_conn().cursor()
        cur.execute('''
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
        ''', (server, account_id, server, account_id))
        return [{'created_at': row[0], 'data': pickle.loads(row[1])} for row in cur]



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
        return cur.execute(query, (start_timestamp, end_timestamp)).fetchall()

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
                return True
        return False

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



    #Core data loaders.
    #Output: {key:str: {...}}
    @staticmethod
    def get_tankopedia():
        cur = open_conn().cursor()
        output = {}
        cur.execute('SELECT tank_id, name, short_name, nation, is_premium, tier, type FROM tankopedia')
        # TODO: Tankopedia keys need to be integers.
        for row in cur:
            output[str(row[0])] = {
                "tank_id":      row[0],
                "name":         row[1],
                "short_name":   row[2],
                "nation":       row[3],
                "is_premium":   True if row[4] == 1 else False,
                "tier":         row[5],
                "type":         row[6]
            }
        return output

    @staticmethod
    def get_percentiles():
        cur = open_conn().cursor()
        output = {}
        cur.execute('SELECT tank_id, data FROM percentiles;')
        for row in cur:
            output[row[0]] = pickle.loads(row[1])
        return output

    @staticmethod
    def get_percentiles_generic():
        cur = open_conn().cursor()
        output = {}
        cur.execute('SELECT tier, type, data FROM percentiles_generic;')
        for row in cur:
            output[str(row[0]) + row[1]] = pickle.loads(row[2])
        return output

    @staticmethod
    def get_wn8():
        cur = open_conn().cursor()
        output = {}
        cur.execute('SELECT tank_id, expFrag, expDamage, expSpot, expDef, expWinRate FROM wn8;')
        for row in cur:
            output[row[0]] = {
                'expFrag':    row[1],
                'expDamage':  row[2],
                'expSpot':    row[3],
                'expDef':     row[4],
                'expWinRate': row[5]
            }
        return output



    #Core data updaters.
    #Input: list of dictionaries.
    @staticmethod
    def insert_tankopedia(new_tankopedia):
        cur = open_conn().cursor()

        #Converting into tuples.
        inserts = []
        for tank in new_tankopedia:
            inserts.append([
                tank['tank_id'],
                tank['name'],
                tank['short_name'],
                tank['nation'],
                1 if tank['is_premium'] == True else 0,
                tank['tier'],
                tank['type']
            ])

        # NOTE: ignore updated_at.
        # TODO: remove updated_at from database.

        cur.execute('DELETE FROM tankopedia;')

        cur.executemany('''
            INSERT INTO tankopedia (tank_id, updated_at, name, short_name, nation, is_premium, tier, type)
            VALUES (?, 0, ?, ?, ?, ?, ?, ?);
        ''', inserts)

    @staticmethod
    def insert_percentiles(new_percentiles):
        cur = open_conn().cursor()

        #Converting into tuples.
        inserts = []
        for tank in new_percentiles:
            inserts.append([tank['tank_id'], pickle.dumps(tank['data'])])

        #Rewriting the whole table.
        cur.execute('DELETE FROM percentiles;')
        cur.executemany('INSERT INTO percentiles (tank_id, data) VALUES (?, ?);', inserts)

    @staticmethod
    def insert_percentiles_generic(new_percentiles):
        cur = open_conn().cursor()

        inserts = []
        for x in new_percentiles:
            inserts.append([x['tier'], x['type'], pickle.dumps(x['data'])])

        cur.execute('DELETE FROM percentiles_generic;')
        cur.executemany('INSERT INTO percentiles_generic (tier, type, data) VALUES (?, ?, ?);', inserts)

    @staticmethod
    def insert_wn8(wn8_dict):
        cur = open_conn().cursor()

        inserts = []
        for x in wn8_dict:
            inserts.append([
                x['tank_id'],
                x['expFrag'],
                x['expDamage'],
                x['expSpot'],
                x['expDef'],
                x['expWinRate']
            ])

        cur.execute('DELETE FROM wn8;')
        cur.executemany('''
            INSERT INTO wn8 (tank_id, expFrag, expDamage, expSpot, expDef, expWinRate)
            VALUES (?, ?, ?, ?, ?, ?);
        ''', inserts)
