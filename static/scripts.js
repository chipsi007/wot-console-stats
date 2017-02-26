// Side menu.
function sideMenu(evt, tabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the link that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

// Top menu.
function topMenu(evt, tabName) {
    var i, x, tablinks;
    // Get all elements with class="tabcontent" and hide them
    x = document.getElementsByClassName("top-nav-content");
    for (i = 0; i < x.length; i++) {
     x[i].style.display = "none";
    }
    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("top-nav-link");
    for (i = 0; i < x.length; i++) {
     tablinks[i].className = tablinks[i].className.replace(" border-paint", "");
    }
    // Show the current tab, and add an "active" class to the link that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " border-paint";
}

// Functions for "statistics-table.html"  
function removeTable(table_id) {
    // Removing parent ID
    var element = document.getElementById(table_id);
    element.parentNode.removeChild(element);
};

function sortCells(header_id, data_array) {
    // Looking for column to sort.
    var column_to_sort = 0
    for(var h = 0; h < data_array[0].length; h++) {
        if (data_array[0][h] == header_id) {
            column_to_sort = h
            break;
        };
    };
    // Sorting.
    data_array = data_array.sort(function(a,b) {
        return b[column_to_sort] - a[column_to_sort];
    });
    return(data_array);
};

function formatCell(y, x) {
    // Assigning variables
    var data = data_array;

    // Dictionaries.
    var monthsDict = {
        "1": "Jan",
        "2": "Feb", 
        "3": "Mar",
        "4": "Apr",

        "5": "May",
        "6": "Jun",
        "7": "Jul",

        "8": "Aug",
        "9": "Sep",
        "10": "Oct",

        "11": "Nov",
        "12": "Dec"
    };
    var headersDict = {
        "tank_id": "Tank",

        "wr": "WinRate", 
        "battles": "Battles",
        "wn8": "WN8",

        "avg_dmg": "Avg DMG",
        "avg_frags": "Avg Frags",
        "avg_exp": "Avg EXP",

        "avg_dpm": "Avg DPM",
        "avg_fpm": "Avg FPM",
        "avg_epm": "Avg EPM",

        "dmg_perc": "DMG Perc",
        "wr_perc": "WR Perc",
        "exp_perc": "EXP Perc",

        "pen_hits_ratio": "Penned",
        "bounced_hits_r": "Bounced",
        "survived": "Survived",

        "total_time": "Total Lifetime",
        "avg_lifetime": "Avg Lifetime",
        "last_time": "Last Battle"
    };

    // If header.
    if (y == 0) {
        output = headersDict[data_array[0][x]];
    }
    // If cell.
    else {
        // Looking for header name.
        switch (data_array[0][x]) {
            // Percent with two decimals.
            case "wr":
            case "pen_hits_ratio":
            case "bounced_hits_r":
            case "survived":
                output = Math.round(data_array[y][x]*1000)/10 + " %";
                break;
            // Integer.
            case "wn8":
            case "avg_dmg":
            case "avg_exp":
            case "avg_dpm":
            case "avg_epm":
                output = Math.round(data_array[y][x]);
                break;
            // Float with two decimals.
            case "avg_frags":
            case "avg_fpm":
                output = Math.round(data_array[y][x]*100)/100;
                break;
            // Minutes.
            case "total_time":
                output = String(Math.round(data_array[y][x])) + "m"
                break;
            // Minutes and seconds.
            case "avg_lifetime":
                var minutes = parseInt(data_array[y][x]/60);
                var seconds = parseInt(data_array[y][x] - minutes * 60);
                output = minutes + 'm ' + seconds + 's';
                break;
            // Last battle time.
            case "last_time":
                var time = new Date(data_array[y][x]*1000);
                var output = monthsDict[String(time.getMonth()+1)] + " " + String(time.getDate());
                break;
            // Default.
            default:
                output = data_array[y][x];  
        };
    };
    return(output);  
};

function WN8ColorTag(score) {
    // Setting colors.
    var color_scale = [
        [-999, 299, "DARKRED"],
        [300,449, "ORANGERED"],
        [450,649, "DARKORANGE"],
        [650,899, "GOLD"],
        [900,1199, "YELLOWGREEN"],
        [1200,1599, "LIME"],
        [1600,1999, "DEEPSKYBLUE"],
        [2000,2449, "DODGERBLUE"],
        [2450,2899, "MEDIUMSLATEBLUE"],
        [2900,99999, "REBECCAPURPLE"]
                      ];
    // Default color.
    var color = "BLACK";
    
    // Iterating through color scale.
    for (var c = 0; c < color_scale.length; c++) {
        if ((score >= color_scale[c][0]) && (score <= color_scale[c][1])) {
            color = color_scale[c][2];
        };
    };
    
    // Creating <span> and textnode elements, setting color.
    var span = document.createElement("span");
    span.setAttribute("style", "color: " + color + "; ");
    var text = document.createTextNode(" \u25CF");
    
    // Appending textnode to <span> element.
    span.appendChild(text);
        
    return(span);
};
    
function generate_table(parent_id, data_array) {

    // Get the reference for the parent element.
    var Parent = document.getElementById(parent_id);

    // Creating <table> element and setting attributes.
    var Table = document.createElement("table");
    Table.setAttribute("class", "tanks-table");
    Table.setAttribute("id", "tanks-table");


    // Processing headers, creating <thead> element.
    var THead = document.createElement("thead");
    // Creating row.
    var row = document.createElement("tr");
    // Creating all header cells.
    for(var h = 0; h < data_array[0].length; h++) {
        // Create a <td> element
        var header = document.createElement("td");
        // Create a <button> element.
        var button = document.createElement("button");
        button.setAttribute("type", "button");
        button.setAttribute("onclick", "refreshTable(\"" + data_array[0][h] + "\");");
        // Create a text node
        var headerText = document.createTextNode(formatCell(0, h));
        // Append text node to <button> element
        button.appendChild(headerText);
        // Append button to <td> element
        header.appendChild(button);
        // Append <td> element to <tr> element
        row.appendChild(header);
    }
    // Appending <tr> into <thead>
    THead.appendChild(row);

    // Processing cells, creating, <tbody> element.
    var TBody = document.createElement("tbody");
    // Iterating through rows.
    for (var r = 1; r < data_array.length; r++) {

        // Creating <tr> element.
        var row = document.createElement("tr");

        // Special formatting for the first cell.
        var cell = document.createElement("td");
        var cellText = document.createTextNode(data_array[r][0]);
        cell.setAttribute("style", "font-weight: bold; font-size: 12px;");
        cell.appendChild(cellText);
        row.appendChild(cell);

        // Iterating through other cells.
        for (var c = 1; c < data_array[r].length; c++) {
            var cell = document.createElement("td");
            var cellText = document.createTextNode(formatCell(r, c));
            cell.appendChild(cellText);
            
            // Special condition for WN8.
            if (data_array[0][c] == "wn8") {
                cell.appendChild(WN8ColorTag(formatCell(r, c)));
            };
            
            row.appendChild(cell);
        }
        // Append the row to <tbody>.
        TBody.appendChild(row);
    }

    // Append <thead> and <tbody> into the <table>.
    Table.appendChild(THead);
    Table.appendChild(TBody);
    // Append <table> into the parent.
    Parent.appendChild(Table);
};

function refreshTable(header_id) {
    // Setting variables.
    var table_id = "tanks-table";
    var parent_id = "TableParent";
    // Calling functions.
    removeTable(table_id);
    generate_table(parent_id, sortCells(header_id, data_array));
};
