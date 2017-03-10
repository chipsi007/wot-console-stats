// Switch tabs.
function switchTab(evt, tabName) {
    // Hide all elements with class="tabcontent".
    var contents = document.getElementsByClassName("tabcontent");
    for (var c = 0; c < contents.length; c++) {
        contents[c].style.display = "none";
    }
    // Deactivate all elements with class="tablinks".
    var links = document.getElementsByClassName("tablinks");
    for(var l = 0; l < links.length; l++) {
        links[l].className = links[l].className.replace(" is-active", "");
    }
    // Add "is-active" to selected tab, show corresponding contents.
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " is-active";  
}


// Hamburger menu toggle.
function hamburgerToggle() {
    
    toggleButton = document.getElementById("nav-toggle");
    navMenu = document.getElementById("nav-menu");
    
    // If hamburger toggle is active.
    if (toggleButton.classList.contains("is-active")) {
        toggleButton.className = toggleButton.className.replace(" is-active", "");
        navMenu.className = navMenu.className.replace(" is-active", "");
    }
    // If hamburger toggle is not active.
    else {
        
        toggleButton.className = toggleButton.className.replace(" is-active", "");
        navMenu.className = navMenu.className.replace(" is-active", "");
        
        toggleButton.className += " is-active";
        navMenu.className += " is-active";  
    }  
}


//// Function that controls user input items.
function formClass() {
    
    // Defaults.
    this.server = "xbox";
    this.nickname = "";
    this.data_input = [];
    this.filter_input = [];
    this.filter_by_50 = "unchecked";
    
    this.formName = "theForm";
    this.inputName = "form_data";
    
    
    // Convert list to string and vice versa.
    this.listToString = function(list) {
        
        var output = list.join("&");
        
        return(output);
    };
    this.stringToList = function(string) {
        
        var output = string.split("&");
                
        return(output); 
    };
    
    
    // Get cookie by name.
    this.getCookie = function(cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for(var i = 0; i <ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    };
    // Get form data from cookies.
    this.takeCookieData = function() {
        
        var server = this.getCookie("server");
        if (server !== "") {
            this.server = server;
        }
        
        // Function getCookie returns " if cookie string has whitespaces.
        this.nickname = this.getCookie("nickname").replace(/"/g , "");
        
        var data_input_str = this.getCookie("data_input");
        if (data_input_str !== "") {
            this.data_input = this.stringToList(data_input_str);
        }
        
        var filter_input_str = this.getCookie("filter_input");
        if (filter_input_str !== "") {
            this.filter_input = this.stringToList(filter_input_str);
        }
        
        
        this.filter_by_50 = this.getCookie("filter_by_50");
        
    };
    
    
    // Initialize form functions.
    this.initBasics = function() {
        
        // Nickname.
        document.getElementById("nickname").value = this.nickname;

        // Server.
        if (this.server == "xbox") {
            document.getElementById("xbox").className += " is-active";

        } else if (this.server == "ps4") {
            document.getElementById("ps4").className += " is-active";
        }
    };
    this.initFilters = function() {
        
        // Filter selectors.
        for(var i = 0; i < this.filter_input.length; i++) {
            document.getElementById(this.filter_input[i]).className += " is-active";
        }
    };
    this.initFilterBy50 = function() {
        // filter_by_50
        if (this.filter_by_50 == "checked") {
            document.getElementById("filter_by_50").className += " is-active";
        }
    };
    this.initDataSelectors = function() {
        
        // Data selectors.
        for(var i = 0; i < this.data_input.length; i++) {
            document.getElementById(this.data_input[i]).className += " is-active";
        }
    };

    
    // Toggles.
    this.serverToggle = function(id) {

        // Getting reference for buttons.
        var xboxButton = document.getElementById("xbox");
        var ps4Button = document.getElementById("ps4");

        // Deselecting both buttons.
        xboxButton.className = xboxButton.className.replace(" is-active", "");
        ps4Button.className = ps4Button.className.replace(" is-active", "");

        // Checking conditions.
        if (id == "xbox") {
            xboxButton.className += " is-active";
            this.server = "xbox";

        } else if (id == "ps4") {
            ps4Button.className += " is-active";
            this.server = "ps4";
        }
    };
    this.filterBy50Toggle = function() {

        // Reference for the button.
        var button = document.getElementById("filter_by_50");

        // Checking conditions.
        if (this.filter_by_50 == "checked") {
            button.className = button.className.replace(" is-active", "");
            this.filter_by_50 = "unchecked";
            
        } else {
            button.className += " is-active";
            this.filter_by_50 = "checked";
        }
    };
    this.dataSelToggle = function(id) {

        // Reference for button.
        var button = document.getElementById(id);
        // Looking for index in the array.
        var index = this.data_input.indexOf(id);

        // If in the array.
        if (index != -1) {
            this.data_input.splice(index, 1);
            button.className = button.className.replace(" is-active", "");
        }
        
        // If not in the array.
        else {
            this.data_input.push(id);
            button.className += " is-active";
        }
    };
    this.filtersToggle = function(id) {

        // Reference for button.
        var button = document.getElementById(id);
        // Looking for index in the array.
        var index = this.filter_input.indexOf(id);

        // If in the array.
        if (index != -1) {
            this.filter_input.splice(index, 1);
            button.className = button.className.replace(" is-active", "");
        }
        // If not in the array.
        else {
            this.filter_input.push(id);
            button.className += " is-active";
        }
    };

    
    // Reset filters.
    this.resetFilters = function() {

        var button;

        // Deselect all buttons
        for(var i = 0; i < this.filter_input.length; i++) {
            button = document.getElementById(this.filter_input[i]);
            button.className = button.className.replace(" is-active", "");
        }

        // Empty the variable.
        this.filter_input = [];
    };
    
    
    // Function to assemble data and submit the form.
    this.submit = function() {

        // Putting nickname into the array.
        this.nickname = document.getElementById("nickname").value;

        // Putting the data dictionary into the <input>.
        var input = document.getElementsByName(this.inputName)[0];
        input.value = JSON.stringify({
            "nickname": this.nickname,
            "server": this.server,
            "data_input": this.data_input,
            "filter_input": this.filter_input,
            "filter_by_50": this.filter_by_50
        });

        // Submit the form.
        document.forms[this.formName].submit();

    };
    
    // Custom submit buttons for "session-tracker.html" with additional custom parameter.
    this.requestSession = function(id) {

        // Putting nickname into the array.
        this.nickname = document.getElementById("nickname").value;

        // Putting the data dictionary into the <input>.
        input = document.getElementsByName(this.inputName)[0];
        
        input.value = JSON.stringify({
            "nickname": this.nickname,
            "server": this.server,
            "data_input": this.data_input,
            "filter_input": this.filter_input,
            "filter_by_50": this.filter_by_50,
            "request_session": id
        });
        
        // Submit the form.
        document.forms[this.formName].submit();
    };
    
}


//// Function for "player-profile.html"
function playerProfileClass(xLabels, wn8Totals, percentilesTotals, recent, allTime) {
    
    
    this.xLabels = xLabels;
    this.wn8Totals = wn8Totals;
    this.percentilesTotals = percentilesTotals;
    this.recent = recent;
    this.allTime = allTime;
    
    
    this.WN8ChCanvas = "WN8Canvas";
    this.PercChCanvas = "PercCanvas";
    this.RadChCanvas = "RadChCanvas";
    
    this.tabContentClass = "tabcontent";
    this.tabLinksClass = "tablinks";
    
    
    this.OpenWN8Ch = function() {
        WN8Ch = new Chart(document.getElementById(this.WN8ChCanvas), {
            type: 'line',
            data:  {
                labels: this.xLabels,
                datasets: [{
                    label: 'WN8',
                    fill: true,
                    backgroundColor: "hsla(200, 25%, 63%, 0.1)", 
                    borderColor: "hsl(200, 25%, 63%)", 
                    pointBackgroundColor: "hsl(200, 25%, 63%)", 
                    pointBorderColor: "#ffffff", 
                    pointHoverBackgroundColor: "#ffffff", 
                    pointHoverBorderColor: "hsl(200, 25%, 63%)", 
                    data: this.wn8Totals,
                }]
            },
            options: {
                title: {
                    display: true,
                    text: 'Total WN8'
                },
                legend: {
                    display: false
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            callback: function(label, index, labels) {
                                return Math.round(label);
                            }
                        }
                    }]
                }
            }
        });
    };

    this.OpenPercCh = function() {
        PercCh = new Chart(document.getElementById(this.PercChCanvas), {
            type: 'line',
            data:  {
                labels: this.xLabels,
                datasets: [{
                    label: 'Total Percentile',
                    fill: true,
                    backgroundColor: "hsla(130, 25%, 63%, 0.1)", 
                    borderColor: "hsl(130, 25%, 63%)", 
                    pointBackgroundColor: "hsl(130, 25%, 63%)", 
                    pointBorderColor: "#ffffff", 
                    pointHoverBackgroundColor: "#ffffff", 
                    pointHoverBorderColor: "hsl(130, 25%, 63%)", 
                    data: this.percentilesTotals,
                }],
            },
            options: {
                title: {
                    display: true,
                    text: 'Total Percentile'
                },
                legend: {
                    display: false,
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            callback: function(label, index, labels) {
                                return Math.round(label*100)/100;
                            }
                        },
                    }],
                },
            },
        });
    };

    this.OpenRadCh = function() {
        RadCh = new Chart(document.getElementById(this.RadChCanvas), {
            type: 'radar',
            data:  {
                labels: ['Accuracy', 'Damage Caused', 'Radio Assist', 'WinRate', 'Damage Received (inv)'],
                datasets: [{
                    label: 'Recent Percentiles',
                    fill: true,
                    backgroundColor: "hsla(0, 35%, 63%, 0.2)", 
                    borderColor: "hsl(0, 35%, 63%)", 
                    pointBackgroundColor: "hsl(0, 35%, 63%)", 
                    pointBorderColor: "#ffffff", 
                    pointHoverBackgroundColor: "#ffffff", 
                    pointHoverBorderColor: "hsl(0, 35%, 63%)", 
                    data: [this.recent.percentiles.acc, this.recent.percentiles.dmgc, this.recent.percentiles.rass, this.recent.percentiles.wr, this.recent.percentiles.dmgr],
                },
                {   
                    label: 'All Time Percentiles',
                    fill: true,
                    backgroundColor: "hsla(200, 25%, 63%, 0.1)", 
                    borderColor: "hsl(200, 25%, 63%)", 
                    pointBackgroundColor: "hsl(200, 25%, 63%)", 
                    pointBorderColor: "#ffffff", 
                    pointHoverBackgroundColor: "#ffffff", 
                    pointHoverBorderColor: "hsl(200, 25%, 63%)", 
                    data: [this.allTime.percentiles.acc, this.allTime.percentiles.dmgc, this.allTime.percentiles.rass, this.allTime.percentiles.wr, this.allTime.percentiles.dmgr],
                }]
            },
            options: {
                scale: {
                    ticks: {
                        beginAtZero: true
                    }
                }
            }
        });
    };
    
    
    // Switch tabs, draw/destroy charts.
    this.switchTab = function(evt, tabID) {
        
        // Hide all contents with class defined in "this.tabContentClass".
        var contents = document.getElementsByClassName(this.tabContentClass);
        for(var c = 0; c < contents.length; c++) {
            contents[c].style.display = "none";
        }
        
        // Deactivate all elements with class defined in "this.tabLinksClass".
        var links = document.getElementsByClassName(this.tabLinksClass);
        for(var l = 0; l < links.length; l++) {
            links[l].className = links[l].className.replace(" is-active", "");
        }
        
        // Add "is-active" to selected tab, show corresponding contents.
        document.getElementById(tabID).style.display = "block";
        evt.currentTarget.className += " is-active";
        
        
        if (tabID == "dashboard") {
            
            this.OpenWN8Ch();
            this.OpenPercCh();

            if ((typeof RadCh) == "object") {
                RadCh.destroy();
            }
        
        } else if (tabID == "in-detail") {
            
            this.OpenRadCh();

            if ((typeof WN8Ch) == "object") {
                WN8Ch.destroy();
            }
            if ((typeof PercCh) == "object") {
                PercCh.destroy();
            }
        }
    };
}


//// Functions for "vehicles.html"
function vehiclesPage(data) {
    
    this.data = data;
    this.parentID = "TableParent";
    this.tableID = "StatisticsTable";
    this.instance = "page";
    
    this.headers = data.slice(0,1)[0];
    this.unsortedArray = data.slice(1);
    
    
    // Sort "this.unsortedArray" into "this.sortedArray".
    this.sortCells = function(headerID) {
        
        var column_to_sort = 0;
        
        for(var h = 0; h < this.headers.length; h++) {
            
            if (this.headers[h] == headerID) {
                column_to_sort = h;
                break;
            }
        }
        
        // Sorting.
        this.sortedArray = this.unsortedArray.sort(function(a,b) {
            return b[column_to_sort] - a[column_to_sort];
        });
    };
    
    
    // Format one cell. Used inside "this.generateTable"
    this.formatCell = function(y, x) {

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
        if (y == "header") {
            var output = headersDict[this.headers[x]];
        }
        // If cell.
        else {
            // Looking for header name.
            switch (this.headers[x]) {
                // Percent with two decimals.
                case "wr":
                case "pen_hits_ratio":
                case "bounced_hits_r":
                case "survived":
                    var output = Math.round(this.sortedArray[y][x]*1000)/10 + " %";
                    break;
                // Integer.
                case "wn8":
                case "avg_dmg":
                case "avg_exp":
                case "avg_dpm":
                case "avg_epm":
                    var output = Math.round(this.sortedArray[y][x]);
                    break;
                // Float with two decimals.
                case "avg_frags":
                case "avg_fpm":
                    var output = Math.round(this.sortedArray[y][x]*100)/100;
                    break;
                // Minutes.
                case "total_time":
                    var output = String(Math.round(this.sortedArray[y][x])) + "m";
                    break;
                // Minutes and seconds.
                case "avg_lifetime":
                    var minutes = parseInt(this.sortedArray[y][x]/60);
                    var seconds = parseInt(this.sortedArray[y][x] - minutes * 60);
                    var output = minutes + 'm ' + seconds + 's';
                    break;
                // Last battle time.
                case "last_time":
                    var time = new Date(this.sortedArray[y][x]*1000);
                    var output = monthsDict[String(time.getMonth()+1)] + " " + String(time.getDate());
                    break;
                // Default.
                default:
                    var output = this.sortedArray[y][x];  
            }
        }
        
        return(output); 
    };
    
    
    // Not used.
    this.WN8ColorTag = function(score) {
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
            }
        }

        // Creating <span> and textnode elements, setting color.
        var span = document.createElement("span");
        span.setAttribute("style", "color: " + color + "; ");
        var text = document.createTextNode(" \u25CF");

        // Appending textnode to <span> element.
        span.appendChild(text);

        return(span);
    };
    
    
    // Generating the table.
    this.generateTable = function() {

        // Get the reference for the parent element.
        var parent = document.getElementById(this.parentID);

        // Creating <table> element and setting attributes.
        var table = document.createElement("table");
        table.setAttribute("class", "table is-bordered is-narrow is-striped");
        table.setAttribute("id", this.tableID);


        // Processing headers.
        var thead = document.createElement("thead");
        var tr = document.createElement("tr");
        // Iterating through headers.
        for(var h = 0; h < this.headers.length; h++) {
            var th = document.createElement("th");
            var a = document.createElement("a");
            a.setAttribute("onclick", this.instance + ".refreshTable(\"" + this.headers[h] + "\")");
            var textNode = document.createTextNode(this.formatCell("header", h));
            // Appending.
            a.appendChild(textNode);
            th.appendChild(a);
            tr.appendChild(th);
        }
        thead.appendChild(tr);


        // Processing footer.
        var tfoot = document.createElement("tfoot");
        var tr = document.createElement("tr");
        // Iterating through cells.
        for(var h = 0; h < this.headers.length; h++) {
            // Creating elements.
            var th = document.createElement("th");
            var textNode = document.createTextNode(this.formatCell("header", h));
            // Appending elements in other direction.
            th.appendChild(textNode);
            tr.appendChild(th);
        }
        tfoot.appendChild(tr);


        // Processing cells.
        var tbody = document.createElement("tbody");
        // Iterating through rows.
        for (var r = 0; r < this.sortedArray.length; r++) {

            // Creating <tr> element.
            var tr = document.createElement("tr");

            // Iterating through cells.
            for (var c = 0; c < this.sortedArray[r].length; c++) {
                var td = document.createElement("td");
                var textNode = document.createTextNode(this.formatCell(r, c));
                td.appendChild(textNode);
                tr.appendChild(td);
            }
            // Append the row to <tbody>.
            tbody.appendChild(tr);
        }

        // Appending elements into the <table> and parent element.
        table.appendChild(thead);
        table.appendChild(tbody);
        table.appendChild(tfoot);
        parent.appendChild(table);
    };
    
    
    // Remove the table if exists.
    this.removeTable = function() {
        
        var element = document.getElementById(this.tableID);
        
        if (element !== null) {
            
            element.parentNode.removeChild(element);
        }    
    };
    
    
    // Remove table, sort data and draw the table.
    this.refreshTable = function(headerID) {

        this.removeTable();
        
        this.sortCells(headerID);

        this.generateTable();
    };  
}




//// Functions for "session-tracker.html"
function sessionTracker(sessionTanks) {
    
    this.sessionTanks = sessionTanks;
    this.parentID = "TableParent";
    this.tableID = "StatisticsTable";
    this.RadarChartCanvas = "RadChCanvas";
    this.menuLinksClass = "menulinks";
    
    // Find tank by tankID. tankID is string.
    this.findTank = function(tankID) {
        
        // Creating a placeholder.
        this.tank = {};

        // Looking for "tank_id"
        for(var i = 0; i < this.sessionTanks.length; i++) {
            
            if (("tank_id" in this.sessionTanks[i]) && (String(this.sessionTanks[i].tank_id) == tankID)) {
                
                this.tank = this.sessionTanks[i];
                break;
            }
        }
        
    };
    
    // Draw radar chart.
    this.openRadarChart = function() {
        RadarChart = new Chart(document.getElementById(this.RadarChartCanvas), { 
            type: 'radar', 
            data: { 
                labels: ["Accuracy", "Damage Caused", "Radio Assist", "Experience", "Damage Received (inv)"], 
                datasets: [{ 
                    label: "Selected period",
                    backgroundColor: "hsla(0, 35%, 63%, 0.2)",
                    borderColor: "hsl(0, 35%, 63%)",
                    pointBackgroundColor: "hsl(0, 35%, 63%)",
                    pointBorderColor: "#ffffff",
                    pointHoverBackgroundColor: "#ffffff",
                    pointHoverBorderColor: "hsl(0, 35%, 63%)",
                    data: this.tank.radar_session
                },
                {
                    label: "All time",
                    backgroundColor: "hsla(195, 20%, 63%, 0.1)",
                    borderColor: "hsl(195, 20%, 63%)",
                    pointBackgroundColor: "hsl(195, 20%, 63%)",
                    pointBorderColor: "#ffffff",
                    pointHoverBackgroundColor: "#ffffff",
                    pointHoverBorderColor: "hsl(195, 20%, 63%)",
                    data: this.tank.radar_all
                }]
            },
            options: {
                scale: {
                    ticks: {
                        beginAtZero: true
                    }
                }
            }  
        });
    };
    
    // Generate table.
    this.generateTable = function() {
        
        // Get the reference for the parent element.
        var parent = document.getElementById(this.parentID);


        // Creating <table> element and setting attributes.
        var table = document.createElement("table");
        table.setAttribute("class", "table");
        table.setAttribute("id", this.tableID);


        // Processing headers.
        var thead = document.createElement("thead");
        // First header row.
        var tr = document.createElement("tr");
        var th = document.createElement("th");
        th.setAttribute("colspan", "3");
        var string = this.tank.tank_name + " Battles: " + this.tank.battles_session + "  Wins: " + this.tank.wins_session;
        var textNode = document.createTextNode(string);
        th.appendChild(textNode);
        tr.appendChild(th);
        thead.appendChild(tr);
        // Second header row.
        var headers = ["Averages", "Session", "All time"];
        var tr = document.createElement("tr");
        for(var h = 0; h < headers.length; h++) {
            // Creating elements.
            var th = document.createElement("th");
            var textNode = document.createTextNode(headers[h]);
            // Appending elements in other direction.
            th.appendChild(textNode);
            tr.appendChild(th);
        }
        thead.appendChild(tr);

        
        // Processing cells.
        var cells = [["Accuracy", this.tank.acc_session, this.tank.acc_all],
                     ["Damage Caused", this.tank.dmgc_session, this.tank.dmgc_all],
                     ["Radio Assist", this.tank.rass_session, this.tank.rass_all],
                     ["Experience", this.tank.exp_session, this.tank.exp_all],
                     ["Damage Received", this.tank.dmgr_session, this.tank.dmgr_all],
                     ["Lifetime", this.tank.lifetime_session, this.tank.lifetime_all],
                     ["DPM", this.tank.dpm_session, this.tank.dpm_all],
                     ["WN8", this.tank.wn8_session, this.tank.wn8_all]
                    ];

        // Creating body.
        var tbody = document.createElement("tbody");
        // Iterating through rows.
        for (var r = 0; r < cells.length; r++) {
            var tr = document.createElement("tr");
            // Iterating through cells.
            for (var c = 0; c < cells[r].length; c++) {
                var td = document.createElement("td");
                var textNode = document.createTextNode(cells[r][c]);
                td.appendChild(textNode);
                tr.appendChild(td);
            }
            // Append the row to <tbody>.
            tbody.appendChild(tr);
        }

        // Append <thead> and <tbody> into the <table>. Put table inside parent.
        table.appendChild(thead);
        table.appendChild(tbody);
        parent.appendChild(table);    
    };
    
    
    // Switch tanks.
    this.switchTank = function(tankID) {
        
        // Deactivate all elements with class="menulinks".
        var links = document.getElementsByClassName(this.menuLinksClass);
        for(var l = 0; l < links.length; l++) {
            links[l].className = links[l].className.replace(" is-active", "");
        }

        // Add "is-active" to selected menu link.
        document.getElementById(tankID).className += " is-active";
    
        // Find the requested tank.
        this.findTank(tankID);

        // Destroying the chart if exists.
        if ((typeof RadarChart) == 'object') {
            RadarChart.destroy();
        }

        // Draw the chart.
        this.openRadarChart();

        // Remove table if exists.
        var element = document.getElementById(this.tableID);
        if (element !== null) {
            element.parentNode.removeChild(element);
        }

        // Draw the table.
        this.generateTable();
        
    };


}



// Legacy overview charts for future reference.
function ChartOverview()  {
    new Chart(document.getElementById("BarChart_dmgc"), { 
        type: 'bar', 
        data: {
            //labels: [{ for tank in session_tanks }"{{ tank['tank_name']|safe }}",{ endfor }], 
            datasets: [{
                label: "Session",
                backgroundColor: 'hsla(195, 25%, 63%, 0.4)', 
                borderColor: 'hsl(195, 25%, 63%)', 
                borderWidth: 1,
                //data: [{% for tank in session_tanks %}{{ '{:0.0f}'.format(tank['dmgc_session']) }},{% endfor %}]
            },  
            {
                label: "All time", 
                backgroundColor: 'hsla(0, 0%, 80%, 0.4)', 
                borderColor: 'hsl(0, 0%, 80%)', 
                borderWidth: 1, 
                //data: [{ for tank in session_tanks }{{ '{:0.0f}'.format(tank['dmgc_all']) }},{ endfor }], 
            }] 
        },
        options:  {
            stacked: true,
            legend: {
                display: false
            },
            title: {
                display: true,
                text: "Average Damage"
            }
        }
    });
}
function ChartOverview2()  {
    new Chart(document.getElementById("BarChart_wn8"), { 
        type: 'bar', 
        data: {
            //labels: [{ for tank in session_tanks }"{{ tank['tank_name']|safe }}",{ endfor }], 
            datasets: [{
                label: "Selected Period",
                backgroundColor: 'hsla(195, 25%, 63%, 0.4)', 
                borderColor: 'hsl(195, 25%, 63%)', 
                borderWidth: 1,
                //data: [{ for tank in session_tanks }{{ '{:0.0f}'.format(tank['wn8_session']) }},{ endfor }]
            },  
            {
                label: "All time", 
                backgroundColor: 'hsla(0, 0%, 80%, 0.4)', 
                borderColor: 'hsl(0, 0%, 80%)', 
                borderWidth: 1, 
                //data: [{ for tank in session_tanks }{{ '{:0.0f}'.format(tank['wn8_all']) }},{ endfor }], 
            }] 
        },
        options:  {
            stacked: true,
            legend: {
                display: false
            },
            title: {
                display: true,
                text: "WN8"
            }
        }
    });
}



//// Function for "wn8-estimates.html".
function wn8Estimates(data) {

    this.data = data;
    this.parentID = "TableParent";
    this.tableID = "StatisticsTable";
    this.instance = "page";
    this.tabsClass = "tablinks";
    
    
    // Prepare data from imported object.
    // 1st tab.
    this.genTargetDamageArray = function() {

        this.unsortedArray = [];
        this.headers = ["Tank", "300", "450", "650", "900", "1200", "1600", "2000", "2450", "2900", "Your Damage"];

        // Iterating through tanks.
        for(var r = 0; r < this.data.length; r++) {

            var row = [];
            row.push(this.data[r].short_name);

            // Iterating through "dmgTargets".
            for(var d = 0; d < this.data[r].dmgTargets.length; d++) {
                row.push(this.data[r].dmgTargets[d]);
            }

            row.push(Math.round(this.data[r].Damage));

            this.unsortedArray.push(row);
        }
    };
    // 2nd tab
    this.genWn8Stats = function() {
        
        this.unsortedArray = [];
        this.headers = ["Tank", "WinRate", "expWinRate", "Damage", "expDamage", "Frag", "expFrag", "Def", "expDef", "Spot", "expSpot"];
        
        // Iterating through tanks.
        for(var r = 0; r < this.data.length; r++) {

            var row = [];
            
            // Add tank name.
            row.push(this.data[r].short_name);

            // Iterate through headers.
            for(var h = 1; h < this.headers.length; h++) {
                
                var cell = this.data[r][this.headers[h]];
                row.push(Math.round(cell * 100) / 100);
            }

            this.unsortedArray.push(row);
        }
        
    };
    
    
    // Sort "unsortedArray" into "sortedArray"
    this.sortCells = function(headerID) {

        // Looking for column to sort.
        var column_to_sort = 0;
        for(var h = 0; h < this.headers.length; h++) {
            if (this.headers[h] == headerID) {
                column_to_sort = h;
                break;
            }
        }

        // Sorting.
        this.sortedArray = this.unsortedArray.sort(function(a,b) {
            return b[column_to_sort] - a[column_to_sort];
        });    
    };

    
    // Generate table.
    this.generateTable = function() {

        // Get the reference for the parent element.
        var parent = document.getElementById(this.parentID);

        // Creating <table> element and setting attributes.
        var table = document.createElement("table");
        table.setAttribute("class", "table");
        table.setAttribute("id", this.tableID);


        // Processing headers.
        var thead = document.createElement("thead");
        var tr = document.createElement("tr");

        for(var h = 0; h < this.headers.length; h++) {
            var th = document.createElement("th");
            var a = document.createElement("a");

            // Adding attribute for onclick sorting.
            a.setAttribute("onclick", this.instance + ".refreshTable(\"" + this.headers[h] + "\")");

            var textNode = document.createTextNode(this.headers[h]);

            a.appendChild(textNode);
            th.appendChild(a);
            tr.appendChild(th);
        }

        thead.appendChild(tr);


        // Processing cells.
        var tbody = document.createElement("tbody");
        // Iterating through rows
        for(var r = 0; r < this.sortedArray.length; r++) {
            var tr = document.createElement("tr");

            // Iterating through cells.
            for(var c = 0; c < this.sortedArray[r].length; c++) {
                var td = document.createElement("td");
                var textNode = document.createTextNode(this.sortedArray[r][c]);
                td.appendChild(textNode);
                tr.appendChild(td);
            }

            tbody.appendChild(tr);
        }

        // Append <thead> and <tbody> into the <table>. Put table inside parent.
        table.appendChild(thead);
        table.appendChild(tbody);
        parent.appendChild(table);    
    };
    
    
    // Remove the table if exists.
    this.removeTable = function() {
        
        var element = document.getElementById(this.tableID);
        
        if (element !== null) {
            
            element.parentNode.removeChild(element);
        }    
    };
    
    
    // Refresh table.
    this.refreshTable = function(headerID) {

        this.removeTable();

        this.sortCells(headerID);

        this.generateTable();

    };

    
    // Open tab.
    this.openTab = function(tabName) {
        
        this.removeTable();    

        if (tabName == "wn8td") {

            this.genTargetDamageArray();
            this.sortedArray = this.unsortedArray;
            this.generateTable();

        } else if (tabName == "wn8pv") {
            
            this.genWn8Stats();
            this.sortedArray = this.unsortedArray;
            this.generateTable();
        }

        // Deactivate all tabs.
        var links = document.getElementsByClassName(this.tabsClass);
        for(var l = 0; l < links.length; l++) {
            links[l].className = links[l].className.replace(" is-active", "");
        }

        // Add "is-active" to the selected tab.
        document.getElementById(tabName).className += " is-active";
    };

}

