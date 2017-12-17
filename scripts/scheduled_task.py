import requests
import time
import json


BASE_URL = 'http://wot.pythonanywhere.com/'


def get_users(base_url):
    now = int(time.time())
    seven_days_ago = now - 60 * 60 * 24 * 7
    url = base_url + f'users-in-period/{seven_days_ago}/{now}/'

    #Trying 3 times.
    attempts, max_attempts = 0, 3
    while attempts < max_attempts:
        try:
            resp = requests.get(url, timeout=20).json()['data']
            break
        except:
            attempts += 1
            resp = None
            time.sleep(5)

    return resp


def iterate(base_url, users):
    success_counter = 0
    for server, account_id in users:
        try:
            url = base_url + f'add-bot-checkpoint/{server}/{account_id}/'
            resp = requests.get(url, timeout=15).text
            assert resp == 'ok'
        except:
            pass
        else:
            success_counter += 1
        finally:
            time.sleep(3)

    return success_counter


def main():

    print('Downloading users...')
    users = get_users(BASE_URL)

    if users is None:
        print('Users couldnt be downloaded. Terminating.')
        return

    print('Iterating through users...')
    success_counter = iterate(BASE_URL, users)

    print(f'Finished adding users. {success_counter} / {len(users)} successful.')


if __name__ == '__main__':
    main()
