import requests
import time

player_profile = 'http://127.0.0.1:5000/api/profile/ps4/1075513299/0/&1&2&3&4&5&6&7&8&9&10&lightTank&mediumTank&heavyTank&AT-SPG&SPG/'
vehicles = 'http://127.0.0.1:5000/api/vehicles/ps4/1075513299/0/&1&2&3&4&5&6&7&8&9&10&lightTank&mediumTank&heavyTank&AT-SPG&SPG/'
time_series = 'http://127.0.0.1:5000/api/time_series/ps4/1075513299/0/&1&2&3&4&5&6&7&8&9&10&lightTank&mediumTank&heavyTank&AT-SPG&SPG/'

def hundred_requests(url):
    start = time.time()
    for i in range(0,100):
        requests.get(url)
    return(time.time()-start)

url = time_series
hundred_requests(url)

#profile
(30.052811861038208 + 30.143514156341553) / (16.587881088256836 + 16.75243592262268)
#80%
#vehicles
(5.183889150619507 + 5.142794847488403) / (4.411377191543579 + 4.454556941986084)
#16%
#time_series
(32.900134801864624 + 32.72978186607361) / (18.561676025390625 + 16.39917302131653)
#87%
