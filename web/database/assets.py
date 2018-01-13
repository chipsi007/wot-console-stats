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
def insert_tankopedia(headers, rows):
    '''
    Arguments:
        headers:List[str] - must be equal to ['tank_id', 'name', 'short_name', 'nation', 'is_premium', 'tier', 'type']
        rows:List[List]   - rows with types [int, str, str, str, bool, int, str]
    '''

    columns = ['tank_id', 'name', 'short_name', 'nation', 'is_premium', 'tier', 'type']
    
    #Validation and transformation.
    assert headers == columns, 'headers dont match database columns'
    inserts = []
    for x in rows:
        inserts.append([
            x[0],
            x[1],
            x[2],
            x[3],
            1 if x[4] == True else 0,
            x[5],
            x[6]
        ])

    # TODO: remove updated_at from database.
    cur = open_conn().cursor()
    columns_str, questions_str = ', '.join(columns), ', '.join(['?' for _ in columns])
    cur.executemany(f'INSERT OR REPLACE INTO tankopedia ({columns_str}) VALUES ({questions_str})', inserts)

def insert_percentiles(headers, rows):
    '''
    Arguments:
        headers:List[str] - must be equal to ['tank_id', 'data']
        rows:List[List]   - rows with types [int, Dict]
    '''

    columns = ['tank_id', 'data']

    #Validation and transformation.
    assert headers == columns, 'headers dont match database columns'
    inserts = [(x[0], pickle.dumps(x[1])) for x in rows]

    cur = open_conn().cursor()
    columns_str, questions_str = ', '.join(columns), ', '.join(['?' for _ in columns])
    cur.executemany(f'INSERT OR REPLACE INTO percentiles ({columns_str}) VALUES ({questions_str});', inserts)

def insert_percentiles_generic(headers, rows):
    '''
    Arguments:
        headers:List[str] - must be equal to ['tier', 'type', 'data']
        rows:List[List]   - rows with types [int, str, Dict]
    '''

    columns = ['tier', 'type', 'data']

    #Validation and transformation.
    assert headers == columns, 'headers dont match database columns'
    inserts = [(x[0], x[1], pickle.dumps(x[2])) for x in rows if x[2]] # 'if x[2]' to prevent NULL inserts.

    cur = open_conn().cursor()
    columns_str, questions_str = ', '.join(columns), ', '.join(['?' for _ in columns])
    cur.executemany(f'INSERT OR REPLACE INTO percentiles_generic ({columns_str}) VALUES ({questions_str})', inserts)

def insert_wn8(headers, rows):
    '''
    Arguments:
        headers:List[str] - must be equal to ['tank_id', 'expFrag', 'expDamage', 'expSpot', 'expDef', 'expWinRate']
        rows:List[List]   - rows with types [int, float, float, float, float, float]
    '''

    columns = ['tank_id', 'expFrag', 'expDamage', 'expSpot', 'expDef', 'expWinRate']

    #Validation and transformation.
    assert headers == columns, 'headers dont match database columns'
    for row in rows:
        assert len(row) == len(columns), 'encountered a row with wrong length'

    cur = open_conn().cursor()
    columns_str, questions_str = ', '.join(columns), ', '.join(['?' for _ in columns])
    cur.executemany(f'INSERT OR REPLACE INTO wn8 ({columns_str}) VALUES ({questions_str})', rows)

def insert_history(headers, rows):

    columns = [
        'tank_id',          'created_at',         'popularity_index',      
        'battle_life_time', 'capture_points',     'damage_assisted_radio',
        'damage_dealt',     'damage_received',    'direct_hits_received',  
        'frags',            'hits',               'losses',  
        'piercings',        'piercings_received', 'shots',  
        'spotted',          'survived_battles',   'wins', 
        'xp'
    ]

    #Headers must columns.
    assert headers == columns, 'Headers dont match database columns'

    #Insert. Ignore rows where tank_id - created_at pair already exist.
    columns_str, questions_str = ', '.join([x for x in columns]), ', '.join(['?' for _ in columns])
    cur = open_conn().cursor()
    #INSERT OR IGNORE because history never changes.
    cur.executemany(f'INSERT OR IGNORE INTO history ({columns_str}) VALUES ({questions_str});', rows)

    #Remove records with old created_at timestamp.
    twenty_weeks_ago = time.time() - 60 * 60 * 24 * 7 * 20
    cur.execute('DELETE FROM history WHERE created_at < ?', [twenty_weeks_ago])

    #Leave 1st record per week per tank_id.
    cur.execute('SELECT DISTINCT(tank_id) FROM history')
    deletes = [(x[0], x[0]) for x in cur]
    cur.executemany('''
        DELETE FROM history
        WHERE tank_id = ? AND created_at NOT IN (
            SELECT MIN(created_at)
            FROM history
            WHERE tank_id = ?
            GROUP BY
                strftime('%Y', created_at, 'unixepoch'),
                strftime('%W', created_at, 'unixepoch')
            );
    ''', deletes)