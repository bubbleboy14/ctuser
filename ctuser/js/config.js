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
			"password": ["password"],
			"password2": ["password (again)"],
			"firstName": ["first name"],
			"lastName": ["last name"],
			"blurb": ["tell us about yourself"]
		}
	},
	"access": {
		"*": true,
		"/user/profile.html": "user",
		"/user/results.html": "admin"
	}
}