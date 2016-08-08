import os

jsu = os.path.join("js", "user")
dirs = [jsu]
syms = {
	".": ["ctuser-model.py", "_user.py"],
	"html": ["profile.html"]
}
syms[jsu] = ["core.js", "profile.js"]
model = {
	"ctuser_model": ["CTUser"]
}
routes = {
	"/user": "_user.py"
}