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
	join: function(opts) {
		opts = CT.merge(opts, { // also: tos
			selects: {},
			checkboxes: {},
			utype: "User"
		});
		var jmodal, postIt = function() {
			var params = {
				action: "join",
				utype: opts.utype.replace(" ", ""),
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
				CT.dom.node("Join - " + opts.utype, "div", "biggest"),
				email, [ firstName, lastName ], [ pw, pw2 ]
			], selkeys = Object.keys(opts.selects), chekeys = Object.keys(opts.checkboxes);

		selkeys.length && content.push(selkeys.map(function(k) {
			var obj = opts.selects[k];
			obj.node = CT.dom.select(obj.data, null, null, obj.current, null, null, true);
			return [CT.parse.capitalize(k), obj.node];
		}));
		chekeys.length && content.push(chekeys.map(function(k) {
			var obj = opts.checkboxes[k];
			obj.node = CT.dom.checkboxAndLabel(k, obj.isChecked, obj.label);
			return obj.node;
		}));
		content.push(CT.dom.button("Continue", tryIt));
		jmodal = new CT.modal.Modal({
			transition: "slide",
			content: content
		});
		jmodal.show();
	},
	get: function() {
		user.core._current = CT.storage.get("user");
		return user.core._current;
	},
	links: function(opts) {
		opts = CT.merge(opts, {
			join: user.core.join,
			login: user.core.login,
			logout: user.core.logout
		});
		user.core.get();
		user.core._login_links = CT.dom.node();
		user.core._login_links.update = function() {
			if (user.core._current)
				CT.dom.setContent(user.core._login_links, CT.dom.link("logout", opts.logout));
			else
				CT.dom.setContent(user.core._login_links, [
					CT.dom.link("login", opts.login),
					CT.dom.pad(),
					CT.dom.link("join", opts.join)
				]);
		};
		user.core._login_links.update();
		return user.core._login_links;
	}
};