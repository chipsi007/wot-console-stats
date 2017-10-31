from .database import db


#Tankopedia is stored as in-memory module-global, tread-local basic dictionary.
#load method must be invoked first.


tankopedia = None


def load():
    global tankopedia
    tankopedia = db.get_tankopedia()


def get(tank_id, backup_value=None):
    return tankopedia.get(tank_id, backup_value)
