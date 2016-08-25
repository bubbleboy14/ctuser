import os

copies = {
	".": "emailTemplates.py"
}
syms = {
	".": ["_user.py"],
	"html": ["user"],
	"img": ["user"],
	"js": ["user"]
}
model = {
	"ctuser.model": ["CTUser"]
}
routes = {
	"/_user": "_user.py"
}
