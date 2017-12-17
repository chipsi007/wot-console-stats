import time


from .utils import open_conn


#Database optimization and cleaning up.


def leave_first_checkpoint_per_week(server, account_id):
    #Scans through all user checkpoints and leaves 1st checkpont in a week. Leaves last 14 days untouched.
    cur = open_conn().cursor()
    fourteen_days_ago = int(time.time()) - (60 * 60 * 24 * 14)
    query = '''
        DELETE FROM checkpoints
        WHERE server = ? AND account_id = ? AND created_at < ? AND created_at NOT IN (
            SELECT MIN(created_at)
            FROM checkpoints
            WHERE server = ? AND account_id = ?
            GROUP BY
                strftime('%Y', created_at, 'unixepoch'),
                strftime('%W', created_at, 'unixepoch')
            );
    '''
    cur.execute(query, (server, account_id, fourteen_days_ago, server, account_id))
