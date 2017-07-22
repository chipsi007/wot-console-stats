import requests
import time
import json
import os

#Logging.
class log:
    @staticmethod
    def clear():
        open('log.txt', 'w').close()
    @staticmethod
    def write(text):
        print(text)
        with open('log.txt', 'a') as f:
            timestring = time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime())
            f.write(timestring + ': ' + text + '\n')
#Update tankopedia.
def update_tankopedia():

    TANKOPEDIA_PATH = 'references/tankopedia.json'
    TEMPFILE_PATH = 'references/temp.json'

    #Requesting tankopedia from WG API.
    server = 'xbox'
    fields = '%2C+'.join(['short_name', 'nation', 'is_premium', 'tier', 'tank_id', 'type', 'name'])
    url = 'https://api-{}-console.worldoftanks.com/wotx/encyclopedia/vehicles/?application_id=demo&fields={}'.format(server, fields)
    #Trying to request 3 times.
    attempts = 0
    while attempts < 3:
        try:
            resp = requests.get(url, timeout=30).json()
            assert resp['status'] == 'ok'
            data = resp['data']
            assert resp['meta']['count'] == len(data)
            break
        except:
            data = None
    #If not successful.
    if data is None:
        log.write('Couldnt download tankopedia')
        return


    #Update tankopedia if there more tank ids in the new taankopedia.
    should_update = False
    if os.path.isfile(TANKOPEDIA_PATH) == True:
        with open(TANKOPEDIA_PATH, 'r') as f:
            old_file = json.load(f)
        if len(old_file.keys()) < len(data.keys()):
            should_update = True
    else:
        should_update = True


    #If nothing new.
    if should_update == False:
        log.write('Tankopedia should not be updated')
        return

    #Saving.
    with open(TANKOPEDIA_PATH, 'w') as f:
        json.dump(data, f)
#Get users in specified period.
def get_users():
    now = int(time.time())
    seven_days_ago = now - 60 * 60 * 24 * 7
    url = 'http://wot.pythonanywhere.com/users-in-period/{}/{}/'.format(seven_days_ago, now)

    #Trying 3 times.
    attempts = 0
    while attempts < 3:
        try:
            resp = requests.get(url, timeout=20).json()['data']
            break
        except:
            resp = None
    return(resp)
#Iterate through users and add bot checkpoint.
def iterate(users):
    success_counter = 0
    for server, account_id in users:
        try:
            url = 'http://wot.pythonanywhere.com/add-bot-checkpoint/{}/{}/'.format(server, account_id)
            resp = requests.get(url, timeout=15).text
            if resp == 'ok':
                success_counter += 1
        except:
            pass
        finally:
            time.sleep(3)

    return(success_counter)


def main():

    log.clear(), log.write('Started')

    #update_tankopedia()

    users = get_users()
    if users is None:
        log.write('Users couldnt be downloaded. Shutting down')
        return
    log.write('Downloaded users')


    #Iterating.
    log.write('Started iterating through users.')
    success_counter = iterate(users)


    #Finished.
    log.write('Finished adding users to the server. {} / {} successful.'.format(success_counter, len(users)))


if __name__ == '__main__':
    main()
