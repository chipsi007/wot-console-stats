import sqlite3

conn = sqlite3.connect('sqlite.db')
c = conn.cursor()

c.execute('''
    CREATE TABLE IF NOT EXISTS checkpoints (
        created_at INTEGER,
        created_by_bot INTEGER,
        account_id INTEGER,
        server TEXT,
        data BLOB,
        PRIMARY KEY (account_id, server, created_at)
);''')

c.execute('''
    CREATE TABLE IF NOT EXISTS tankopedia (
        tank_id INTEGER PRIMARY KEY,
        updated_at INTEGER,
        name TEXT,
        short_name TEXT,
        nation TEXT,
        is_premium INTEGER,
        tier INTEGER,
        type TEXT
);''')

c.execute('''
    CREATE TABLE IF NOT EXISTS percentiles (
        tank_id INTEGER PRIMARY KEY,
        data BLOB
);''')

c.execute('''
    CREATE TABLE IF NOT EXISTS percentiles_generic (
        tier INTEGER,
        type TEXT,
        data BLOB,
        PRIMARY KEY (tier, type)
);''')

c.execute('''
    CREATE TABLE IF NOT EXISTS wn8 (
        tank_id INTEGER PRIMARY KEY,
        expFrag REAL,
        expDamage REAL,
        expSpot REAL,
        expDef REAL,
        expWinRate REAL
);''')

conn.commit()
conn.close()
