import sqlite3

conn = sqlite3.connect('sqlite.db')
c = conn.cursor()

c.execute('''DROP TABLE IF EXISTS checkpoints;''')
conn.commit()

#id                 autoincrementing serial
#created_at         timestamp
#created_by_bot     1 if bot, 0 otherwise
#account_id         WG id
#server             'ps4' or 'xbox'
#data               pickled data

c.execute('''CREATE TABLE IF NOT EXISTS checkpoints (
                id INTEGER PRIMARY KEY,
                created_at INTEGER,
                created_by_bot INT,
                account_id INTEGER,
                server TEXT,
                data BLOB);''')

conn.commit()
conn.close()
