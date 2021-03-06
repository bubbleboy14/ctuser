from cantools.web import log, respond, succeed, fail, cgi_get, redirect, send_mail, send_sms, verify_recaptcha
from cantools.util import batch, token
from cantools.db import edit, hashpass
from cantools import config
from ctuser.util import getWPmails
from model import db, CTUser, Message, Conversation, Email
from emailTemplates import JOIN, JOINED, VERIFY, ACTIVATE, CONTACT, RESET

def response():
    action = cgi_get("action", choices=["join", "activate", "login", "contact", "edit", "email", "recaptcha", "sms", "reset", "feedback"])
    if action == "recaptcha":
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
        rule = config.ctuser.activation.get(user_type, config.ctuser.activation.ctuser)
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
        send_mail(to=config.ctuser.feedback, subject="feedback",
            body="%s\n\nemail: %s"%(cgi_get("feedback"), cgi_get("email")))
    elif action == "email":
        sender = db.get(cgi_get("user"))
        if not sender.admin:
            fail()
        sub = cgi_get("subject")
        bod = cgi_get("body")
        recips = cgi_get("recipients", default=[])
        if not recips:
            if config.ctuser.wpmail:
                log("no recipients specified -- WP mode enabled -- building recipient list...")
                recips = getWPmails()
            else:
                fail("no recipients specified -- can't email nobody")
        if len(recips) < 400:
            log("fewer than 400 recips - doing batches of 100")
            batch(recips, lambda chunk : send_mail(bcc=chunk,
                subject=sub, body=bod), chunk=100)
        else: # requires mailer cron
            log("more than 400 recips - enqueueing Email record")
            Email(subject=sub, body=bod, recipients=recips).put()

respond(response)