# ctuser
This package includes a model, a request handler, and frontend components, including a profile page and a browsing interface, for handling user accounts.


# Back (Init Config)

    copies = {
    	".": ["emailTemplates.py"]
    }
    syms = {
    	".": ["_user.py"],
    	"html": ["user"],
    	"img": ["user"],
    	"js": ["user"]
    }
    model = {
    	"ctuser.model": ["CTUser", "Message", "Conversation"]
    }
    routes = {
    	"/_user": "_user.py"
    }
    cfg = {
    	"activation": { # activation rules per user type
    		"ctuser": "auto" # or "confirm" or [email_address] -- requires config.mailer
    	}
    }
    util = """
    // ctuser extras
    core.util._needsUser = ["/edit"]; // supplement as necessary
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
    		"redirect": "/"
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
    		"/edit": "admin",
    		"/user/email.html": "admin",
    		"/user/results.html": "admin",
    		"/user/profile.html": "user"
    	}
    }