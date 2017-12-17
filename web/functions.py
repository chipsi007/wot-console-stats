#Reuseable basic support functions.


#Filter player data according to filter input.
def filter_data(player_data, filter_input, tankopedia):
    '''Filter checkpoint according to filter_input.

    Tier filters: "1", "2", "3",  "4", "5", "6", "7", "8", "9", "10",
    Type filters: "lightTank", "mediumTank", "heavyTank", "AT-SPG", "SPG"

    Arguments:
        required: player_data:List[dict] -
        required: filter_input:Sequence[str] -
        required: tankopedia:Dict[str, dict] -
    Returns:
        List[dict] - player tanks that match the filters.
    '''


    filtered_player_data = []
    for tank in player_data:
        #Calling tankopedia tank dictionary.
        tp_dict = tankopedia.get(str(tank['tank_id']))
        if tp_dict:
            #Filtering.
            if tp_dict['type'] in filter_input and str(tp_dict['tier']) in filter_input:
                filtered_player_data.append(tank)
    return filtered_player_data



def find_difference(old_data, new_data):
    '''Substract old_data from new_data.

    Inputs are lists of dictionaries.

    Arguments:
        required: old_data:[dict] - for example checkpoint 2 weeks ago.
        required: new_data:[dict] - checkpoint later in time. for example now.
    Returns:
        [dict]

    The output slice doesnt include tanks that dont exist in the 'old_data'.
    '''

    # TODO: test if WG api returns player datas with missing tanks that previously existed on the account.
    #possibly add named argument "dont_include_new_tanks=True"

    #The function works by mutating the list.

    #Making a copy.
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
