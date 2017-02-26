import requests
import json

#Server doesn't matter here.
server = 'xbox'

url = 'https://api-'+server+'-console.worldoftanks.com/wotx/encyclopedia/vehicles/?application_id=demo'
request = requests.get(url)
vehicles = request.json()

tankopedia = {}
for key, value in vehicles['data'].items():
    tank_dict = {'name': value['name'],
                 'short_name': value['short_name'],
                 'type': value['type'],
                 'tier': value['tier'],
                 'nation': value['nation'],
                 'is_premium': value['is_premium']
                }
    tankopedia[str(value['tank_id'])] = tank_dict

#Saving tankopedia data
with open('../references/new_tankopedia.json','w') as myfile:
    json.dump(tankopedia, myfile)
