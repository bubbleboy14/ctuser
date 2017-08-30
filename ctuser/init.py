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
	"activation": "auto" # or "user" or [email_address] -- requires config.mailer
}