copies = {
	".": ["emailTemplates.py"]
}
syms = {
	".": ["_user.py"],
	"html": ["user"],
	"img": ["user"],
	"js": ["user"]
}
model = {
	"ctuser.model": ["CTUser", "Message", "Conversation"]
}
routes = {
	"/_user": "_user.py"
}
cfg = {
	"activation": { # activation rules per user type
		"ctuser": "auto" # or "confirm" or "verify" or [email_address] -- requires config.mailer
	}
}
util = """
// ctuser extras
core.util._needsUser = ["/edit", "/edit/style.html"]; // supplement as necessary
if (core.util._needsUser.indexOf(location.pathname) != -1)
	CT.require("user.core", true);
"""
requires = ["ctedit"]