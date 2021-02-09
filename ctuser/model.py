from cantools import db
from cantools.util import log
from cantools.web import send_mail

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

    def _trans_email(self, val):
        return val.lower()

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

class Email(db.TimeStampedBase):
    subject = db.String()
    body = db.Text()
    footer = db.String()
    progress = db.Integer(default=0)
    paused = db.Boolean(default=False)
    complete = db.Boolean(default=False)
    recipients = db.String(repeated=True)

    def procbod(self, email):
        if self.footer:
            return "%s\n\n%s"%(self.body, Email.footers[self.footer](email))
        return self.body

    def process(self):
        log("processing email: %s"%(self.subject,), important=True)
        recips = self.recipients[self.progress:self.progress+5]
        lbatch = len(recips)
        lrecips = len(self.recipients)
#        send_mail(bcc=recips, subject=self.subject, body=self.body) # disabled bcc -- too many bounces!
        for recip in recips:
            send_mail(to=recip, subject=self.subject, body=self.procbod(recip))
        self.progress += lbatch
        log("sent to %s recipients (%s/%s)"%(lbatch,
            self.progress, lrecips))
        if self.progress == len(self.recipients):
            log("mailing complete!")
            self.complete = True
        self.put()

Email.footers = {}

def processEmails():
    emails = Email.query(Email.complete == False, Email.paused == False).all()
    emails and sorted(emails, key=lambda e : len(e.recipients))[0].process()