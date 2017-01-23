#generate nav_bar, set index to 99 for everything inactive
def generate_header(index_of_current_page):
    header = [['View tank statistics', '/', 'not_current'], ['About', '/about', 'not_current']]
    for i, item in enumerate(header):
        if i == index_of_current_page:
            item[2] = 'current'
    return(header)

#create 1-row submit button
def single_submit_button(button_message):
    code = '<section class="tabs"><div><ul><li>'
    code = code + '<button type="submit" class="current">' + str(button_message) + '</button>'
    code = code + '</li></ul></div></section>'
    return(code)

#function to generate a table for the tank stats viewer
def generate_tanks_table(list_of_lists):
    #separating the headers
    headers = list_of_lists[0]
    cols_n = len(headers)
    list_of_lists = list_of_lists[1:]

    #starting the table
    code = '<section class="table"><div><table>'

    #generating the headers
    code = code + '<tr>'
    for header in headers:
        code = code + '<td style="width:' + str(100/cols_n) + '%;">'
        code = code + '<button type="submit" value="' + str(header) + '" name="header">'
        code = code + str(header) + '</button>'
        code = code + '</td>'
    code = code + '</tr> '

    #generating the table
    for row in list_of_lists:
        code = code + '<tr>'
        for c, cell in enumerate(row):
            #styling for tank names
            if c == 0:
                code = code + '<td style="width:' + str(100/cols_n) + '%; font-weight: bold; text-align: left;">'
                code = code + '&nbsp' + str(cell) + '</td>'
            else:
                code = code + '<td>' + str(cell) + '</td>'
        code = code + '</tr>'
    code = code + '</table></div></section>'
    return(code)

#generate a simple table out of list of lists
def generate_simple_table(list_of_lists):
    #starting the table
    code = '<table>'
    #generating the table
    for row in list_of_lists:
        code = code + '<tr>'
        for cell in row:
            code = code + '<td>' + str(cell) + '</td>'
        code = code + '</tr>'
    code = code + '</table>'
    return(code)
