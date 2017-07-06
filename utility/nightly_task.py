import requests
import time


#Get users in specified period.
def get_users():
    seven_days_ago = int(time.time()) - 60 * 60 * 24 * 7
    now = int(time.time())
    url = 'http://wot.pythonanywhere.com/users-in-period/{}/{}/'.format(seven_days_ago, now)
    resp = requests.get(url)
    output = resp.json()['data']
    return(output)

def iterate(users):
    success_counter = 0
    for server, account_id in users:
        try:
            url = 'http://wot.pythonanywhere.com/add-bot-checkpoint/{}/{}/'.format(server, account_id)
            resp = requests.get(url).text
            if resp == 'ok':
                success_counter += 1
        except:
            pass

        time.sleep(3)

    return(success_counter)

def write_log(log):
    with open('nightly_task.txt', 'w') as f:
        f.write(log)

def main():
    ###############
    msg = time.strftime('%c') + ': Task started.\n'
    log = msg
    print(msg)
    ###############

    try:
        users = get_users()
        log += time.strftime('%c') + ': Successfully obtained users from the server.\n'
    except:
        log += time.strftime('%c') + ': ERROR: Couldn\'t get users from the server.\n'

    if users:
        counter = iterate(users)
        log += time.strftime('%c') + ': Finished adding users to the server. {} / {} successful.\n'.format(counter, len(users))

    ################
    msg = time.strftime('%c') + ': Task finished.\n'
    log += msg
    print(msg)
    ################

    write_log(log)


main()
