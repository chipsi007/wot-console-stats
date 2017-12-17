from .. import app


from .frontend import index
from .frontend import index_dev


from .newapi import newapi_general_get_player_tanks
from .newapi import newapi_estimates_get_tank
from .newapi import newapi_timeseries_get_data


from .pages import api_main
from .page_home import api_page_home


from .support import users_in_period
from .support import add_checkpoint
from .support import api_request_snapshots


from .system import before_first_request
from .update import update
from .errorhandlers import error_not_found
