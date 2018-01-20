#!/usr/bin/env bash

cd "${0%/*}"


#Creating secret file with default values.
touch web/secret.py
echo 'app_id = "demo"' > web/secret.py
echo 'access_key = "12345"' >> web/secret.py


#Python 3.6
python3 -m venv .
source ./bin/activate
pip3 install -r requirements.txt
deactivate


#Node modules.
npm install


#Compile frontend bundle.
npm run build


#Compile stylesheet bundle.
node scripts/font_to_base64.js node_modules/font-awesome/fonts/fontawesome-webfont.woff src/base64font.sass
./node_modules/.bin/node-sass -q -x --output-style compressed src/style.sass --output web/static/
rm src/base64font.sass
