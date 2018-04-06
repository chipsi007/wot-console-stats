#!/usr/bin/env bash

cd "${0%/*}"


#Creating "secret.py" file with default Wargaming API keys.
AUTH_CONF_FILE="web/secret.py"
if [ ! -f $AUTH_CONF_FILE ]; then
    echo 'app_id = "demo"' > $AUTH_CONF_FILE
    echo 'access_key = "12345"' >> $AUTH_CONF_FILE
fi


#Python 3.6
python3 -m venv .
source ./bin/activate
pip3 install -r requirements.txt
deactivate


#Install node modules.
npm install


#Compile frontend bundle.
npm run build


#Compile stylesheet bundle.
npm run build-style
