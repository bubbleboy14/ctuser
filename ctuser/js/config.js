{
	"links": {
		"user": [],
		"admin": []
	},
	"defaults": {
		"img": "/img/user/default.png",
		"blurb": "No blurb yet!"
	},
	"model": {},
	"results": {
		"model": "ctuser",
		"filters": {}
	},
	"register": {
		"password": false,
		"model": "ctuser",
		"redirect": "/",
		"nologin": false
	},
	"messages": {
		"blurs": {
			"message": ["what do you think?", "what do you say?"],
			"topic": [
				"what is this concerning?",
				"what is the subject of this correspondence?",
				"what's this all about?"
			]
		}
	},
	"profile": {
		"naked_join": false,
		"model": "ctuser",
		"omit": ["_kinds", "_label", "label", "index", "key",
			"created", "modified", "modelName",
			"active", "admin", "password", "img"],
		"blurs": {
			"email": ["email"],
			"password": ["new password"],
			"password2": ["new password (again)"],
			"firstName": ["first name"],
			"lastName": ["last name"],
			"blurb": ["tell us about yourself"]
		}
	},
	"join": {
		"model": "ctuser"
	},
	"access": {
		"*": true,
		"/edit": "admin",
		"/user/email.html": "admin",
		"/user/results.html": "admin",
		"/user/profile.html": "user"
	},
	"resetter": true,
	"autoEdit": true
}