from cantools import db

class CTUser(db.TimeStampedBase):
    active = db.Boolean(default=False)
    email = db.String()
    password = db.String() # hashed
    firstName = db.String()
    lastName = db.String()
    blurb = db.Text()
    img = db.Binary()
    _data_omit = ["password"]

    def fullName(self):
        return "%s %s"%(self.firstName, self.lastName)
