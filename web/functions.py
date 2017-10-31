#Reuseable basic support functions.


#Decode string sent by a client into the filter input array.
def decode_filters_string(filters_string):
    #'ab&cd&ef&' -> ['ab', 'cd', 'ef']
    items = filters_string.split('&')
    return [x for x in items if len(x) > 0]


#Filter player data according to filter input.
def filter_data(player_data, filter_input, tankopedia):
    filtered_player_data = []
    for tank in player_data:
        #Calling tankopedia tank dictionary.
        tp_dict = tankopedia.get(str(tank['tank_id']))
        if tp_dict:
            #Filtering.
            if tp_dict['type'] in filter_input and str(tp_dict['tier']) in filter_input:
                filtered_player_data.append(tank)
    return filtered_player_data


#Substract old_data from new_data.
def find_difference(old_data, new_data):
    #Making a copy to prevent changing the input.
    old_data = old_data[:]
    #Deleting tanks from 'old_data' that were not played.
    for new_tank in new_data:
        for s, old_tank in enumerate(old_data):
            if new_tank['tank_id'] == old_tank['tank_id'] and new_tank['battles'] == old_tank['battles']:
                old_data.pop(s)
                break

    #Return if empty.
    if any(old_data) == False:
        return []

    #Deleting tanks from 'new_data' that aren't in filtered 'old_data'.
    old_tank_ids = [tank['tank_id'] for tank in old_data]
    temp_list = []
    for new_tank in new_data:
        if new_tank['tank_id'] in old_tank_ids:
            temp_list.append(new_tank)
    new_data = temp_list

    #Substracting difference.
    slice_data = []
    for old_tank in old_data:
        for new_tank in new_data:
            if old_tank['tank_id'] == new_tank['tank_id']:
                #Iterating through tank dictionary.
                temp_dict = {}
                for key, value in new_tank.items():
                    temp_dict[key] = new_tank[key] - old_tank[key]
                #Preserving 'tank_id'
                temp_dict['tank_id'] = new_tank['tank_id']
                #Appending to output list.
                slice_data.append(temp_dict)
                break

    return slice_data
