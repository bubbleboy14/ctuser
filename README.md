# ctuser
This package includes a model, a request handler, and frontend components, including a profile page and a browsing interface, for handling user accounts.


# Back (Init Config)

    templates = "emailTemplates.py"
    syms = {
    	".": ["_user.py", "mailer.py"],
    	"html": ["user"],
    	"img": ["user"],
    	"js": ["user"]
    }
    model = {
    	"ctuser.model": ["*"]
    }
    routes = {
    	"/_user": "_user.py"
    }
    cfg = {
    	"activation": { # activation rules per user type
    		"ctuser": "auto" # or "confirm" or "verify" or [email_address] -- requires config.mailer
    	}
    }
    util = """
    // ctuser extras
    core.util._needsUser = ["/edit", "/edit/style.html"]; // supplement as necessary
    if (core.util._needsUser.indexOf(location.pathname) != -1)
    	CT.require("user.core", true);
    """
    requires = ["ctedit"]
    

# Front (JS Config)

## core.config.ctuser
### Import line: 'CT.require("core.config");'
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
    	"autoEdit": true,
    	"email": {
    		"any_recips": false
    	}
    }