#!/usr/bin/env bash

cd "${0%/*}"


#Creating secret file with default values.
touch secret.py
echo 'app_id = "demo"' >> secret.py
echo 'access_key = "12345"' >> secret.py


#Python 3.6
python3 -m venv .
source ./bin/activate
pip3 install -r requirements.txt
deactivate


#Download JS dependencies.
curl -L 'https://github.com/facebook/react/releases/download/v15.6.1/react-dom.js' --output static/react-dom.js
curl -L 'https://github.com/facebook/react/releases/download/v15.6.1/react.js' --output static/react.js
#curl -L 'https://github.com/facebook/react/releases/download/v15.6.1/react-dom.min.js' --output static/react-dom.js
#curl -L 'https://github.com/facebook/react/releases/download/v15.6.1/react.min.js' --output static/react.js
curl -L 'https://github.com/chartjs/Chart.js/releases/download/v2.6.0/Chart.bundle.js' --output static/chart.bundle.js
#curl -L 'https://github.com/chartjs/Chart.js/releases/download/v2.6.0/Chart.bundle.min.js' --output static/chart.bundle.js


#Downloading fetch polyfill.
mkdir temp
curl -L 'https://github.com/github/fetch/archive/v2.0.3.zip' --output temp/fetch.zip
unzip -q temp/fetch.zip -d temp/
cp temp/fetch-2.0.3/fetch.js static/fetch.js
rm -rf temp/


#Babel & compilation.
npm install --save-dev babel-cli
npm install --save-dev babel-cli babel-preset-react
echo '{ "presets": ["react"] }' > .babelrc
./node_modules/.bin/babel static/app.jsx --out-file static/app.js


#Compile SASS.
npm install node-sass
./node_modules/.bin/node-sass -q -x --output-style compressed bulma/bulma.sass --output static/


#Create SQLite database
python3 utility/create_db.py



# TODO: update on setup:
# 127.0.0.1:5000/diag/update-tankopedia/
# 127.0.0.1:5000/diag/update-percentiles/
# 127.0.0.1:5000/diag/update-percentiles-generic/
# 127.0.0.1:5000/diag/reload-percentiles/
# 127.0.0.1:5000/diag/update-wn8/
