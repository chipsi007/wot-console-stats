from .. import app


from .frontend import index     #GET:/
from .frontend import index_dev #GET:/dev


from .newapi import newapi_general_get_player_tanks #GET:/newapi/general/get-player-tanks/
from .newapi import newapi_estimates_get_tank       #GET:/newapi/estimates/get-tank/
from .newapi import newapi_timeseries_get_data      #POST:/newapi/timeseries/get-data/


from .pages import api_main                 #GET:/api/<page>/<server>/<int:account_id>/<int:timestamp>/<filters>/
from .page_home import api_page_home        #POST:/api/home/
from .page_history import api_history_get   #POST:/api/history/get/


from .export import export_tankopedia       #GET:/export/tankopedia/


from .support import users_in_period        #GET:/users-in-period/<int:start_timestamp>/<int:end_timestamp>/
from .support import add_checkpoint         #GET:/add-bot-checkpoint/<server>/<int:account_id>/
from .support import api_request_snapshots  #GET:/api-request-snapshots/<server>/<int:account_id>/


from .update import update                  #POST:/update/


from .system import before_first_request    #no addr
from .errorhandlers import error_not_found  #no addr
