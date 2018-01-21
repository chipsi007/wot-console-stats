from .. import app


from .frontend import index     #GET:/
from .frontend import index_dev #GET:/dev


from .newapi import newapi_general_get_player_tanks #GET:/newapi/general/get-player-tanks/


from .page_home import api_page_home                #POST:/api/home/
from .page_vehicles import api_vehicles             #GET:/api/vehicles/<server>/<int:account_id>/<int:timestamp>/<filters>/
from .page_timeseries import api_timeseries_get     #POST:/api/timeseries/get/
from .page_sessiontracker import api_sessiontracker #GET:/api/session_tracker/<server>/<int:account_id>/<int:timestamp>/<filters>/
from .page_estimates import api_estimates_get       #GET:/api/estimates/get/
from .page_history import api_history_get           #POST:/api/history/get/


from .export import export_tankopedia       #GET:/export/tankopedia/


from .support import users_in_period        #GET:/users-in-period/<int:start_timestamp>/<int:end_timestamp>/
from .support import add_checkpoint         #GET:/add-bot-checkpoint/<server>/<int:account_id>/
from .support import api_request_snapshots  #GET:/api-request-snapshots/<server>/<int:account_id>/


from .update import update                  #POST:/update/


from .system import before_first_request    #no addr
from .errorhandlers import error_not_found  #no addr
