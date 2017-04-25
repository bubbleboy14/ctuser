from cantools.web import log, respond, succeed, fail, cgi_get, redirect, send_mail
from cantools.util import read, batch
from cantools.db import edit
from cantools import config
from model import db, CTUser, Message, Conversation
from emailTemplates import JOIN, ACTIVATE, CONTACT

def getWPmails():
    import MySQLdb
    h, u, p, d = read(".c").strip().split("|")
    log("extracting email list from WP", 1)
    conn = MySQLdb.connect(host=h, user=u, passwd=p, db=d)
    cur = conn.cursor()
    cur.execute("SELECT user_email FROM wp_users")
    rowz = cur.fetchall()
    log("found %s recipients"%(len(rowz),), 1)
    return [r[0] for r in rowz]

def response():
    action = cgi_get("action", choices=["join", "activate", "login", "contact", "edit", "email"])
    if action == "join":
        email = cgi_get("email")
        if CTUser.query(CTUser.email == email).get():
            fail("this email is already in use")
        u = db.get_model(cgi_get("utype"))(email=email,
            firstName=cgi_get("firstName"), lastName=cgi_get("lastName"),
            **cgi_get("extras"))
        u.put() # to generate created timestamp
        u.password = db.hashpass(cgi_get("password"), u.created)
        if config.mailer:
            usk = u.key.urlsafe()
            send_mail(to=u.email, subject="activation required",
                body=JOIN%(usk,))
        else: # auto-activate
            u.active = True
        u.put()
    elif action == "activate":
        u = db.get(cgi_get("key"))
        if u and not u.active: # else, don't even trip
            u.active = True
            u.put()
        send_mail(to=u.email, subject="account activated",
            body=ACTIVATE)
        redirect("/", "you did it!")
    elif action == "login":
        u = CTUser.query(CTUser.email == cgi_get("email"),
            CTUser.active == True).get()
        if not u or u.password != db.hashpass(cgi_get("password"), u.created):
            fail()
        succeed(u.data())
    elif action == "contact":
        sender = db.get(cgi_get("user"))
        message = cgi_get("message")
        convokey = cgi_get("conversation", required=False)
        if convokey:
            conversation = db.get(convokey)
        else:
            conversation = Conversation()
            conversation.topic = cgi_get("topic")
            conversation.participants = [sender.key, db.KeyWrapper(cgi_get("recipient"))]
            conversation.put()
        m = Message(sender=sender.key, conversation=conversation.key, body=message)
        m.put()
        for recipient in conversation.participants:
            if recipient != sender.key:
                send_mail(to=recipient.get().email,
                    subject="message from %s"%(sender.firstName,),
                    body=CONTACT%(sender.fullName(), message,
                        sender.firstName, sender.key.urlsafe(), conversation.key.urlsafe()))
        succeed(convokey and m.key.urlsafe() or conversation.key.urlsafe())
    elif action == "edit":
        changes = cgi_get("changes")
        changes["key"] = cgi_get("user")
        edit(changes)
    elif action == "email":
        sender = db.get(cgi_get("user"))
        if not sender.admin:
            fail()
        recips = cgi_get("recipients", default=[])
        if not recips:
            if config.wpmail:
                log("no recipients specified -- WP mode enabled -- building recipient list...")
                recips = getWPmails()
            else:
                fail("no recipients specified -- can't email nobody")
        batch(recips, lambda chunk : send_mail(bcc=chunk,
            subject=cgi_get("subject"), body=cgi_get("body")), chunk=100)

respond(response)