import time
import requests

from .database import db


#wgapi object is a static class to connect to WG API.


# TODO: remove app_id as an argument, make it module-global.
# TODO: make it a module instead of class.


class wgapi:

    @staticmethod
    def get_player_data(server, account_id, app_id):
        #Request player data from WG API. Output: ('status', 'message', [data])

        url = f'https://api-{server}-console.worldoftanks.com/wotx/tanks/stats/?application_id={app_id}&account_id={account_id}'

        try:
            resp = requests.get(url, timeout=15).json()
        except requests.exceptions.Timeout:
            return('error', 'couldnt connect to WG API within specified time', None)

        #If request went through.
        status = resp.get('status')
        message = resp.get('error', {}).get('message')
        vehicles = resp.get('data', {}).get(str(account_id))
        data = None

        if status == 'error':
            pass
        elif status == 'ok' and vehicles is None:
            status, message = 'error', 'No vehicles on the account'
        elif status == 'ok':
            message, data = 'ok', []
            for vehicle in vehicles:
                #Dictionary from main values.
                temp_dict = vehicle['all']
                #Adding other values.
                temp_dict['battle_life_time'] = vehicle['battle_life_time']
                temp_dict['last_battle_time'] = vehicle['last_battle_time']
                temp_dict['mark_of_mastery'] = vehicle['mark_of_mastery']
                temp_dict['max_frags'] = vehicle['max_frags']
                temp_dict['max_xp'] = vehicle['max_xp']
                temp_dict['tank_id'] = vehicle['tank_id']
                temp_dict['trees_cut'] = vehicle['trees_cut']
                #Adding to output.
                data.append(temp_dict)
        else:
            #Unknown status
            raise

        return(status, message, data)

    @classmethod
    def find_cached_or_request(cls, server, account_id, app_id):
        #Find DB cached player data or to request and save in DB. Output: ('status', 'message', [data])

        #Trying to get results from DB first.
        player_data = db.get_latest_checkpoint(server, account_id)

        #Accept last 10 minutes. None otherwise.
        ten_minutes_ago = int(time.time()) - 600

        if player_data.get('created_at', 0) >= ten_minutes_ago :
            return('ok', 'ok', player_data['data'])

        #If no cached results, requesting from WG API.
        status, message, data = cls.get_player_data(server, account_id, app_id)

        #Updating (or creating) DB checkpoint if went fine.
        if status == 'ok':
            db.add_or_update_checkpoint(server, account_id, data)

        return(status, message, data)

    @staticmethod
    def get_tankopedia(app_id):
        fields = '%2C+'.join(['name', 'short_name', 'nation', 'is_premium', 'tier', 'type', 'tank_id'])
        url = f'https://api-xbox-console.worldoftanks.com/wotx/encyclopedia/vehicles/?application_id={app_id}&fields={fields}'
        try:
            resp = requests.get(url, timeout=10).json()
            assert resp['status'] == 'ok'
            count = resp.get('meta', {}).get('count')
            data = resp.get('data')
            assert len(data) == count
            return data
        except (requests.exceptions.Timeout, AssertionError, KeyError):
            return None
