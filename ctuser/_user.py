import os, string
from datetime import datetime, timedelta
from cantools.web import log, respond, succeed, fail, cgi_get, read_file, redirect, fetch, send_mail, send_sms, verify_recaptcha
from cantools.util import batch, token, mkdir, write
from cantools.db import edit, hashpass
from cantools import config
from ctuser.util import getWPmails
from model import db, CTUser, Message, Conversation, Email, subscribe, unsubscribe, ununsubscribe, pruneUnsubs
from emailTemplates import JOIN, JOINED, VERIFY, ACTIVATE, CONTACT, RESET

wc = config.web
ucfg = config.ctuser
ecfg = ucfg.email

for name, group in ecfg.groups.items():
    ecfg.groups.update(name, group.split("|"))

def bulk_recips(ebase):
    lowers = string.lowercase
    recips = []
    for i in lowers:
        for j in lowers:
            for k in lowers:
                recips.append("%s%s%s"%(i, j, k))
    return list(map(lambda w : "%s+%s@gmail.com"%(ebase, w), recips[:ecfg.bulksize]))

def response():
    action = cgi_get("action", choices=["join", "activate", "login", "contact", "edit", "email", "subscribe", "unsubscribe", "ununsubscribe", "recaptcha", "sms", "reset", "feedback", "egal", "esched"])
    if action == "egal":
        egp = os.path.join("img", "egal")
        if not os.path.isdir(egp):
            mkdir(egp)
        ubase = "%s://%s/%s"%(wc.protoreal or wc.protocol, wc.domain, egp)
        fname = cgi_get("data", required=False)
        if fname:
            fdata = read_file(fname)
            write(fdata, os.path.join(egp, fname), binary=True)
            succeed("%s/%s"%(ubase, fname))
        succeed(list(map(lambda n : "%s/%s"%(ubase, n), os.listdir(egp))))
    elif action == "recaptcha":
        verify_recaptcha(cgi_get("cresponse"), config.recaptcha)
    elif action == "reset":
        u = CTUser.query(CTUser.email == cgi_get("email")).get()
        if not u:
            fail()
        pw = token()
        u.password = hashpass(pw, u.created)
        u.put()
        send_mail(to=u.email, subject="password reset", body=RESET%(pw,))
    elif action == "sms":
        send_sms(cgi_get("number"), "confirmation code", str(cgi_get("code")), cgi_get("carrier"))
    elif action == "join":
        email = cgi_get("email").lower()
        if CTUser.query(CTUser.email == email).get():
            fail("this email is already in use")
        user_type = cgi_get("utype")
        u = db.get_model(user_type)(email=email,
            firstName=cgi_get("firstName"), lastName=cgi_get("lastName"),
            **cgi_get("extras"))
        u.put() # to generate created timestamp
        u.password = hashpass(cgi_get("password"), u.created)
        rule = ucfg.activation.get(user_type, ucfg.activation.ctuser)
        if rule == "auto":
            u.active = True
        else: # assumes config.mailer (otherwise, don't change activation "auto" default)
            usk = u.key.urlsafe()
            if rule == "confirm":
                send_mail(to=u.email, subject="activation required", body=JOIN%(usk,))
            elif rule == "verify":
                send_mail(to=u.email, subject="activation required", body=VERIFY%(usk,))
            else: # email admin to handle it
                send_mail(to=rule, subject="activation required", body=JOINED%(email, usk))
        u.put()
        if hasattr(u, "onjoin"):
            u.onjoin()
        succeed(u.data())
    elif action == "activate":
        u = db.get(cgi_get("key"))
        if u and not u.active: # else, don't even trip
            u.active = True
            u.put()
        send_mail(to=u.email, subject="account activated",
            body=ACTIVATE)
        redirect("/", "you did it!")
    elif action == "login":
        u = CTUser.query(CTUser.email == cgi_get("email").lower(),
            CTUser.active == True).get()
        if not u or u.password != hashpass(cgi_get("password"), u.created):
            fail()
        succeed(u.data())
    elif action == "contact":
        sender = db.get(cgi_get("user"))
        message = cgi_get("message")
        handle = cgi_get("handle", required=False)
        convokey = cgi_get("conversation", required=False)
        if convokey:
            conversation = db.get(convokey)
        else:
            conversation = Conversation()
            conversation.topic = cgi_get("topic")
            conversation.participants = [sender.key, db.KeyWrapper(cgi_get("recipient"))]
            conversation.put()
        m = Message(sender=sender.key, conversation=conversation.key, body=message)
        if handle:
            m.handle = handle
        m.put()
        if cgi_get("update_participants", required=False):
            if sender.key not in conversation.participants:
                # ugh, fix db array mutability....
                conversation.participants = conversation.participants + [sender.key]
                conversation.put()
        for recipient in conversation.participants:
            if recipient != sender.key:
                send_mail(to=recipient.get().email,
                    subject="message from %s"%(sender.firstName,),
                    body=CONTACT%(sender.fullName(), message,
                        sender.key.urlsafe(), sender.firstName,
                        conversation.key.urlsafe()))
        succeed(convokey and m.key.urlsafe() or conversation.key.urlsafe())
    elif action == "edit":
        changes = cgi_get("changes")
        changes["key"] = cgi_get("user")
        edit(changes)
    elif action == "feedback":
        send_mail(to=ucfg.feedback, subject="feedback",
            body="%s\n\nemail: %s"%(cgi_get("feedback"), cgi_get("email")))
    elif action == "subscribe":
        subscribe(cgi_get("email"))
    elif action == "unsubscribe":
        unsubscribe(cgi_get("email"))
    elif action == "ununsubscribe":
        ununsubscribe(cgi_get("email"))
    elif action == "esched":
        if ecfg.scheduler:
            succeed(fetch("https://%s/_user?action=esched"%(ecfg.scheduler,), ctjson=True))
        else:
            succeed([e.simple() for e in Email.query().all()])
    elif action == "email":
        sender = db.get(cgi_get("user"))
        if not sender.admin:
            fail()
        sub = cgi_get("subject")
        bod = cgi_get("body")
        group = cgi_get("group", required=False)
        delay = cgi_get("delay", required=False)
        if group == "admins":
            recips = config.admin.contacts
        elif group == "bulk test": # max 17576 recips
            recips = bulk_recips(ecfg.bulktarget or config.mailer.split("@")[0])
        elif group:
            recips = ecfg.groups[group] or [r.email for r in db.get_model(group).query().all()]
            if not recips:
                fail("no %s records!"%(group,))
        else:
            recips = cgi_get("recipients", default=[])
            if not recips:
                if ucfg.wpmail:
                    log("no recipients specified -- WP mode enabled -- building recipient list...")
                    recips = getWPmails()
                else:
                    fail("no recipients specified -- can't email nobody")
        recips = pruneUnsubs(recips)
        if delay or group or ecfg.unsub or len(recips) > 400: # requires mailer cron; supports footer
            log("group or footer or more than 400 recips - enqueueing Email record")
            em = Email(subject=sub, body=bod, recipients=recips)
            if group and group in Email.headers:
                em.header = group
            if group and group in Email.footers:
                em.footer = group
            elif ecfg.unsub:
                em.footer = "default"
            if delay:
                em.paused = True
                em.schedule = datetime.now() + timedelta(0, delay)
            em.put()
        else:
            log("fewer than 400 recips - doing batches of 100")
            batch(recips, lambda chunk : send_mail(bcc=chunk,
                subject=sub, body=bod), chunk=100)

respond(response)