{
	"links": {
		"user": [],
		"admin": []
	},
	"hovers": {},
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
		"cc": false,
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
		},
		"classes": {},
		"fopts": {}
	},
	"login": {
		"jlink": true,
		"legacy": false,
		"fclass": "w1",
		"mclass": "basicpopup login_modal",
		"msg": "Sign in",
		"butt": "Sign in",
		"jmsg": "No account?",
		"jlinkmsg": "Create an account",
		"blurs": {
			"email": ["Email"],
			"password": ["Password"]
		}
	},
	"join": {
		"llink": true,
		"fclass": "w1",
		"mclass": "basicpopup join_modal",
		"model": "ctuser",
		"butt": "Create account",
		"lmsg": "Already have an account?",
		"llinkmsg": "Sign in",
		"blurs": {
			"email": ["Email"],
			"password": ["Password"],
			"password2": ["Password again"],
			"firstName": ["First Name"],
			"lastName": ["Last Name"]
		}
	},
	"access": {
		"*": true,
		"/edit": "admin",
		"/user/email.html": "admin",
		"/user/results.html": "admin",
		"/user/profile.html": "user"
	},
	"resetter": true,
	"autoEdit": true,
	"email": {
		"any_recips": false,
		"autogal": false,
		"groups": []
	},
	"alerts": {
		"join": "great! now just check your inbox for a welcome email, click the activation link, and log in.",
		"login": "great, you're logged in",
		"apw": "blank stare",
		"forgot": "we've emailed you your new password (a random, temporary value). don't forget to change it!"
	}
}