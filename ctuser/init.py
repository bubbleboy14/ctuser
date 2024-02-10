templates = "emailTemplates.py"
syms = {
	".": ["_user.py", "mailer.py"],
	"html": ["user"],
	"img": ["user"],
	"js": ["user"]
}
model = {
	"ctuser.model": ["*"]
}
routes = {
	"/_user": "_user.py"
}
cfg = {
	"activation": { # activation rules per user type
		"ctuser": "auto" # or "confirm" or "verify" or [email_address] -- requires config.mailer
	},
	"email": {
		"unsub": True,
		"groups": {},
		"chunk": 5,
		"bulksize": 1000,
		"breakstrip": True,
		"unsubrefused": True
	}
}
util = """
// ctuser extras
core.util._needsUser = ["/edit", "/edit/style.html"]; // supplement as necessary
if (core.util._needsUser.indexOf(location.pathname) != -1)
	CT.require("user.core", true);
"""
requires = ["ctedit"]
