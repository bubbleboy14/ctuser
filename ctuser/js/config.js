{
	"links": {
		"user": [],
		"admin": []
	},
	"defaults": {
		"img": "/img/user/default.png",
		"blurb": "No blurb yet!"
	},
	"results": {
		"model": "ctuser",
		"filters": {}
	},
	"profile": {
		"model": "ctuser",
		"filters": {},
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