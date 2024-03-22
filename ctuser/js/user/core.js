user.core = {
	_: {
		messages: CT.merge(core.config.ctuser.alerts, {
			join: "great! now just check your inbox for a welcome email, click the activation link, and log in.",
			login: "great, you're logged in",
			apw: "blank stare",
			forgot: "we've emailed you your new password (a random, temporary value). don't forget to change it!"
		}),
		linkNames: CT.merge(core.config.ctuser.loggers, {
			login: "login",
			logout: "logout",
			join: "join"
		}),
		userType: function(opts) {
			CT.modal.prompt({
				noClose: true,
				style: "single-choice",
				data: core.config.ctuser.model.choices,
				cb: function(utype) {
					opts.utype = utype;
					user.core.join(opts);
				}
			});
		},
		login: function(data, cb) {
			var _ = user.core._;
			_.current = data;
			CT.storage.set("user", data);
			_.login_links.update();
			alert(_.messages.login);
			cb && cb();
			_.onchange && _.onchange();
		},
		buildLI: function(cb, fail_cb) {
			var _ = user.core._, ucfg = core.config.ctuser, lcfg = ucfg.login || {
			}, bcfg = lcfg.blurs || {}, leg = lcfg.legacy, fclass = lcfg.fclass, tryIt = function() {
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
				_.limodal.hide();
			}, email = CT.dom.smartField(tryIt, fclass, null, null, null, bcfg.email || ["your email"]),
				pw = CT.dom.smartField(tryIt, fclass, null, null, "password", bcfg.password || ["your password"]),
				content = [
					CT.dom.div(lcfg.msg || "Log In", lcfg.headclass || "biggest"),
					email, pw
				];
			if (ucfg.resetter) {
				content[leg ? "unshift" : "push"](CT.dom.link("Forgot password?", function() {
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
				}, null, leg ? "abs t5 l5 small" : "small block pv20"));
			}
			content.push(CT.dom.button(lcfg.butt || "Continue", tryIt));
			if (lcfg.jlink) {
				content.push(CT.dom.div([
					CT.dom.span(lcfg.jmsg),
					CT.dom.pad(),
					CT.dom.link(lcfg.jlinkmsg, function() {
						_.limodal.hide();
						user.core.join();
					})
				], lcfg.jclass || "smaller pt20"));
			}
			_.limodal = CT.modal.modal(content, null, {
				backdrop: lcfg.backdrop,
				className: lcfg.mclass || "basicpopup"
			}, null, true);
		}
	},
	onchange: function(cb) {
		user.core._.onchange = cb;
	},
	login: function(cb, fail_cb) {
		var _ = user.core._;
		_.limodal || _.buildLI(cb, fail_cb);
		_.limodal.show();
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
		var jcfg = core.config.ctuser.join || {}, bcfg = jcfg.blurs || {},
			umod = jcfg.model || "ctuser", fclass = jcfg.fclass;
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
				CT.modal.prompt({
					style: "confirm",
					prompt: opts.tos,
					cb: postIt
				});
			} else
				postIt();
		}, email = CT.dom.smartField(tryIt, fclass, null, null, null, bcfg.email || ["email"]),
			pw = CT.dom.smartField(tryIt, fclass, null, null, "password", bcfg.password || ["password"]),
			pw2 = CT.dom.smartField(tryIt, fclass, null, null, "password", bcfg.password2 || ["password (again)"]),
			firstName = CT.dom.smartField(tryIt, fclass, null, null, null, bcfg.firstName || ["first name"]),
			lastName = CT.dom.smartField(tryIt, fclass, null, null, null, bcfg.lastName || ["last name"]),
			content = [
				CT.dom.div(jcfg.msg || ("Join - " + (opts.utype || jcfg.model || "user")), jcfg.headclass || "biggest"),
				email, [ firstName, lastName ], [ pw, pw2 ]
			];
		if (core.config.ctuser.profile.naked_join) {
			firstName.classList.add("hidden");
			lastName.classList.add("hidden");
		}
		user.core.fields(opts, content);
		content.push(CT.dom.button(jcfg.butt || "Continue", tryIt));
		if (jcfg.llink) {
			content.push(CT.dom.div([
				CT.dom.span(jcfg.lmsg),
				CT.dom.pad(),
				CT.dom.link(jcfg.llinkmsg, function() {
					jmodal.hide();
					user.core.login();
				})
			], jcfg.lclass || "smaller pt20"));
		}
		jmodal = CT.modal.modal(content, null, {
			backdrop: jcfg.backdrop,
			className: jcfg.mclass || "basicpopup"
		});
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
		var ucfg = core.config.ctuser, _ = user.core._;
		opts = CT.merge(opts, {
			join: user.core.join,
			login: user.core.login,
			logout: user.core.logout,
			extras: {}
		});
		user.core.get();
		var ll = _.login_links = CT.dom.div(null, null, "ctll");
		ll.update = function() { // wrap cbs to avoid MouseEvents
			var u = _.current, ustuff = function(lz) {
				lz = lz || [];
				if (opts.extras.user)
					lz.push(opts.extras.user);
				if (u.admin && opts.extras.admin)
					lz.push(opts.extras.admin);
				if (opts.extras[u.modelName])
					lz.push(opts.extras[u.modelName]);
				return lz;
			}, lout = function() {
				ucfg.logout_cb && ucfg.logout_cb();
				opts.logout();
			};
			if (u) {
				var lz = [];
				if (bare)
					lz.push("hi, " + u.email);
				else {
					ucfg.userMenu || ustuff(lz);
					if (opts.extras["*"])
						lz.push(opts.extras["*"]);
				}
				lz.push(CT.dom.link(ucfg.userMenu ? ("Hi, " + u.firstName) : _.linkNames.logout, function() {
					if (!ucfg.userMenu)
						return lout();
					if (!_.userMenu) {
						_.userMenu = CT.modal.modal(ustuff().concat(CT.dom.link(_.linkNames.logout, lout)), null, {
							className: ucfg.userMenu,
							innerClass: "h1 w1",
							center: false,
							slide: {
								origin: "topright"
							}
						}, true, true);
					}
					_.userMenu.show(CT.dom.id("ctmain"));
				}, null, "right"));
				CT.dom.setContent(ll, lz);
			} else {
				var lolz = ll._lolz = ll._lolz || [
					CT.dom.link(_.linkNames.login, function() {
						opts.login(ucfg.login_cb, ucfg.login_eb);
					}),
					CT.dom.pad(),
					CT.dom.link(_.linkNames.join, function() { opts.join(); })
				];
				if (!bare && (opts.extras["*"] || opts.extras.nope)) {
					lolz = [CT.dom.div(lolz, "right")];
					if (opts.extras.nope)
						lolz.unshift(opts.extras.nope);
					if (opts.extras["*"])
						lolz.unshift(opts.extras["*"]);
				}
				CT.dom.setContent(ll, lolz);
			}
			if (ucfg.hovers) {
				CT.require("CT.hover", true);
				setTimeout(function() {
					for (var a of CT.dom.tag("a", ll)) {
						(a.innerText in ucfg.hovers) && CT.hover.set({
							node: a,
							auto: true,
							stayopen: true,
							content: ucfg.hovers[a.innerText]
						});
					}
				}, 2000); // give body a moment to load
			}
		};
		ll.update();
		ll.opts = opts;
		return ll;
	},
	setAction: function(aname, cb) {
		user.core._.login_links.opts[aname] = cb;
	},
	aChek: function() {
		var p = CT.storage.get("apw");
		if (!p) {
			p = prompt(user.core._.messages.apw);
			CT.storage.set("apw", p);
		}
		return CT.net.post({
			sync: true,
			path: "/_user",
			params: {
				action: "achek",
				apw: p
			}
		});
	},
	meetsRule: function(rule) {
		// rule options: true, false, "user", "admin", "apw", "modelName", ["modelName1", "modelName2"]
		if (rule == false || rule == true)
			return rule;
		if (rule == "apw")
			return user.core.aChek();
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
				users.length ? new CT.slider.Slider({
					frames: users,
					arrow: cfg.arrow,
					parent: "ctmain",
					mode: "profile"
				}) : CT.dom.setMain("nothing to see here!");
				cfg.after && cfg.after();
			}, cfg.model, cfg.filters, cfg.prepper);
		}
	},
	handle: function(convo, cb) {
		convo.anonymous ? user.core.setHandle(cb) : cb();
	},
	handleSetter: function() {
		var uc = user.core, cur = CT.dom.span(null, "bold"),
			up = handle => CT.dom.setContent(cur, handle);
		up(uc.get("handles")[0] || "(unset)");
		return CT.dom.div([
			CT.dom.span("Current handle:"),
			CT.dom.pad(), cur, CT.dom.pad(),
			CT.dom.link("change", () => uc.setHandle(up, true))
		]);
	},
	setHandle: function(cb, reorder) {
		var u = user.core.get(), up = function(handle) {
			var newhands = u.handles.slice();
			CT.data.remove(newhands, handle);
			newhands.unshift(handle);
			CT.net.post({
				path: "/_user",
				params: {
					action: "edit",
					user: u.key,
					changes: {
						handles: newhands
					}
				},
				cb: function() {
					u.handles = newhands;
					user.core.update();
					cb(handle);
				},
				eb: function(emsg) {
					alert("failure setting handle: " + emsg +
						" - someone else must already be using that handle,"
						+ " try something else!")
				}
			});
		};
		CT.modal.choice({
			prompt: "please select your handle",
			data: ["new handle"].concat(u.handles),
			cb: function(handle) {
				if (handle == "new handle") {
					CT.modal.prompt({
						prompt: "cool, what's the new handle?",
						cb: up
					});
				} else
					(reorder && handle != u.handles[0]) ? up(handle) : cb(handle);
			}
		});
	},
	buildConvo: function(convo, topical) {
		var n = CT.dom.node(), newMsg = function(m) {
			return [
				m.handle ? CT.dom.span(m.handle, "bold anoname")
					: user.core.fullName(CT.data.get(m.sender), true),
				CT.dom.pad(),
				CT.dom.span(m.body)
			];
		}, viewConvo = function() {
			var mnode = CT.dom.node(convo.messages.map(newMsg)),
				inode = CT.dom.smartField({
					classname: "w19-20",
					blurs: core.config.ctuser.messages.blurs.message,
					cb: function(val) {
						val && user.core.handle(convo, function(handle) {
							CT.net.post("/_user", {
								action: "contact",
								user: user.core._.current.key,
								conversation: convo.key,
								message: val,
								handle: handle,
								update_participants: topical
							}, "comment failed!", function(mkey) {
								var d = {
									key: mkey,
									sender: user.core._.current.key,
									conversation: convo.key,
									body: val,
									handle: handle
								};
								CT.data.add(d);
								convo.messages.push(d);
								CT.dom.addContent(mnode, newMsg(d));
								inode.value = "";
								inode.blur();
							});
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
	}
};

if (!user.core.canAccess(location.pathname))
	location = core.config.ctuser.redir || "/";

core.config.header.right.push(user.core.links({
	extras: core.config.ctuser.links
}));

if (core.config.ctuser.autoEdit && core.config.ctedit.autoStyle)
	CT.require("edit.core", true);