from flask import render_template

from .. import app


#Serving frontend files.


@app.route('/')
def index():
    return render_template("index.html")


@app.route('/dev')
def index_dev():
    return render_template("index_dev.html")
