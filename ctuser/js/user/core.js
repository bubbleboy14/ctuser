user.core = {
	_: {
		messages: {
			join: "great! now just check your inbox for an ocwa welcome email, click the activation link, and log in.",
			login: "great, you're logged in"
		}
	},
	login: function() {
		var tryIt = function() {
			if (!CT.parse.validEmail(email.value))
				return alert("please provide a valid email");
			var params = {
				action: "login",
				email: email.value,
				password: pw.value
			};
			CT.net.post("/_user", params, "login failed :'(", function(data) {
				user.core._current = data;
				CT.storage.set("user", data);
				user.core._login_links.update();
				alert(user.core._.messages.login);
			});
			limodal.hide();
		}, email = CT.dom.smartField(tryIt, null, null, null, null, ["email"]),
			pw = CT.dom.smartField(tryIt, null, null, null, "password", ["password"]),
			limodal = new CT.modal.Modal({
				transition: "slide",
				content: [
					CT.dom.node("Log In", "div", "biggest"),
					email, pw,
					CT.dom.button("Continue", tryIt)
				]
			});
		limodal.show();
	},
	logout: function() {
		user.core._current = null;
		CT.storage.clear();
		user.core._login_links.update();
	},
	_userType: function(opts) {
		(new CT.modal.Prompt({
			noClose: true,
			transition: "slide",
			style: "single-choice",
			data: core.config.ctuser.model.choices,
			cb: function(utype) {
				opts.utype = utype;
				user.core.join(opts);
			}
		})).show();
	},
	join: function(opts) {
		if (opts && opts.utype)
			opts = CT.merge(opts, core.config.ctuser.model[opts.utype]);
		else if (core.config.ctuser.model.choices)
			return user.core._userType(opts || {});
		opts = CT.merge(opts, core.config.ctuser.model["*"], {
			selects: {}, // also: tos, utype
			checkboxes: {},
			umodel: "ctuser"
		});
		var jmodal, postIt = function() {
			var params = {
				action: "join",
				utype: opts.utype && opts.utype.replace(" ", "") || opts.umodel,
				email: email.value,
				password: pw.value,
				firstName: firstName.value,
				lastName: lastName.value,
				extras: {}
			};
			for (var s in opts.selects)
				params.extras[s] = opts.selects[s].node.value();
			for (var c in opts.checkboxes)
				params.extras[c] = opts.checkboxes[c].node.firstChild.checked;
			CT.net.post("/_user", params, "join failed :(", function() {
				alert(user.core._.messages.join);
			});
			jmodal.hide();
		}, tryIt = function() {
			if (!CT.parse.validEmail(email.value))
				return alert("please provide a valid email");
			if (pw.value != pw2.value)
				return alert("passwords don't match!");
			if (!CT.parse.validPassword(pw.value))
				return alert("password must contain at least 6 characters");
			if (!firstName.value || !lastName.value)
				return alert("please provide a name");
			if (opts.tos) {
				(new CT.modal.Prompt({
					transition: "slide",
					style: "confirm",
					prompt: opts.tos,
					cb: postIt
				})).show();
			} else
				postIt();
		}, email = CT.dom.smartField(tryIt, null, null, null, null, ["email"]),
			pw = CT.dom.smartField(tryIt, null, null, null, "password", ["password"]),
			pw2 = CT.dom.smartField(tryIt, null, null, null, "password", ["password (again)"]),
			firstName = CT.dom.smartField(tryIt, null, null, null, null, ["first name"]),
			lastName = CT.dom.smartField(tryIt, null, null, null, null, ["last name"]),
			content = [
				CT.dom.node("Join - " + (opts.utype || "User"), "div", "biggest"),
				email, [ firstName, lastName ], [ pw, pw2 ]
			];
		user.core.fields(opts, content);
		content.push(CT.dom.button("Continue", tryIt));
		jmodal = new CT.modal.Modal({
			transition: "slide",
			content: content
		});
		jmodal.show();
	},
	fields: function(opts, content, withUser) {
		var selkeys = Object.keys(opts.selects), chekeys = Object.keys(opts.checkboxes);
		selkeys.length && content.push(selkeys.map(function(k) {
			var obj = opts.selects[k];
			obj.node = CT.dom.select(obj.data, null, k,
				withUser ? user.core._current[k] : obj.current, null, null, true);
			return [CT.parse.capitalize(k), obj.node];
		}));
		chekeys.length && content.push(chekeys.map(function(k) {
			var obj = opts.checkboxes[k];
			obj.node = CT.dom.checkboxAndLabel(k,
				withUser ? user.core._current[k] : obj.isChecked, obj.label);
			return obj.node;
		}));
	},
	prep: function(u) {
		u.img = u.img || core.config.ctuser.defaults.img;
		u.blurb = u.blurb || core.config.ctuser.defaults.blurb;
		u.name = CT.dom.link(u.firstName + " " + u.lastName,
			null, "/user/profile.html#" + u.key);
		return u;
	},
	all: function(cb, category, filters) {
		CT.db.get(category || core.config.ctuser.results.model, function(users) {
			cb(users.map(user.core.prep));
		}, null, null, null, filters);
	},
	get: function() {
		user.core._current = CT.storage.get("user");
		user.core._current && CT.data.add(user.core._current);
		return user.core._current;
	},
	update: function(changes) {
		if (changes) for (var change in changes)
			user.core._current[change] = changes[change];
		CT.storage.set("user", user.core._current);
	},
	links: function(opts) {
		opts = CT.merge(opts, {
			join: user.core.join,
			login: user.core.login,
			logout: user.core.logout,
			extras: {}
		});
		user.core.get();
		user.core._login_links = CT.dom.node();
		user.core._login_links.update = function() { // wrap cbs to avoid MouseEvents
			if (user.core._current) {
				var lz = [];
				if (opts.extras.user)
					lz.push(opts.extras.user);
				if (user.core._current.admin && opts.extras.admin)
					lz.push(opts.extras.admin);
				if (opts.extras[user.core._current.modelName])
					lz.push(opts.extras[user.core._current.modelName]);
				lz.push(CT.dom.link("logout", function() { opts.logout(); }, null, "right"));
				CT.dom.setContent(user.core._login_links, lz);
			} else
				CT.dom.setContent(user.core._login_links, [
					CT.dom.link("login", function() { opts.login(); }),
					CT.dom.pad(),
					CT.dom.link("join", function() { opts.join(); })
				]);
		};
		user.core._login_links.update();
		user.core._login_links.opts = opts;
		return user.core._login_links;
	},
	setAction: function(aname, cb) {
		user.core._login_links.opts[aname] = cb;
	},
	meetsRule: function(rule) {
		// rule options: true, false, "user", "admin", "modelName", ["modelName1", "modelName2"]
		if (rule == false || rule == true)
			return rule;
		var u = user.core.get();
		if (!u)
			return false;
		if (rule == "admin")
			return u.admin;
		return (rule == "user") || (rule == u.modelName) || (rule.indexOf(u.modelName) != -1);
	},
	canAccess: function(pn) {
		var rule = core.config.ctuser.access["*"];
		if (pn in core.config.ctuser.access)
			rule = core.config.ctuser.access[pn];
		return user.core.meetsRule(rule);
	}
};

if (!user.core.canAccess(location.pathname))
	location = "/";

core.config.header.right.push(user.core.links({
	extras: core.config.ctuser.links
}));