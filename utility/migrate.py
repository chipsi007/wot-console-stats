import sqlite3
import json
import time
import pickle

#Creating databases.
import create_db


conn = sqlite3.connect('sqlite.db')
cur = conn.cursor()
cur.execute('PRAGMA journal_mode = MEMORY;')


#Moving tankopedia.
with open('references/tankopedia.json', 'r') as f:
    tankopedia = json.load(f)

def add_tankopedia_tank(cursor, tank):

    now = int(time.time())

    result = cursor.execute('SELECT 1 FROM tankopedia WHERE tank_id = ?', (tank['tank_id'],)).fetchone()

    #Not in the database.
    if result is None:
        cursor.execute('''
            INSERT INTO tankopedia (tank_id, updated_at, name, short_name, nation, is_premium, tier, type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        ''', (
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
        cursor.execute('''
            UPDATE tankopedia
            SET updated_at = ?, name = ?, short_name = ?, nation = ?, is_premium = ?, tier = ?, type = ?
            WHERE tank_id = ?;
        ''', (
            now,
            tank['name'],
            tank['short_name'],
            tank['nation'],
            1 if tank['is_premium'] == True else 0,
            tank['tier'],
            tank['type'],
            tank['tank_id']
        ))

for _, tank in tankopedia.items():
    add_tankopedia_tank(cur, tank)
conn.commit()



#Moving percentiles.
with open('references/percentiles.json', 'r') as f:
    percentiles = json.load(f)
#Filling with tanks.
output = {}
for key in percentiles['wr'].keys():
    output[int(key)] = {}
#Adding winrate.
for key, value in percentiles['wr'].items():
    output[int(key)]["wins"] = value
for key, value in percentiles['dmgc'].items():
    output[int(key)]["damage_dealt"] = value
for key, value in percentiles['exp'].items():
    output[int(key)]["xp"] = value
for key, value in percentiles['rass'].items():
    output[int(key)]["damage_assisted_radio"] = value
for key, value in percentiles['dmgr'].items():
    output[int(key)]["damage_received"] = value
for key, value in percentiles['acc'].items():
    output[int(key)]["accuracy"] = value
#Adding into sql.
for key, value in output.items():
    cur.execute('INSERT INTO percentiles (tank_id, data) VALUES (?, ?);', [key, pickle.dumps(value)])
conn.commit()



#Moving generic percentiles.
with open('references/percentiles_generic.json', 'r') as f:
    percentiles = json.load(f)
#Filling with keys.
output = {}
for key in percentiles['wr'].keys():
    output[key] = {}
#Adding winrate.
for key, value in percentiles['wr'].items():
    output[key]["wins"] = value
for key, value in percentiles['dmgc'].items():
    output[key]["damage_dealt"] = value
for key, value in percentiles['exp'].items():
    output[key]["xp"] = value
for key, value in percentiles['rass'].items():
    output[key]["damage_assisted_radio"] = value
for key, value in percentiles['dmgr'].items():
    output[key]["damage_received"] = value
for key, value in percentiles['acc'].items():
    output[key]["accuracy"] = value
#Adding into sql.
for key, value in output.items():
    digit_string = ''.join(x for x in key if x.isdigit())
    tank_tier = int(digit_string)
    tank_type = key.replace(digit_string, '')
    cur.execute('''
        INSERT INTO percentiles_generic (tier, type, data)
        VALUES (?, ?, ?);
    ''', [tank_tier, tank_type, pickle.dumps(value)])
conn.commit()



#Moving wn8
with open('references/wn8console.json', 'r') as f:
    wn8 = json.load(f)['data']
#Adding into sql.
for item in wn8:
    cur.execute('''
        INSERT INTO wn8 (tank_id, expFrag, expDamage, expSpot, expDef, expWinRate)
        VALUES (?, ?, ?, ?, ?, ?);
    ''', [item['IDNum'], item['expFrag'], item['expDamage'], item['expSpot'], item['expDef'], item['expWinRate']])
conn.commit()


#Moving generic wn8
with open('references/wn8.json', 'r') as f:
    wn8 = json.load(f)
for item in wn8:
    cur.execute('''
        INSERT INTO wn8_generic (tier, type, expFrag, expDamage, expSpot, expDef, expWinRate)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    ''', [item['tier'], item['type'], item['expFrag'], item['expDamage'], item['expSpot'], item['expDef'], item['expWinRate']])
conn.commit()


conn.close()
