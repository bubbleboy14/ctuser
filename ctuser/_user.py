from cantools.web import respond, succeed, fail, cgi_get, redirect, send_mail
from cantools import config
from model import db, User
from emailTemplates import JOIN, ACTIVATE, CONTACT

def response():
    action = cgi_get("action", choices=["join", "activate", "login", "contact"])
    if action == "join":
        email = cgi_get("email")
        if User.query(User.email == email).get():
            fail("this email is already in use")
        u = db.get_model(cgi_get("utype"))(email=email,
            firstName=cgi_get("firstName"), lastName=cgi_get("lastName"),
            **cgi_get("extras"))
#            race=cgi_get("race"), gender=cgi_get("gender"),
#            felon=cgi_get("felon"), oakland_resident=cgi_get("oaklandResident"))
        u.put() # to generate created timestamp
        u.password = db.hashpass(cgi_get("password"), u.created)
        u.put()
        usk = u.key.urlsafe()
        send_mail(to=u.email, subject="activation required",
            body=JOIN["body"]%(usk,), html=JOIN["html"]%(usk,))
    elif action == "activate":
        u = db.get(cgi_get("key"))
        if u and not u.active: # else, don't even trip
            u.active = True
            u.put()
        send_mail(to=u.email, subject="account activated",
            body=ACTIVATE["body"], html=ACTIVATE["html"])
        redirect("/", "you did it!")
    elif action == "login":
        # or query Worker/PermitHolder separately???
        u = User.query(User.email == cgi_get("email"),
            User.active == True).get()
        if not u or u.password != db.hashpass(cgi_get("password"), u.created):
            fail()
        succeed(u.data())
    elif action == "contact":
        sender = db.get(cgi_get("user"))
        recipient = db.get(cgi_get("recipient"))
        message = cgi_get("message")
        send_mail(to=recipient.email,
            subject="message from %s"%(sender.firstName,),
            body=CONTACT["body"]%(sender.fullName(), message,
                sender.firstName, sender.key),
            html=CONTACT["html"]%(sender.fullName(), message,
                sender.firstName, sender.key))

respond(response)