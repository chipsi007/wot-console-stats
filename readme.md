###### Description:

Advanced player statistics for World of Tanks Console.

SPA - style frontend written in React, communicates with the server via JSON API and Fetch API.

Performs real time calculations based on the stored data.

Utilizes data analysis insights from the records of more than 100,000 players. [Github repo](https://github.com/IDDT/wot-console-playerbase-analysis)


###### Dependencies:
- Backend: [Flask](https://github.com/pallets/flask)
- frontend: [React](https://github.com/facebook/react)
- Charts [Chart.js](https://github.com/chartjs/Chart.js)
- AJAX [Fetch (Polyfill)](https://github.com/github/fetch)
- CSS [Bulma](https://github.com/jgthms/bulma)
- Database [SQLite](https://www.sqlite.org)
- Assets [Simple-icons](https://github.com/danleech/simple-icons)


###### Bulma SASS Changes:

utilities/variables.sass - colors

```SASS
$grey-lighter: hsl(0, 0%, 80%) !default

$white-ter:    hsl(0, 0%, 94%) !default
$white-bis:    hsl(0, 0%, 96%) !default
$white:        hsl(0, 0%, 98%) !default

$yellow:       hsl(45, 88%, 65%) !default
$green:        hsl(125, 37%, 54%) !default
$turquoise:    hsl(212, 43%, 65%) !default
$blue:         hsl(193, 58%, 44%) !default
$red:          hsl(353, 80%, 64%) !default
```
components/tabs.sass - .tabs &.is-boxed &.is-active a
```SASS
background-color: $white !important
```

###### Other files:

`/utility/create_db.py` - Database setup

`/utility/nightly_task.py` - Maintenance script

`/utility/request_tankopedia.py` - Update tankopedia
