###### Description:

Advanced player statistics for World of Tanks Console.

SPA - style frontend written in React, communicates with the server via JSON API and Fetch API.

Performs real time calculations based on the stored data.

Utilizes data analysis insights from the records of more than 100,000 players. [Github repo](https://github.com/IDDT/wot-console-playerbase-analysis)


###### Dependencies:
- [Flask](https://github.com/pallets/flask)
- [React](https://github.com/facebook/react)
- [Chart.js](https://github.com/chartjs/Chart.js)
- [Fetch (Polyfill)](https://github.com/github/fetch)
- [Bulma](https://github.com/jgthms/bulma)
- [SQLite](https://www.sqlite.org)
- [Simple-icons](https://github.com/danleech/simple-icons)


###### Bulma SASS Changes:

utilities/initial-variables.sass - colors

```SASS
$orange:       hsl(14,  100%, 53%)  !default
$yellow:       hsl(45,  88%,  65%)  !default
$green:        hsl(130, 25%,  63%)  !default
$turquoise:    hsl(212, 43%,  65%)  !default
$blue:         hsl(200, 25%,  63%)  !default
$purple:       hsl(271, 100%, 71%)  !default
$red:          hsl(0,   35%,  63%)  !default
```

###### Other files:

`/utility/create_db.py` - Database setup

`/utility/nightly_task.py` - Maintenance script

`/utility/request_tankopedia.py` - Update tankopedia
