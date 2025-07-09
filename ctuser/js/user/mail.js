user.mail = {
	_: {
		content: CT.dom.div(null, "ctcontent"),
		list: CT.dom.div(null, "ctlist scrolly")
	},
	img: function(url) {
		var itag = '<img src="' + url + '" style="width: 100%;">';
		return CT.dom.img({
			src: url,
			className: "h100p pointerimp",
			attrs: {
				draggable: true,
				onclick: () => tinyMCE.activeEditor.selection.setContent(itag),
				ondragstart: function(ev) {
					ev.dataTransfer.dropEffect = "copy";
					ev.dataTransfer.setData("text/plain", itag);
					console.log("dragging", itag);
				}
			}
		});
	},
	ttl: function(e) {
		return CT.parse.date2string(new Date(Date.now() + e.ttl * 1000), true);
	},
	item: function(e) {
		return CT.dom.div([
			CT.dom.div(e.group, "right"),
			CT.dom.span(user.mail.ttl(e)),
			CT.dom.pad(),
			CT.dom.span(e.subject, "bold")
		], "bordered padded margined round");
	},
	schedule: function() {
		return CT.dom.button("view schedule", function() {
			CT.net.post({
				spinner: true,
				path: "/_user",
				params: {
					action: "esched"
				},
				cb: function(allez) {
					var schedz = allez.filter(e => !e.complete),
						sentz = allez.filter(e => e.complete);
					CT.modal.modal([
						CT.dom.div("scheduled emails", "big centered"),
						"Scheduled",
						schedz.map(user.mail.item),
						"Sent",
						sentz.map(user.mail.item)
					], null, { className: "basicpopup h9-10" });
				}
			});
		}, "right relative mosthigh");
	},
	loadgal: function(egalist) {
		CT.net.post({
			path: "/_user",
			spinner: true,
			params: {
				action: "egal"
			},
			cb: gals => CT.dom.setContent(egalist, gals.map(user.mail.img))
		});
	},
	gallery: function() {
		var um = user.mail, egalist = CT.dom.div(), cont = [
			CT.dom.button("add image", function() {
				CT.modal.prompt({
					prompt: "please select the image",
					style: "file",
					cb: function(ctfile) {
						ctfile.upload("/_user", function(iurl) {
							CT.dom.addContent(egalist, um.img(iurl));
						}, {
							action: "egal"
						});
					}
				});
			}, "right"),
			egalist
		], loader = () => um.loadgal(egalist);
		if (core.config.ctuser.email.autogal)
			loader();
		else
			cont.unshift(CT.dom.button("load gallery", loader, "right"));
		return CT.dom.div(cont, "abs b0 l0 r0 h1-5 scrolly");
	},
	editor: function(mdata) {
		var _ = user.mail._, subject = CT.dom.smartField({
			classname: "w1",
			value: mdata.subject,
			blurs: ["subject", "title"]
		}), customlist = "a specific email list", basicgroups = [
			"default", customlist
		], body = CT.dom.smartField({
			wyz: true,
			isTA: true,
			value: mdata.body,
			classname: "w1 mt5 hmin200p",
			blurs: ["email body", "write your message here"]
		}), ecfg = core.config.ctuser.email,
			any_recips = ecfg && ecfg.any_recips,
			egroups = ecfg && ecfg.groups || [
		], verb = mdata.key ? (mdata.complete ? "resend" : "change") : "send", cont = [
			CT.dom.div(mdata.key ? "Email Editor" : "Send an Email!", "bigger padded centered"),
			subject, body,
			mdata.key && CT.dom.checkboxAndLabel("paused" + (mdata.key || "email"), mdata.paused, "paused", null, "right", function(cbox) {
				var subaction = cbox.checked ? "pause" : "unpause";
				if (!prompt("really " + subaction + " this email?")) {
					cb.checked = mdata.paused; // reset
					return;
				}
				mdata.paused = cbox.checked;
				CT.net.post({
					spinner: true,
					path: "/_user",
					params: {
						key: mdata.key,
						action: "email",
						subaction: subaction
					},
					cb: () => alert("ok, you " + subaction + "d it")
				});
			}),
			CT.dom.button(verb + " it!", function() {
				var params = {
					action: "email",
					user: user.core._.current.key,
					subject: CT.dom.getFieldValue(subject),
					body: body.fieldValue()
				}, groups = [], _send = function(gparams) {
					CT.net.post({
						spinner: true,
						path: "/_user",
						params: CT.merge(gparams, params),
						cb: function(d) {
							CT.data.add(d);
							if (mdata.key) {
								Object.assign(mdata, d);
								mdata.node.rename(d.label);
								mdata.node.trigger(); // refreshes verbs etc
							} else
								_.list.newAdd(d);
							alert("you did it!");
						}
					});
				}, _sendall = function() {
					groups.length ? groups.forEach(_send) : _send();
				}, sched = function() {
					var val, secs, ds = CT.dom.dateSelectors({
						withtime: true
					}), dmod = CT.modal.modal([
						"ok, when?",
						ds,
						CT.dom.button("do it", function() {
							val = ds.value();
							if (!val) return;
							params.delay = ~~((CT.parse.string2date(val) - Date.now()) / 1000);
							dmod.hide();
							_sendall();
						})
					]);
				}, send = function() {
					CT.modal.choice({
						prompt: "when should we send this email?",
						data: ["now", "later"],
						cb: function(when) {
							if (when == "now")
								return _sendall();
							sched();
						}
					});
				}, procgroups = function(names) {
					groups = names.map(function(n) {
						return basicgroups.includes(n) ? {} : { group: n };
					});
					names.includes(customlist) ? CT.modal.prompt({
						isTA: true,
						prompt: "please enter a comma-separated list of email addresses",
						cb: function(estring) {
							groups[names.indexOf(customlist)] = {
								recipients: estring.split(", ")
							};
							send();
						}
					}) : send();
				};
				if (mdata.key)
					params.key = mdata.key;
				if (!any_recips)
					return send();
				CT.modal.choice({
					prompt: "who should receive this email?",
					style: "multiple-choice",
					data: basicgroups.concat(egroups),
					cb: procgroups
				});
			})
		];
		if (mdata.key) {
			cont.push(CT.dom.pad());
			cont.push(CT.dom.span(mdata.complete ? "completed" : ((mdata.paused && !mdata.ttl) ? "paused" : "sending")));
			if (mdata.ttl) {
				cont.push(CT.dom.pad());
				cont.push(CT.dom.span("on " + user.mail.ttl(mdata)));
			}
		}
		CT.dom.setContent(_.content, CT.dom.div(cont, "padded"));
	},
	init: function() {
		var _ = user.mail._;
		CT.db.get("email", function(mailz) {
			CT.data.addSet(mailz);
			mailz.unshift({
				label: "new email"
			});
			CT.dom.setMain([
				user.mail.schedule(),
				CT.dom.div([
					_.list, _.content
				], "abs t0 r0 l0 h4-5"),
				user.mail.gallery()
			]);
			CT.panel.triggerList(mailz, user.mail.editor, _.list);
			_.list.firstChild.trigger();
		}, null, null, "-created", null, null, null, "mindata");
	}
};