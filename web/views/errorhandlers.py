from flask import Response
import json

from .. import app


#Custom errorhandlers.


@app.errorhandler(404)
def error_not_found(error):
    return Response(json.dumps({
        'status':     'error',
        'code':       '404',
        'message':    'page not found / wrong parameters'
    }), mimetype='application/json'), 404
