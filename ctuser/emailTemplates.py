from cantools import config

RESET = """
As requested, we've reset your password.

New password: "%s".

Don't forget to change it, and have a great day!

That's it!
"""

JOIN = """Welcome!

Please click <a href='""" + config.web.protocol + """://""" + config.web.domain + """/_user?action=activate&key=%s'>here</a> to activate your account.

That's it!"""

JOINED = """Hello!

Someone just applied for membership: %s

Please click <a href='""" + config.web.protocol + """://""" + config.web.domain + """/_user?action=activate&key=%s'>here</a> when you're ready to activate this account.

That's it!"""

VERIFY = """Your account is almost ready!

Click <a href='""" + config.web.protocol + """://""" + config.web.domain + """/user/activate.html#%s'>here</a> to activate it!

See you soon!"""

ACTIVATE = """Your account is now active.

Click <a href='""" + config.web.protocol + """://""" + config.web.domain + """/'>here</a> to log in.

Great!"""

CONTACT = """You have received the following message from %s:

---
%s
---

Click <a href='""" + config.web.protocol + """://""" + config.web.domain + """/user/profile.html#%s'>here</a> to see %s's profile.

Click <a href='""" + config.web.protocol + """://""" + config.web.domain + """/user/messages.html#%s'>here</a> to respond.

Have a great day!"""