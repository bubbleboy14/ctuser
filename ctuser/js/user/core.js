user.core = {
	_: {
		messages: {
			join: "great! now just check your inbox for a welcome email, click the activation link, and log in.",
			login: "great, you're logged in"
		},
		login: function(data, cb) {
			user.core._current = data;
			CT.storage.set("user", data);
			user.core._login_links.update();
			alert(user.core._.messages.login);
			cb && cb();
		}
	},
	login: function(cb, fail_cb) {
		var tryIt = function() {
			if (!CT.parse.validEmail(email.value))
				return alert("please provide a valid email");
			var params = {
				action: "login",
				email: email.value,
				password: pw.value
			};
			CT.net.post("/_user", params, "login failed :'(", function(data) {
				user.core._.login(data, cb);
			}, fail_cb);
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
	join: function(opts, postRedir) {
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
			CT.net.post("/_user", params, "join failed :(", function(data) {
				alert(user.core._.messages.join);
				user.core._.login(data);
				if (postRedir)
					window.location = postRedir;
			});
			jmodal.hide();
		}, tryIt = function() {
			if (!CT.parse.validEmail(email.value))
				return alert("please provide a valid email");
			if (pw.value != pw2.value)
				return alert("passwords don't match!");
			if (!CT.parse.validPassword(pw.value))
				return alert("password must contain at least 6 characters");
			if (!core.config.ctuser.profile.naked_join && (!firstName.value || !lastName.value))
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
		if (core.config.ctuser.profile.naked_join) {
			firstName.classList.add("hidden");
			lastName.classList.add("hidden");
		}
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
		if (user.core._current && user.core._current.key == u.key)
			return u;
		u.img = u.img || core.config.ctuser.defaults.img;
		u.blurb = u.blurb || core.config.ctuser.defaults.blurb;
		u.buttons = u.buttons || {};
		u.buttons.contact = u.buttons.contact || function() {
			location = "/user/messages.html#" + u.key;
		};
		return u;
	},
	fullName: function(u, link) {
		var fname = u.firstName + " " + u.lastName;
		if (link)
			return CT.dom.link(fname, null, "/user/profile.html#" + u.key);
		return fname;
	},
	all: function(cb, category, filters) {
		CT.db.get(category || core.config.ctuser.results.model, function(users) {
			CT.data.addSet(users);
			cb(users.map(user.core.prep));
		}, null, null, null, filters);
	},
	get: function() {
		user.core._current = CT.storage.get("user");
		user.core._current && CT.data.add(user.core.prep(user.core._current));
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
		user.core._login_links = CT.dom.div(null, null, "ctll");
		user.core._login_links.update = function() { // wrap cbs to avoid MouseEvents
			if (user.core._current) {
				var lz = [];
				if (opts.extras.user)
					lz.push(opts.extras.user);
				if (user.core._current.admin && opts.extras.admin)
					lz.push(opts.extras.admin);
				if (opts.extras[user.core._current.modelName])
					lz.push(opts.extras[user.core._current.modelName]);
				if (opts.extras["*"])
					lz.push(opts.extras["*"]);
				lz.push(CT.dom.link("logout", function() { opts.logout(); }, null, "right"));
				CT.dom.setContent(user.core._login_links, lz);
			} else {
				var lolz = user.core._login_links._lolz = user.core._login_links._lolz || [
					CT.dom.link("login", function() { opts.login(); }),
					CT.dom.pad(),
					CT.dom.link("join", function() { opts.join(); })
				];
				if (opts.extras["*"])
					lolz = [opts.extras["*"], lolz];
				CT.dom.setContent(user.core._login_links, lolz);
			}
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
	},
	results: function(cfg) {
		if (cfg.sections) {
			var results = {}, build = function() {
				if (Object.keys(results).length != cfg.sections.length)
					return;
				new CT.slider.Slider({
					frames: cfg.sections.filter(function(s) {
						return !!results[s.name].length;
					}).map(function(s) {
						return {
							label: s.name,
							frames: results[s.name]
						};
					}),
					arrow: cfg.arrow,
					mode: "chunk",
					parent: "ctmain",
					subMode: "profile",
					bubblePosition: "top"
				});
			};
			cfg.sections.forEach(function(s) {
				user.core.all(function(data) {
					results[s.name] = data;
					build();
				}, cfg.model, CT.merge(s.filters, cfg.filters));
			});
		} else {
			user.core.all(function(users) {
				new CT.slider.Slider({
					frames: users,
					arrow: cfg.arrow,
					parent: "ctmain",
					mode: "profile"
				});
			}, cfg.model, cfg.filters);
		}
	},
	buildConvo: function(convo) {
		var n = CT.dom.node(), newMsg = function(m) {
				return [
					user.core.fullName(CT.data.get(m.sender), true),
					CT.dom.pad(),
					CT.dom.span(m.body)
				];
			}, viewConvo = function() {
				var mnode = CT.dom.node(convo.messages.map(newMsg)),
					inode = CT.dom.smartField({
						classname: "w19-20",
						blurs: core.config.ctuser.messages.blurs.message,
						cb: function(val) {
							val && CT.net.post("/_user", {
								action: "contact",
								user: user.core._current.key,
								conversation: convo.key,
								message: val
							}, "comment failed!", function(mkey) {
								var d = {
									key: mkey,
									sender: user.core._current.key,
									conversation: convo.key,
									body: val
								};
								CT.data.add(d);
								convo.messages.push(d);
								CT.dom.addContent(mnode, newMsg(d));
								inode.value = "";
								inode.blur();
							});
						}
					});
				CT.dom.setContent(n, [
					CT.dom.div(convo.topic, "big bold pv10"),
					mnode,
					inode
				]);
			};
		if (convo.messages)
			viewConvo();
		else {
			CT.db.get("message", function(msgs) {
				convo.messages = msgs;
				viewConvo();
			}, 1000, null, null, {
				conversation: convo.key
			});
		}
		return n;
	},
	messages: function() {
		CT.db.get("conversation", function(convos) {
			var participants = {};
			convos.forEach(function(c) {
				c.participants.forEach(function(p) {
					participants[p] = true;
				});
			});
			CT.db.multi(Object.keys(participants), function(pdata) {
				pdata.forEach(user.core.prep);
				var tl = CT.layout.listView({
					data: convos,
					listContent: function(convo) {
						return user.core.fullName(CT.data.get(convo.participants.filter(function(p) {
							return p != user.core._current.key;
						})[0]));
					},
					hashcheck: function() {
						if (location.hash) {
							var recipient = location.hash.slice(1),
								n = CT.dom.node();
							CT.db.one(recipient, function(target) {
								// already tried loading conversation - must be user
								var startConvo = function() {
									var tval = CT.dom.getFieldValue(topic),
										mval = CT.dom.getFieldValue(message);
									if (!tval || !mval)
										return alert("please provide a topic and a message");
									CT.net.post("/_user", {
										action: "contact",
										topic: tval,
										message: mval,
										recipient: recipient,
										user: user.core._current.key
									}, "message failed!", function(ckey) {
										var c = {
											key: ckey,
											topic: tval,
											participants: [
												user.core._current.key,
												recipient
											],
											messages: [
												{ // no key, but not necessary at this point
													body: mval,
													conversation: ckey,
													sender: user.core._current.key
												}
											]
										};
										CT.data.add(c);
										tl.preAdd(c, true);
									});
								}, topic = CT.dom.smartField({
									cb: startConvo,
									classname: "w19-20",
									blurs: core.config.ctuser.messages.blurs.topic
								}), message = CT.dom.smartField({
									isTA: true,
									classname: "w19-20",
									blurs: core.config.ctuser.messages.blurs.message
								});
								CT.dom.setContent(n, [
									CT.dom.div("Contact " + target.firstName, "big bold pv10"),
									topic,
									CT.dom.br(),
									message,
									CT.dom.br(),
									CT.dom.button("Send", startConvo)
								]);
							});
							return n;
						}
					},
					fallback: function() {
						return "no messages yet!";
					},
					content: user.core.buildConvo
				});
			});
		}, 1000, null, null, {
			participants: {
				comparator: "contains",
				value: user.core._current.key
			}
		});
	},
	email: function() {
		var subject = CT.dom.smartField({
			classname: "w1",
			blurs: ["subject", "title"]
		}), body = CT.dom.smartField({
			isTA: true,
			classname: "w1 mt5 hmin200p",
			blurs: ["email body", "write your message here"]
		});
		CT.dom.setContent("ctmain", CT.dom.div([
			CT.dom.div("Send an Email!", "biggest padded centered"),
			subject,
			body,
			CT.dom.button("send it!", function() {
				CT.net.post({
					spinner: true,
					path: "/_user",
					params: {
						action: "email",
						user: user.core._current.key,
						subject: CT.dom.getFieldValue(subject),
						body: CT.dom.getFieldValue(body)
					},
					cb: function() {
						alert("you did it!")
					}
				});
			})
		], "padded"));
	}
};

if (!user.core.canAccess(location.pathname))
	location = core.config.ctuser.redir || "/";

core.config.header.right.push(user.core.links({
	extras: core.config.ctuser.links
}));