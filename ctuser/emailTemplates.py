from cantools import config

JOIN = """Welcome!

Please click <a href='http://""" + config.web.domain + """/user?action=activate&key=%s'>here</a> to activate your account.

That's it!"""

JOINED = """Hello!

Someone just applied for membership: %s

Please click <a href='http://""" + config.web.domain + """/user?action=activate&key=%s'>here</a> when you're ready to activate this account.

That's it!"""

ACTIVATE = """Your account is now active.

Click <a href='http://""" + config.web.domain + """/'>here</a> to log in.

Great!"""

CONTACT = """You have received the following message from %s:

---
%s
---

Click <a href='http://""" + config.web.domain + """/profile.html#%s'>here</a> to see %s's profile.

Click <a href='http://""" + config.web.domain + """/messages.html#%s'>here</a> to respond.

Have a great day!"""