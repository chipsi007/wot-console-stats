import requests
import json

#Server doesn't matter here.
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

#Saving tankopedia data
with open('../references/tankopedia.json','w') as myfile:
    json.dump(tankopedia, myfile)

with open('../references/tanks_dict.json','w') as myfile:
    json.dump(tanks_dict, myfile)
