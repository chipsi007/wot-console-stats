import sqlite3

conn = sqlite3.connect('sqlite.db')
c = conn.cursor()

c.execute('''DROP TABLE IF EXISTS checkpoints;''')
conn.commit()

#rowid              INTEGER     hidden autoincrementing serial
#created_at         INTEGER     timestamp
#created_by_bot     INTEGER     1 if bot, 0 otherwise
#account_id         INTEGER     WG id
#server             TEXT        'ps4' or 'xbox'
#data               BLOB        pickled data

c1.execute('''CREATE TABLE IF NOT EXISTS checkpoints (
                created_at INTEGER,
                created_by_bot INTEGER,
                account_id INTEGER,
                server TEXT,
                data BLOB,
                PRIMARY KEY (account_id, server, created_at));''')

conn.commit()
conn.close()
