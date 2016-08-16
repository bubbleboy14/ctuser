import os

jsu = os.path.join("js", "user")
dirs = [jsu]
syms = {
	".": ["_user.py"],
	"html": ["user"]
}
syms[jsu] = ["core.js", "profile.js"]
model = {
	"ctuser.model": ["CTUser"]
}
routes = {
	"/_user": "_user.py"
}