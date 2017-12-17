from flask import Response
import json
import time


from .. import app
from .. import wgapi
from .. import database as db


#General support endpoints.


#Request users in period.
@app.route('/users-in-period/<int:start_timestamp>/<int:end_timestamp>/')
def users_in_period(start_timestamp, end_timestamp):
    start = time.time()

    users = db.get_users_in_period(start_timestamp, end_timestamp)

    return Response(json.dumps({
        'status': 'ok',
        'message': 'ok',
        'data': users,
        'count': len(users),
        'time': time.time() - start
    }), mimetype='application/json')


#Add checkpoint marked as bot-created if was not created today already.
@app.route('/add-bot-checkpoint/<server>/<int:account_id>/')
def add_checkpoint(server, account_id):

    #Validation.
    if server not in ['xbox', 'ps4']:
        return 'error'

    #Cleaning up.
    db.leave_first_checkpoint_per_week(server, account_id)

    #Checking if the checkpoint already was created today before sending http request for data.
    if db.is_created_today(server, account_id) == True:
        return 'ok'

    #Fetching the player.
    status, message, data = wgapi.get_player_data(server, account_id)

    if status != 'ok':
        return 'error: player couldnt be fetched'

    #Adding to the database.
    db.add_bot_checkpoint(server, account_id, data)
    return 'ok'


#Request snapshots straight from DB.
@app.route('/api-request-snapshots/<server>/<int:account_id>/')
def api_request_snapshots(server, account_id):
    start = time.time()

    #Validation.
    try:
        assert server in ('xbox', 'ps4'), "server must be either 'xbox' or 'ps4'"
    except Exception as e:
        return Response(json.dumps({
            'status': 'error',
            'message': str(e)
        }), mimetype='application/json')

    #Database fetch.
    fourteen_days_ago = int(time.time()) - 60 * 60 * 24 * 14
    data = db.get_all_checkpoints(server, account_id, min_created_at=fourteen_days_ago)

    #Output.
    return Response(json.dumps({
        'status': 'ok',
        'message': 'ok',
        'count': len(data),
        'server': server,
        'account_id': account_id,
        'data': data,
        'time': time.time() - start
    }), mimetype='application/json')
