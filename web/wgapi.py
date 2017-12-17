import time
import requests


from . import database as db
from .secret import app_id


#Functions to connect to WG API.


def get_player_data(server, account_id):
    '''Only for module-global use.
    Request player data from WG API. Output: ('status', 'message', [data])
    '''

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


def find_cached_or_request(server, account_id):
    '''Update the latest checkpoint for user if necessary.

    Arguments:
        required: server:str - 'ps4' or 'xbox'
        required: account_id:int - account id of the user.
    Returns:
        None/str: error message in case of error.
        None/[dict]: player data if requested by named argument.
    '''

    latest_checkpoint = db.get_latest_checkpoint(server, account_id)

    #Accept last 10 minutes.
    ten_minutes_ago = int(time.time()) - 600

    if latest_checkpoint.get('created_at', 0) >= ten_minutes_ago:
        return None, latest_checkpoint['data']

    #If nothing found or the chekpoint is too old.
    status, message, data = get_player_data(server, account_id)

    #Return error if error.
    if status != 'ok':
        return message, None

    db.add_or_update_checkpoint(server, account_id, data)

    return None, data


def get_tankopedia():
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
