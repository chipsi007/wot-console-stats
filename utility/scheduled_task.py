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


if __name__ == '__main__':
    main()
