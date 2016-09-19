from cantools import config

JOIN = {}
JOIN["body"] = """Welcome!

Please click here to activate your account:

http://""" + config.web.domain + """/user?action=activate&key=%s

That's it!"""
JOIN["html"] = """Welcome!<br>
<br>
Please click <a href='http://""" + config.web.domain + """/user?action=activate&key=%s'>here</a> to activate your account.<br>
<br>
That's it!"""

ACTIVATE = {}
ACTIVATE["body"] = """Your account is now active.

Click here to log in:

http://""" + config.web.domain + """/

Great!"""
ACTIVATE["html"] = """Your account is now active.<br>
<br>
Click <a href='http://""" + config.web.domain + """/'>here</a> to log in.<br>
<br>
Great!"""

CONTACT = {}
CONTACT["body"] = """You have received the following message from %s:

---
%s
---

Click here to see %s's profile:

http://""" + config.web.domain + """/profile.html#%s

Click here to respond:

http://""" + config.web.domain + """/messages.html#%s

Have a great day!"""
CONTACT["html"] = """You have received the following message from %s:<br>
<br>
---<br>
%s<br>
---<br>
<br>
Click <a href='http://""" + config.web.domain + """/profile.html#%s'>here</a> to see %s's profile.<br>
<br>
Click <a href='http://""" + config.web.domain + """/messages.html#%s'>here</a> to respond.<br>
<br>
Have a great day!"""