import requests
import time
import json

BASE_URL = 'http://wot.pythonanywhere.com/'

def get_users(base_url):
    now = int(time.time())
    seven_days_ago = now - 60 * 60 * 24 * 7
    url = base_url + 'users-in-period/{}/{}/'.format(seven_days_ago, now)

    #Trying 3 times.
    attempts = 0
    while attempts < 3:
        try:
            resp = requests.get(url, timeout=20).json()['data']
            break
        except:
            resp = None
    return(resp)

def iterate(base_url, users):
    success_counter = 0
    for server, account_id in users:
        try:
            url = base_url + 'add-bot-checkpoint/{}/{}/'.format(server, account_id)
            resp = requests.get(url, timeout=15).text
            if resp == 'ok':
                success_counter += 1
        except:
            pass
        finally:
            time.sleep(3)

    return(success_counter)

def update_tankopedia(base_url):
    try:
        resp = requests.get(base_url + '/diag/update-tankopedia/', timeout=60).json()
        resp

        if resp['status'] != 'ok':
            print('Tankopedia couldnt be updated. Error: ' + resp.get('message'))
        else:
            print('Tankopedia was updated. ' + str(resp['count']) + ' updated tanks.')

            if resp['count'] > 0:
              for tank in resp['data']:
                string = 'NAME: {}  TIER: {}  TYPE: {}  NATION {}'\
                         .format(tank['name'], str(tank['tier']), tank['type'], tank['nation'])
                print(string)

    except Exception as e:
        print('Tankopedia couldnt be updated. Error: ' + str(e))

    time.sleep(3)

    #Reloading tankopedia.
    try:
        resp = requests.get(base_url + '/diag/reload-tankopedia/', timeout=60).json()

        if resp['status'] != 'ok':
            print('Tankopedia couldnt be reloaded. Error: ' + resp.get('message'))
        else:
            print('Tankopedia was reloaded.')

    except Exception as e:
        print('Tankopedia couldnt be reloaded. Error: ' + str(e))

def update_percentiles(base_url):

    #Updating percentiles.
    try:
        resp = requests.get(base_url+ '/diag/update-percentiles/', timeout=20).json()

        if resp['status'] != 'ok':
            print('Percentiles couldnt be updated. Error: ' + resp.get('message'))
        else:
            print('Percentiles were updated.')

    except Exception as e:
        print('Percentiles couldnt be updated. Error: ' + str(e))

    time.sleep(3)

    #Updating generic percentiles.
    try:
        resp = requests.get(base_url+ '/diag/update-percentiles-generic/', timeout=20).json()

        if resp['status'] != 'ok':
            print('Percentiles_generic couldnt be updated. Error: ' + resp.get('message'))
        else:
            print('Percentiles_generic were updated.')

    except Exception as e:
        print('Percentiles_generic couldnt be updated. Error: ' + str(e))

    time.sleep(3)

    #Reloading.
    try:
        resp = requests.get(base_url+ '/diag/reload-percentiles/', timeout=20).json()

        if resp['status'] != 'ok':
            print('Percentiles couldnt be reloaded. Error: ' + resp.get('message'))
        else:
            print('Percentiles were reloaded.')

    except Exception as e:
        print('Percentiles couldnt be reloaded. Error: ' + str(e))

def main():

    print('Started')

    update_tankopedia(BASE_URL)

    users = get_users(BASE_URL)
    if users is None:
        print('Users couldnt be downloaded. Shutting down')
        return
    print('Downloaded users')


    #Iterating.
    print('Started iterating through users.')
    success_counter = iterate(BASE_URL, users)


    #Finished.
    print('Finished adding users to the server. {} / {} successful.'.format(success_counter, len(users)))


    #Additional task on monday.
    if time.gmtime().tm_wday == 0:
        update_percentiles(BASE_URL)


if __name__ == '__main__':
    main()
