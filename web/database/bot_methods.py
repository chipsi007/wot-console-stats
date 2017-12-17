import time
import pickle


from .utils import open_conn


#Methods for the bot to create auto-checkpoints.


def get_users_in_period(start_timestamp, end_timestamp):
    #Find unique non-bot account ids in between timestamps.
    #Out: [](server:str, account_id:int)
    query = '''SELECT server, account_id FROM checkpoints
               WHERE created_by_bot != 1 AND created_at >= ? AND created_at <= ?
               GROUP BY account_id, server
               ORDER BY account_id, server'''
    cur = open_conn().cursor()
    return cur.execute(query, (start_timestamp, end_timestamp)).fetchall()

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
