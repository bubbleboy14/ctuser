from cantools import db

class CTUser(db.TimeStampedBase):
    active = db.Boolean(default=False)
    admin = db.Boolean(default=False)
    email = db.String()
    password = db.String() # hashed
    firstName = db.String()
    lastName = db.String()
    handles = db.String(repeated=True)
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

class Conversation(db.TimeStampedBase):
    participants = db.ForeignKey(kind=CTUser, repeated=True)
    topic = db.String()
    anonymous = db.Boolean(default=False)

class Message(db.TimeStampedBase):
    conversation = db.ForeignKey(kind=Conversation)
    sender = db.ForeignKey(kind=CTUser)
    handle = db.String() # optional
    body = db.Text()