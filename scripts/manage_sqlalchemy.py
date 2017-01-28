from flask_site import db

#Create all tables
db.create_all()

#Remove all tables
#db.drop_all()


db.session.commit()
db.session.close()
