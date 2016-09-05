from cantools import db

class CTUser(db.TimeStampedBase):
    active = db.Boolean(default=False)
    admin = db.Boolean(default=False)
    email = db.String()
    password = db.String() # hashed
    firstName = db.String()
    lastName = db.String()
    blurb = db.Text()
    img = db.Binary()
    label = "firstName"
    _data_omit = ["password"]

    def _trans_password(self, val):
        if not self.key:
            self.put()
        return db.hashpass(val, self.created)

    def fullName(self):
        return "%s %s"%(self.firstName, self.lastName)
