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
	"access": {
		"*": true,
		"/user/profile.html": "user",
		"/user/results.html": "admin"
	}
}