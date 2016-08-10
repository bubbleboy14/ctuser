import os

jsu = os.path.join("js", "user")
dirs = [jsu]
syms = {
	".": ["ctuser_model.py", "_user.py"],
	"html": ["user"]
}
syms[jsu] = ["core.js", "profile.js"]
model = {
	"ctuser_model": ["CTUser"]
}
routes = {
	"/_user": "_user.py"
}