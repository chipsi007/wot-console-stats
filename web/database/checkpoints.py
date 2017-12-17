import time
import pickle


from .utils import open_conn


#Main functions.


def get_latest_checkpoint(server, account_id):
    cur = open_conn().cursor()
    search = cur.execute('''
        SELECT created_at, data FROM checkpoints
        WHERE server = ? AND account_id = ?
        ORDER BY created_at DESC LIMIT 1;
    ''', (server, account_id)).fetchone()

    return {'created_at': search[0], 'data': pickle.loads(search[1])} if search else {}


def get_all_checkpoints(server, account_id, min_created_at=0):
    '''Get all checkpoints for selected user.
    Arguments:
        required: server:str - server
        required: account_id:int - account id
        optional: min_created_at:int - minimum unix timestamp to filter out the results (inclusive).
    Returns:
        list of dictionaries: {'created_at': int, 'data': [dict]}
    '''

    cur = open_conn().cursor()

    cur.execute(f'''
        SELECT created_at, data FROM checkpoints
        WHERE server = ? AND account_id = ? AND created_at >= ?
        ORDER BY created_at ASC
    ''', (server, account_id, min_created_at))

    return [{'created_at': row[0], 'data': pickle.loads(row[1])} for row in cur]


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


def get_checkpoint_timestamps(server, account_id, only_latest=False):
    '''Get ordered timestamps for the users checkpoints. From new to old.
    Arguments:
        required: server:str - 'ps4' or 'xbox'.
        requered: account_id:int - account id of the user.
        optional: only_latest:bool - only the latest checkpoint timestamp if True.
    Returns:
        [int]
    '''

    cur = open_conn().cursor()

    limit = 'LIMIT 1' if only_latest == True else ''

    cur.execute(f'''
        SELECT created_at FROM checkpoints
        WHERE server = ? AND account_id = ?
        ORDER BY created_at DESC {limit}
    ''', (server, account_id))

    return [x[0] for x in cur]
