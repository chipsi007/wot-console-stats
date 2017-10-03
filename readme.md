###### Description:


Player statistics for World of Tanks Console.

Uses WN8 expected values pre-calculated for Console players with [these](https://github.com/IDDT/wot-console-wn8) algorithms.

Development happens in dev branch.


###### Dependencies:
- [Flask](https://github.com/pallets/flask)
- [React](https://github.com/facebook/react)
- [Chart.js](https://github.com/chartjs/Chart.js)
- [Fetch (Polyfill)](https://github.com/github/fetch)
- [Bulma](https://github.com/jgthms/bulma)
- [SQLite](https://www.sqlite.org)
- [Font-Awesome](https://github.com/FortAwesome/Font-Awesome)


###### How to run:
* Install python3.6 & node
* `cd wot-console-stats`
* `chmod +x ./sh/setup.sh`
* `./sh/setup.sh` - downloads all dependencies locally, creates sqlite3 database, compiles JSX and CSS.
* `./sh/run.sh` - starts dev server.
