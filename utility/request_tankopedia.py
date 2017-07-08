import requests
import json

TANKOPEDIA_PATH = '../references/tankopedia.json'

#Requesting tankopedia from WG API.
server = 'xbox'
fields = '%2C+'.join(['short_name', 'nation', 'is_premium', 'tier', 'tank_id', 'type', 'name'])
url = 'https://api-{}-console.worldoftanks.com/wotx/encyclopedia/vehicles/?application_id=demo&fields={}'.format(server, fields)

resp = requests.get(url, timeout=30).json()
assert resp['status'] == 'ok'
data = resp['data']
assert resp['meta']['count'] == len(data)

with open(TANKOPEDIA_PATH, 'w') as f:
    json.dump(data, f)
