###### Description:

Advanced World of Tanks Console player statistics with charts, trends, evaluations.

Wrapped up into SPA - style frontend, communicates with the server via JSON API. Heavily relies on ES6 methods and Fetch API (polyfill included for Safari).

Collects raw daily user snapshots in pickletype SQL fields, performs real time calculations based on the stored data.

Utilizes data analysis insights from data of around 50,000 players. [Github repo](https://github.com/IDDT/wot-console-playerbase-analysis)


###### Dependencies:
- Python:
  - flask
  - flask_sqlalchemy
  - requests
  - json
  - pickle
  - datetime
- JavaScript:
  - [Chart.js 2.50](https://github.com/chartjs/Chart.js)
  - [Fetch 2.0.3 (Polyfill)](https://github.com/github/fetch)
- CSS
  - [Bulma 0.4.0](https://github.com/jgthms/bulma)
- SQL
  - SQLite3


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

###### Initial SQL database setup:

```Python
from flask_site import db

#Create all tables
db.create_all()

#Remove all tables
db.drop_all()

db.session.commit()
db.session.close()
```
