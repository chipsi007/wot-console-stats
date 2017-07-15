import sqlite3
import requests
import json
import time

SQLITE_PATH = 'sqlite.db'


#SQL functions.
def get_sql_tankopedia(cursor):
    output = {}
    cursor.execute('SELECT tank_id, name, short_name, nation, is_premium, tier, type FROM tankopedia')
    for row in cursor:
        output[str(row[0])] = {
            "tank_id":      row[0],
            "name":         row[1],
            "short_name":   row[2],
            "nation":       row[3],
            "is_premium":   True if row[4] == 1 else False,
            "tier":         row[5],
            "type":         row[6]
        }
    return(output)
def add_tankopedia_tank(cursor, tank):

    now = int(time.time())

    result = cursor.execute('SELECT 1 FROM tankopedia WHERE tank_id = ?', (tank['tank_id'],)).fetchone()

    #Not in the database.
    if result is None:
        query = '''
            INSERT INTO tankopedia (tank_id, updated_at, name, short_name, nation, is_premium, tier, type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        '''
        cursor.execute(query, (
            tank['tank_id'],
            now,
            tank['name'],
            tank['short_name'],
            tank['nation'],
            1 if tank['is_premium'] == True else 0,
            tank['tier'],
            tank['type']
        ))

    #If in the database.
    else:
        query = '''
            UPDATE tankopedia
            SET updated_at = ?, name = ?, short_name = ?, nation = ?, is_premium = ?, tier = ?, type = ?
            WHERE tank_id = ?;
        '''
        cursor.execute(query, (
            now,
            tank['name'],
            tank['short_name'],
            tank['nation'],
            1 if tank['is_premium'] == True else 0,
            tank['tier'],
            tank['type'],
            tank['tank_id']
        ))

#Fetch tankopedia from WG.
def download():
    fields = '%2C+'.join(['name', 'short_name', 'nation', 'is_premium', 'tier', 'type', 'tank_id'])
    url = 'https://api-xbox-console.worldoftanks.com/wotx/encyclopedia/vehicles/?application_id=demo&fields=' + fields
    resp = requests.get(url, timeout=30).json()
    status = resp.get('status')
    count = resp.get('meta', {}).get('count')
    data = resp.get('data')
    assert status == 'ok'
    assert len(data) == count
    print('Tankopedia downloaded from WG')
    return(data)

def get_tanks_to_update(old_tankopedia, new_tankopedia):

    new_keys = list(new_tankopedia.keys())
    old_keys = list(old_tankopedia.keys())

    #Looking for keys that are not in the old tankopedia.
    new_ids = [key for key in new_keys if key not in old_keys]

    #Looking if any of the old ids are changed.
    diff_keys = [key for key in old_keys if old_tankopedia[key] != new_tankopedia.get(key)]

    #Getting list of tank dictionaries to add / update.
    output = []
    for key in new_ids + diff_keys:
        if new_tankopedia.get(key) is not None:
            output.append(new_tankopedia.get(key))

    return(output)

def main():

    conn = sqlite3.connect(SQLITE_PATH)
    c = conn.cursor()

    tankopedia = get_sql_tankopedia(c)

    new_tankopedia = download()

    for tank in get_tanks_to_update(tankopedia, new_tankopedia):
        add_tankopedia_tank(c, tank)

    conn.commit()
    conn.close()
    print('Updated tankopedia')


if __name__ == '__main__':
    main()
