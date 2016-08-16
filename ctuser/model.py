from cantools import db

class CTUser(db.ModelBase):
    created = db.DateTime(auto_now_add=True)
    modified = db.DateTime(auto_now=True)
    active = db.Boolean(default=False)
    email = db.String()
    password = db.String() # hashed
    firstName = db.String()
    lastName = db.String()
    blurb = db.Text()
    _data_omit = ["password"]

    def fullName(self):
        return "%s %s"%(self.firstName, self.lastName)
