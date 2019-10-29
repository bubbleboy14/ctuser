user.core = {
	_: {
		messages: {
			join: "great! now just check your inbox for a welcome email, click the activation link, and log in.",
			login: "great, you're logged in",
			forgot: "we've emailed you your new password (a random, temporary value). don't forget to change it!"
		},
		userType: function(opts) {
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
		login: function(data, cb) {
			var _ = user.core._;
			_.current = data;
			CT.storage.set("user", data);
			_.login_links.update();
			alert(_.messages.login);
			cb && cb();
			_.onchange && _.onchange();
		}
	},
	onchange: function(cb) {
		user.core._.onchange = cb;
	},
	login: function(cb, fail_cb) {
		var _ = user.core._, tryIt = function() {
			if (!CT.parse.validEmail(email.value))
				return alert("please provide a valid email");
			var params = {
				action: "login",
				email: email.value,
				password: pw.fieldValue()
			};
			CT.net.post("/_user", params, "login failed :'(", function(data) {
				_.login(data, cb);
			}, fail_cb);
			limodal.hide();
		}, email = CT.dom.smartField(tryIt, null, null, null, null, ["email"]),
			pw = CT.dom.smartField(tryIt, null, null, null, "password", ["password"]),
			content = [
				CT.dom.node("Log In", "div", "biggest"),
				email, pw,
				CT.dom.button("Continue", tryIt)
			], limodal;
		if (core.config.ctuser.resetter) {
			content.unshift(CT.dom.link("forgot password", function() {
				if (!CT.parse.validEmail(email.value))
					return alert("please provide a valid email");
				if (confirm("are you sure you want to reset your password?") && confirm("really?")) {
					CT.net.post({
						path: "/_user",
						params: {
							action: "reset",
							email: email.value
						},
						cb: function() {
							alert(_.messages.forgot);
						}
					});
				}
			}, null, "abs t5 l5 small"));
		}
		limodal = new CT.modal.Modal({
			transition: "slide",
			content: content
		});
		limodal.show();
	},
	logout: function() {
		var _ = user.core._;
		_.current = null;
		CT.storage.clear();
		_.login_links.update();
		_.onchange && _.onchange();
	},
	join: function(opts, postRedir, nologin) {
		if (opts && opts.utype)
			opts = CT.merge(opts, core.config.ctuser.model[opts.utype]);
		else if (core.config.ctuser.model.choices)
			return user.core._.userType(opts || {});
		var jcfg = core.config.ctuser.join,
			umod = jcfg && jcfg.model || "ctuser";
		opts = CT.merge(opts, core.config.ctuser.model["*"], {
			fields: {},
			selects: {}, // also: tos, utype
			checkboxes: {},
			umodel: umod
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
			for (var f in opts.fields)
				params.extras[f] = CT.dom.getFieldValue(opts.fields[f].node);
			for (var s in opts.selects)
				params.extras[s] = opts.selects[s].node.value();
			for (var c in opts.checkboxes)
				params.extras[c] = opts.checkboxes[c].node.firstChild.checked;
			CT.net.post("/_user", params, "join failed :(", function(data) {
				alert(user.core._.messages.join);
				if (!nologin)
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
		var fiekeys = Object.keys(opts.fields),
			selkeys = Object.keys(opts.selects),
			chekeys = Object.keys(opts.checkboxes);
		fiekeys.length && content.push(fiekeys.map(function(f) {
			var obj = opts.fields[f];
			obj.node = CT.dom.smartField({ blurs: obj.blurs });
			return obj.node;
		}));
		selkeys.length && content.push(selkeys.map(function(k) {
			var obj = opts.selects[k];
			obj.node = CT.dom.select(obj.data, null, k,
				withUser ? user.core._.current[k] : obj.current, null, null, true);
			return [CT.parse.capitalize(k), obj.node];
		}));
		chekeys.length && content.push(chekeys.map(function(k) {
			var obj = opts.checkboxes[k];
			obj.node = CT.dom.checkboxAndLabel(k,
				withUser ? user.core._.current[k] : obj.isChecked, obj.label);
			return obj.node;
		}));
	},
	prep: function(u) {
		if (!u.name) {
			u.name = u.firstName;
			if (u.lastName)
				u.name += " " + u.lastName;
		}
		if (user.core._.current && user.core._.current.key == u.key)
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
	all: function(cb, category, filters, prepper) {
		CT.db.get(category || core.config.ctuser.results.model, function(users) {
			CT.data.addSet(users);
			cb(users.map(prepper || user.core.prep));
		}, null, null, null, filters);
	},
	get: function(attr) {
		var u = user.core._.current = CT.storage.get("user");
		u && CT.data.add(user.core.prep(u));
		return (u && attr) ? u[attr] : u;
	},
	update: function(changes) {
		if (changes) for (var change in changes)
			user.core._.current[change] = changes[change];
		CT.storage.set("user", user.core._.current);
	},
	links: function(opts, bare) {
		opts = CT.merge(opts, {
			join: user.core.join,
			login: user.core.login,
			logout: user.core.logout,
			extras: {}
		});
		user.core.get();
		user.core._.login_links = CT.dom.div(null, null, "ctll");
		user.core._.login_links.update = function() { // wrap cbs to avoid MouseEvents
			var u = user.core._.current;
			if (u) {
				var lz = [];
				if (bare)
					lz.push("hi, " + u.email);
				else {
					if (opts.extras.user)
						lz.push(opts.extras.user);
					if (u.admin && opts.extras.admin)
						lz.push(opts.extras.admin);
					if (opts.extras[u.modelName])
						lz.push(opts.extras[u.modelName]);
					if (opts.extras["*"])
						lz.push(opts.extras["*"]);
				}
				lz.push(CT.dom.link("logout", function() {
					core.config.ctuser.logout_cb && core.config.ctuser.logout_cb();
					opts.logout();
				}, null, "right"));
				CT.dom.setContent(user.core._.login_links, lz);
			} else {
				var lolz = user.core._.login_links._lolz = user.core._.login_links._lolz || [
					CT.dom.link("login", function() {
						opts.login(core.config.ctuser.login_cb, core.config.ctuser.login_eb);
					}),
					CT.dom.pad(),
					CT.dom.link("join", function() { opts.join(); })
				];
				if (!bare && (opts.extras["*"] || opts.extras.nope)) {
					lolz = [lolz];
					if (opts.extras.nope)
						lolz.unshift(opts.extras.nope);
					if (opts.extras["*"])
						lolz.unshift(opts.extras["*"]);
				}
				CT.dom.setContent(user.core._.login_links, lolz);
			}
		};
		user.core._.login_links.update();
		user.core._.login_links.opts = opts;
		return user.core._.login_links;
	},
	setAction: function(aname, cb) {
		user.core._.login_links.opts[aname] = cb;
	},
	meetsRule: function(rule) {
		// rule options: true, false, "user", "admin", "modelName", ["modelName1", "modelName2"]
		if (rule == false || rule == true)
			return rule;
		var u = user.core.get();
		if (!u)
			return false;
		return (rule == "user") || (rule.indexOf("admin") != -1 && u.admin) || (rule.indexOf(u.modelName) != -1);
	},
	canAccess: function(pn) {
		var access = core.config.ctuser.access,
			p, rule = access["*"];
		for (p in access) {
			if (p.endsWith("*") && pn.startsWith(p.slice(0, -1)))
				rule = access[p];
		}
		return user.core.meetsRule(access[pn] || rule);
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
				}, s.model || cfg.model, CT.merge(s.filters, cfg.filters));
			});
		} else {
			user.core.all(function(users) {
				new CT.slider.Slider({
					frames: users,
					arrow: cfg.arrow,
					parent: "ctmain",
					mode: "profile"
				});
				cfg.after && cfg.after();
			}, cfg.model, cfg.filters, cfg.prepper);
		}
	},
	buildConvo: function(convo, topical) {
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
								user: user.core._.current.key,
								conversation: convo.key,
								message: val,
								update_participants: topical
							}, "comment failed!", function(mkey) {
								var d = {
									key: mkey,
									sender: user.core._.current.key,
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
					CT.dom.div(topical ? "Conversation" : convo.topic,
						"big bold pv10"),
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
	convo: function(ckey) { // single / standalone
		var n = CT.dom.div();
		CT.db.one(ckey, function(convo) {
			convo && CT.db.multi(convo.participants, function(pdata) {
				pdata.forEach(user.core.prep);
				CT.dom.setContent(n, user.core.buildConvo(convo, true));
			});
		});
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
						var person = CT.data.get(convo.participants.filter(function(p) {
							return p != user.core._.current.key;
						})[0]);
						return person ? user.core.fullName(person) : convo.topic;
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
										user: user.core._.current.key
									}, "message failed!", function(ckey) {
										var c = {
											key: ckey,
											topic: tval,
											participants: [
												user.core._.current.key,
												recipient
											],
											messages: [
												{ // no key, but not necessary at this point
													body: mval,
													conversation: ckey,
													sender: user.core._.current.key
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
				value: user.core._.current.key
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
						user: user.core._.current.key,
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

if (core.config.ctuser.autoEdit && core.config.ctedit.autoStyle)
	CT.require("edit.core", true);