#!/usr/bin/env bash

cd "${0%/*}"

source ./bin/activate
export FLASK_APP=run.py
export FLASK_DEBUG=1
flask run
