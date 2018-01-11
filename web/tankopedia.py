from . import database as db


#Tankopedia is stored as in-memory module-global, tread-local basic dictionary.
#load method must be invoked first.


# TODO: make tankopedia keys as integers


tankopedia = None


def load():
    global tankopedia
    tankopedia = db.get_tankopedia()


def get(tank_id, backup_value=None):
    return tankopedia.get(tank_id, backup_value)


def get_tank_ids(types, tiers):
    '''
    Arguments:
        types:List[str]/Set[str] - 
        tiers:List[int]/Set[int] - 
    '''

    output = []

    for item in tankopedia.values():
        if item['tier'] in tiers and item['type'] in types:
            output.append(item['tank_id'])

    return output
