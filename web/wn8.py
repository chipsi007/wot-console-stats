from .database import db
from .wn8pc import wn8pc
from . import tankopedia


#wn8 object is a static class to calculate all wn8 related.
#load method must be called first.


# TODO: remove generic WN8 from code and keep it database.
# TODO: make it a module instead of class.


class wn8:
    @classmethod
    def load(cls):
        cls.wn8dict = db.get_wn8()

        #Unpacking generic WN8.
        cls.wn8dict_generic = {}
        for x in wn8pc:
            cls.wn8dict_generic[str(x['tier']) + x['type']] = {
                'expFrag':    x['expFrag'],
                'expDamage':  x['expDamage'],
                'expSpot':    x['expSpot'],
                'expDef':     x['expDef'],
                'expWinRate': x['expWinRate']
            }

    @classmethod
    def get_values(cls, tank_id):
        exp_values = cls.wn8dict.get(tank_id)

        if exp_values:
            return(exp_values)

        tp_dict = tankopedia.get(str(tank_id))

        if tp_dict:
            exp_values = cls.wn8dict_generic.get(str(tp_dict['tier']) + tp_dict['type'])

            if exp_values:
                return exp_values

        return None

    @classmethod
    def calculate_for_tank(cls, tank_data):
        #Loading expected values
        exp_values = cls.get_values(tank_data['tank_id'])

        #If not found.
        if exp_values is None:
            return 0

        #step 0 - assigning the variables
        expDmg      = exp_values['expDamage']
        expSpot     = exp_values['expSpot']
        expFrag     = exp_values['expFrag']
        expDef      = exp_values['expDef']
        expWinRate  = exp_values['expWinRate']

        #step 1
        rDAMAGE = tank_data['damage_dealt']             /   tank_data['battles']     / expDmg
        rSPOT   = tank_data['spotted']                  /   tank_data['battles']     / expSpot
        rFRAG   = tank_data['frags']                    /   tank_data['battles']     / expFrag
        rDEF    = tank_data['dropped_capture_points']   /   tank_data['battles']     / expDef
        rWIN    = tank_data['wins']                     /   tank_data['battles']*100 / expWinRate

        #step 2
        rWINc    = max(0,                     (rWIN    - 0.71) / (1 - 0.71) )
        rDAMAGEc = max(0,                     (rDAMAGE - 0.22) / (1 - 0.22) )
        rFRAGc   = max(0, min(rDAMAGEc + 0.2, (rFRAG   - 0.12) / (1 - 0.12)))
        rSPOTc   = max(0, min(rDAMAGEc + 0.1, (rSPOT   - 0.38) / (1 - 0.38)))
        rDEFc    = max(0, min(rDAMAGEc + 0.1, (rDEF    - 0.10) / (1 - 0.10)))

        #step 3
        WN8 = 980*rDAMAGEc + 210*rDAMAGEc*rFRAGc + 155*rFRAGc*rSPOTc + 75*rDEFc*rFRAGc + 145*min(1.8,rWINc)

        return WN8

    @classmethod
    def calculate_for_all_tanks(cls, player_data):
        battle_counter, wn8_counter = 0, 0
        for tank in player_data:
            wn8_temp = cls.calculate_for_tank(tank) * tank['battles']
            #Adding up only if WN8 value is more than 0.
            if wn8_temp > 0:
                battle_counter += tank['battles']
                wn8_counter += wn8_temp

        return wn8_counter / battle_counter if battle_counter > 0 else 0.0

    @classmethod
    def get_damage_targets(cls, tank_data):

        #Getting exp_values.
        exp_values = cls.get_values(tank_data['tank_id'])
        if not exp_values:
            return 0

        #step 1
        rSPOT  = tank_data['spotted']                / tank_data['battles']       / exp_values['expSpot']
        rFRAG  = tank_data['frags']                  / tank_data['battles']       / exp_values['expFrag']
        rDEF   = tank_data['dropped_capture_points'] / tank_data['battles']       / exp_values['expDef']
        rWIN   = tank_data['wins']                   / tank_data['battles'] * 100 / exp_values['expWinRate']
        expDmg = exp_values['expDamage']

        #Iterating through damage targets.
        output = []
        targets = [300, 450, 650, 900, 1200, 1600, 2000, 2450, 2900]
        for target in targets:

            WN8, found = 0, False
            beg, end = 1, 6000

            #Looking for the closest pair because the WN8 score might not be exact.
            while abs(beg - end) != 1 and found == False:
                mid = (beg + end) // 2

                #Finishing WN8 calculation. mid = avgDmg
                rDAMAGE = mid / expDmg
                rWINc    = max(0, (rWIN - 0.71) / (1 - 0.71))
                rDAMAGEc = max(0, (rDAMAGE - 0.22) / (1 - 0.22))
                rFRAGc   = max(0, min(rDAMAGEc + 0.2, (rFRAG - 0.12) / (1 - 0.12)))
                rSPOTc   = max(0, min(rDAMAGEc + 0.1, (rSPOT - 0.38) / (1 - 0.38)))
                rDEFc    = max(0, min(rDAMAGEc + 0.1, (rDEF - 0.10) / (1 - 0.10)))
                wn8 = 980*rDAMAGEc + 210*rDAMAGEc*rFRAGc + 155*rFRAGc*rSPOTc + 75*rDEFc*rFRAGc + 145*min(1.8,rWINc)

                #Bisect search.
                if wn8 > target:
                    end = mid
                elif wn8 < target:
                    beg = mid
                else:
                    found = True
                    end = mid

            #Always return end.
            output.append({'label': target, 'value': end})
        return output
