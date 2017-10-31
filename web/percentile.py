from .database import db
from . import tankopedia


#percentile object is a static class to calculate all percentiles related.
#load method must be called first.


# TODO: make it a module instead of class.


class percentile:

    @classmethod
    def load(cls):
        #(Re)load percentiles.
        cls.percentiles = db.get_percentiles()
        cls.percentiles_generic = db.get_percentiles_generic()

    @classmethod
    def get_percentiles_array(cls, kind, tank_id):
        #Find array for specified kind and tank_id.
        array = cls.percentiles.get(tank_id, {}).get(kind)
        #If tank is in the pre-calculated table. (DEFAULT)
        if array:
            return(array)
        #If tank in tankopedia, getting generic percentile (tier-class).
        return cls.get_percentiles_generic_array(kind, tank_id)

    @classmethod
    def get_percentiles_generic_array(cls, kind, tank_id):
        #If tank in tankopedia, getting generic percentile (tier-class).
        found = tankopedia.get(str(tank_id))
        if found:
            tier_class = str(found['tier']) + found['type']
            array = cls.percentiles_generic.get(tier_class, {}).get(kind)
            return(array)
        return None

    @staticmethod
    def find_index_of_closest_value(array, number):
        #Find one closest number from sorted array and return its index.
        pair_found = False
        beg = 0
        end = len(array) - 1

        #Looking for closest pair.
        while abs(beg - end) != 1 and pair_found == False:
            mid = (beg + end) // 2
            if array[mid] == number:
                pair_found = True
                beg, end = mid, mid
            elif number < array[mid]:
                end = mid
            elif number > array[mid]:
                beg = mid
            else:
                raise

        #Getting the closest index.
        if abs(number - array[beg]) > abs(number - array[end]):
            return end
        else:
            return beg

    @classmethod
    def calculate(cls, kind, tank):
        #Calculate percentile from tank data.

        battles = tank['battles']

        if battles == 0:
            return 0

        set_a = [
            "battle_life_time", "damage_dealt", "damage_received", "xp",
            "capture_points", "damage_assisted_radio", "damage_assisted_track", "direct_hits_received",
            "no_damage_direct_hits_received", "dropped_capture_points", "explosion_hits", "explosion_hits_received",
            "frags", "hits", "trees_cut", "piercings", "piercings_received", "shots", "spotted"
        ]

        if kind in set_a:
            number = tank[kind] / battles
        elif kind in ["wins", "survived_battles", "losses"]:
            number = tank[kind] * 100 / battles
        elif kind in ["max_frags", "max_xp", "mark_of_mastery"]:
            number = tank[kind]
        elif kind == 'accuracy':
            number = tank['hits'] / tank['shots'] * 100 if tank['shots'] > 0 else 0.0
        else:
            raise

        if number > 0:
            array = cls.get_percentiles_array(kind, tank['tank_id'])
            if array is not None:
                return cls.find_index_of_closest_value(array, number)
        return 0
