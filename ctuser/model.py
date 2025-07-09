try:
    from urllib.parse import quote, unquote # py3
except:
    from urllib import quote, unquote # py2.7
from datetime import datetime
from cantools import db, config
from cantools.util import log
from cantools.web import send_mail, send_sms, email_admins, mailer

class CTUser(db.TimeStampedBase):
    active = db.Boolean(default=False)
    admin = db.Boolean(default=False)
    email = db.String()
    sms = db.JSON() # {number,carrier}
    password = db.String() # hashed
    firstName = db.String()
    lastName = db.String()
    handles = db.String(repeated=True)
    blurb = db.Text()
    img = db.Binary()
    label = "firstName"
    _data_omit = ["password"]
    _unique_cols = ["handles"]

    def _trans_email(self, val):
        return val.lower()

    def _trans_password(self, val):
        if not self.key:
            self.put()
        return db.hashpass(val, self.created)

    def fullName(self):
        return "%s %s"%(self.firstName, self.lastName)

    def notify(self, subject, message):
        if self.sms:
            send_sms(self.sms["number"], subject, message, self.sms["carrier"])
        else:
            send_mail(self.email, subject=subject, body=message)

def getMem(email, password, yes, no, datify=False, key=None):
    u = CTUser.query(CTUser.email == email.lower(),
        CTUser.active == True).get()
    if not u or u.password != db.hashpass(password, u.created):
        no()
    if key and key != u.key.urlsafe():
        no()
    yes(datify and u.data() or u)

class Tag(db.TimeStampedBase):
    name = db.String()
    # helpful especially for providing tagging options

class Conversation(db.TimeStampedBase):
    participants = db.ForeignKey(kind=CTUser, repeated=True)
    topic = db.String()
    anonymous = db.Boolean(default=False)

class Message(db.TimeStampedBase):
    conversation = db.ForeignKey(kind=Conversation)
    sender = db.ForeignKey(kind=CTUser)
    handle = db.String() # optional
    body = db.Text()

class Subscriber(db.TimeStampedBase):
    email = db.String()

class Unsubscriber(db.TimeStampedBase):
    email = db.String()

def subscribe(email):
    email = unquote(email)
    log("subscribe: %s"%(email,))
    if not Subscriber.query(Subscriber.email == email).get():
        Subscriber(email=email).put()

def unsubscribe(email):
    email = unquote(email)
    log("unsubscribe: %s"%(email,))
    if not unsubber(email):
        Unsubscriber(email=email).put()

def ununsubscribe(email):
    email = unquote(email)
    log("ununsubscribe: %s"%(email,))
    u = unsubber(email)
    u and u.rm()

def unsubber(email):
    return Unsubscriber.query(Unsubscriber.email == email).get()

def pruneUnsubs(emails):
    return [e for e in emails if not unsubber(e)]

def unsubrefused(email):
    unsubscribe(email)
    email_admins("refused recipient unsubscribed", email)

if config.ctuser.email.unsubrefused:
    mailer.on("refused", unsubrefused)

class Email(db.TimeStampedBase):
    subject = db.String()
    body = db.Text()
    footer = db.String()
    header = db.String()
    progress = db.Integer(default=0)
    paused = db.Boolean(default=False)
    complete = db.Boolean(default=False)
    recipients = db.String(repeated=True)
    schedule = db.DateTime()

    def labeler(self):
        return "%s (%s)"%(self.subject, self.footer or "custom[%s]"%(len(self.recipients),))

    def simple(self):
        return {
            "subject": self.subject,
            "group": self.footer,
            "complete": self.complete,
            "ttl": (self.schedule - datetime.now()).total_seconds()
        }

    def mindata(self):
        d = self.data()
        del d["recipients"]
        if self.schedule:
            d["ttl"] = (self.schedule - datetime.now()).total_seconds()
            if config.ctuser.email.scheduler:
                d["complete"] = d["ttl"] < 0
        return d

    def procbod(self, email):
        bod = self.body
        if config.ctuser.email.breakstrip:
            bod = bod.replace("\n", "")
        if self.header:
            bod = "%s\n%s"%(Email.headers[self.header](), bod)
        if self.footer:
            bod = "%s\n%s"%(bod, Email.footers[self.footer](email))
        return bod

    def process(self):
        log("processing email: %s"%(self.subject,), important=True)
        recips = self.recipients[self.progress:self.progress+int(config.ctuser.email.chunk)]
        lbatch = len(recips)
        lrecips = len(self.recipients)
#        send_mail(bcc=recips, subject=self.subject, body=self.body) # disabled bcc -- too many bounces!
        for recip in recips:
            if unsubber(recip):
                log("skipping Unsubscriber: %s"%(recip,), important=True)
            else:
                send_mail(to=recip, subject=self.subject, body=self.procbod(recip))
        self.progress += lbatch
        log("sent to %s recipients (%s/%s)"%(lbatch, self.progress, lrecips))
        if self.progress == len(self.recipients):
            cc = config.ctuser.email.cc
            if cc:
                log("mailing cc: %s"%(cc,))
                send_mail(to=cc, subject=self.subject, body=self.procbod(cc))
            log("mailing complete!")
            self.complete = True
        self.put()

def defEmFoot(email):
    return "<a href='https://%s/_user?action=unsubscribe&email=%s'>click here to unsubscribe</a>"%(config.web.domain,
        quote(email),)

Email.footers = {
    "default": defEmFoot
}
Email.headers = {}

def processEmails():
    now = datetime.now()
    pauseds = Email.query(Email.complete == False,
        Email.paused == True).all()
    if pauseds:
        log("found %s paused Email records"%(len(pauseds),))
        if not config.ctuser.email.staypaused:
            for p in pauseds:
                if p.schedule and p.schedule <= now:
                    log("unpausing: %s"%(p.subject,))
                    p.paused = False
                    p.put()
    emails = Email.query(Email.complete == False, Email.paused == False).all()
    emails and sorted(emails, key=lambda e : len(e.recipients))[0].process()