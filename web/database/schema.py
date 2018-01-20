from .utils import open_conn


def initialize_database():

    conn = open_conn()
    cur = conn.cursor()

    cur.execute('''
        CREATE TABLE IF NOT EXISTS checkpoints (
            created_at INTEGER,
            created_by_bot INTEGER,
            account_id INTEGER,
            server TEXT,
            data BLOB,
            PRIMARY KEY (account_id, server, created_at)
        );
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS tankopedia (
            tank_id INTEGER PRIMARY KEY,
            updated_at INTEGER,
            name TEXT,
            short_name TEXT,
            nation TEXT,
            is_premium INTEGER,
            tier INTEGER,
            type TEXT
        );
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS percentiles (
            tank_id INTEGER PRIMARY KEY,
            data BLOB
        );
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS percentiles_generic (
            tier INTEGER,
            type TEXT,
            data BLOB,
            PRIMARY KEY (tier, type)
        );
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS wn8 (
            tank_id INTEGER PRIMARY KEY,
            expFrag REAL,
            expDamage REAL,
            expSpot REAL,
            expDef REAL,
            expWinRate REAL
        );
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS history (
            tank_id INTEGER,
            created_at INTEGER,
            popularity_index REAL,
            battle_life_time REAL,
            capture_points REAL,
            damage_assisted_radio REAL,
            damage_dealt REAL,
            damage_received REAL,
            direct_hits_received REAL,
            frags REAL,
            hits REAL,
            piercings REAL,
            piercings_received REAL,
            shots REAL,
            spotted REAL,
            survived_battles REAL,
            wins REAL,
            xp REAL,
            PRIMARY KEY (tank_id, created_at)
        );
    ''')

    conn.commit()
    cur.close()
