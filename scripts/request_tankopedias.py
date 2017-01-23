import requests
import json

server = 'xbox'

url = 'https://api-'+server+'-console.worldoftanks.com/wotx/encyclopedia/vehicles/?application_id=demo'
request = requests.get(url)
vehicles = request.json()

tanks_dict = {}
tankopedia = []
for key, value in vehicles['data'].items():
    tank_id = value['tank_id']
    name = value['name']
    tank_type = value['type']
    tier = value['tier']
    nation = value['nation']
    tankopedia.append([tank_id, name, tier, tank_type, nation])

    if tank_id not in tanks_dict:
        tanks_dict[tank_id] = name

#saving tankopedia data
filename = '../references/tankopedia.json'
with open(filename,'w') as myfile:
    json.dump(tankopedia, myfile)

#saving dictionary 'id: name'
filename = '../references/tanks_dict.json'
with open(filename,'w') as myfile:
    json.dump(tanks_dict, myfile)
