import sqlite3
import time

conn = sqlite3.connect('sqlite.db')
cur = conn.cursor()

all_users = cur.execute('''
    SELECT server, account_id
    FROM checkpoints
    GROUP BY server, account_id
''').fetchall()


fourteen_days_ago = int(time.time()) - (60 * 60 * 24 * 14)


tuples = []
for user in all_users:
    server, account_id = user[0], user[1]
    tuples.append([server, account_id, fourteen_days_ago, server, account_id])


#Scans through all user checkpoints and leaves 1st checkpont in a week. Leaves last 14 days untouched.

cur.executemany('''
    DELETE FROM checkpoints
    WHERE server = ? AND account_id = ? AND created_at < ? AND created_at NOT IN (
        SELECT MIN(created_at)
        FROM checkpoints
        WHERE server = ? AND account_id = ?
        GROUP BY
            strftime('%Y', created_at, 'unixepoch'),
            strftime('%W', created_at, 'unixepoch')
        );
''', tuples)


conn.commit()
cur.execute('VACUUM')
conn.close()
