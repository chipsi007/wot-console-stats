import pickle
import time

from .utils import open_conn


#Core data loaders.
#Output: {key:str: {...}}
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

def get_percentiles():
    cur = open_conn().cursor()
    output = {}
    cur.execute('SELECT tank_id, data FROM percentiles;')
    for row in cur:
        output[row[0]] = pickle.loads(row[1])
    return output

def get_percentiles_generic():
    cur = open_conn().cursor()
    output = {}
    cur.execute('SELECT tier, type, data FROM percentiles_generic;')
    for row in cur:
        output[str(row[0]) + row[1]] = pickle.loads(row[2])
    return output

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

def get_history():
    '''Get history tank history.
    
    Returns:
        Dict[int, Obj]
    '''

    cur = open_conn().cursor()
    cur.execute('SELECT tank_id, data FROM history')
    
    return {tank_id: pickle.loads(data) for tank_id, data in cur}



#Core data updaters.
#Input: list of dictionaries.
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

    # TODO: remove updated_at from database.

    cur.execute('DELETE FROM tankopedia;')

    cur.executemany('''
        INSERT INTO tankopedia (tank_id, updated_at, name, short_name, nation, is_premium, tier, type)
        VALUES (?, 0, ?, ?, ?, ?, ?, ?);
    ''', inserts)

def insert_percentiles(new_percentiles):
    cur = open_conn().cursor()

    #Converting into tuples.
    inserts = []
    for tank in new_percentiles:
        inserts.append([tank['tank_id'], pickle.dumps(tank['data'])])

    #Rewriting the whole table.
    cur.execute('DELETE FROM percentiles;')
    cur.executemany('INSERT INTO percentiles (tank_id, data) VALUES (?, ?);', inserts)

def insert_percentiles_generic(new_percentiles):
    cur = open_conn().cursor()

    inserts = []
    for x in new_percentiles:
        #Prevent NULL inserts.
        if x['data']:
            inserts.append([x['tier'], x['type'], pickle.dumps(x['data'])])

    cur.execute('DELETE FROM percentiles_generic;')
    cur.executemany('INSERT INTO percentiles_generic (tier, type, data) VALUES (?, ?, ?);', inserts)

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

def insert_history(new_values):
    cur = open_conn().cursor()

    now = int(time.time())

    inserts = []

    for value in new_values:
        tank_id = int(value['tank_id'])
        inserts.append([tank_id, now, pickle.dumps(value)])

    cur.executemany('INSERT OR REPLACE INTO history (tank_id, updated_at, data) VALUES (?, ?, ?);', inserts)
