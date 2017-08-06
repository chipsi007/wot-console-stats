###### Description:


Player statistics for World of Tanks Console.

Keeps player data for last 14 days (in GMT timezone), after that stores first checkpoint a week with maximum of 52.

Bot checks up for the user 7 days after the last user visit at 23:00 GMT.

Uses WN8 expected values pre-calculated for Console players with [these](https://github.com/IDDT/wot-console-wn8) algorithms.

Automatically updates WN8 and percentiles weekly, tanks - daily.


###### Dependencies:
- [Flask](https://github.com/pallets/flask)
- [React](https://github.com/facebook/react)
- [Chart.js](https://github.com/chartjs/Chart.js)
- [Fetch (Polyfill)](https://github.com/github/fetch)
- [Bulma](https://github.com/jgthms/bulma)
- [SQLite](https://www.sqlite.org)
- [Font-Awesome](https://github.com/FortAwesome/Font-Awesome)


###### How to run:
* `cd wot-console-stats`
* `echo 'app_id = "demo"' > secret.py`
* Install python3.6
  * `python3 -m venv .`
  * `source ./bin/activate`
  * `pip3 install -r requirements.txt`
* Install Node.js
  * `npm install --save-dev babel-cli`
  * `npm install --save-dev babel-cli babel-preset-react`
  * `echo '{ "presets": ["react"] }' > .babelrc`
  * `./node_modules/.bin/babel static/app.jsx --out-file static/app.js`
* `python3 utility/create_db.py`
* `export FLASK_APP=app.py`
* `export FLASK_DEBUG=1`
* `flask run`


###### Scripts:

`/utility/create_db.py` - Database setup & schema.
`/utility/optimize_db.py` - Remove old player data.
`/utility/scheduled_task.py` - Maintenance script.
