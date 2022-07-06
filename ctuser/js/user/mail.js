user.mail = {
	_: {
		content: CT.dom.div(null, "ctcontent"),
		list: CT.dom.div(null, "ctlist")
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
	gallery: function() {
		var egal = CT.dom.div(null, "abs bottomhalf");
		CT.net.post({
			path: "/_user",
			params: {
				action: "egal"
			},
			cb: function(gals) {
				var egalist = CT.dom.div(gals.map(user.mail.img));
				CT.dom.setContent(egal, [
					CT.dom.button("add image", function() {
						CT.modal.prompt({
							prompt: "please select the image",
							style: "file",
							cb: function(ctfile) {
								ctfile.upload("/_user", function(iurl) {
									CT.dom.addContent(egalist, user.mail.img(iurl));
								}, {
									action: "egal"
								});
							}
						});
					}, "right"),
					egalist
				]);
			}
		});
		return egal;
	},
	editor: function(mdata) {
		var _ = user.mail._, subject = CT.dom.smartField({
			classname: "w1",
			value: mdata.subject,
			blurs: ["subject", "title"]
		}), body = CT.dom.smartField({
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
			CT.dom.button(verb + " it!", function() {
				var params = {
					action: "email",
					user: user.core._.current.key,
					subject: CT.dom.getFieldValue(subject),
					body: body.fieldValue()
				}, _send = function() {
					CT.net.post({
						spinner: true,
						path: "/_user",
						params: params,
						cb: function(d) {
							CT.data.add(d);
							if (mdata.key) {
								mdata.assign(d);
								mdata.node.rename(d.label);
								mdata.node.trigger(); // refreshes verbs etc
							} else
								_.tlist.newAdd(d);
							alert("you did it!");
						}
					});
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
							_send();
						})
					]);
				}, send = function() {
					CT.modal.choice({
						prompt: "when should we send this email?",
						data: ["now", "later"],
						cb: function(when) {
							if (when == "now")
								return _send();
							sched();
						}
					})
				};
				if (mdata.key)
					params.key = mdata.key;
				if (!any_recips)
					return send();
				CT.modal.choice({
					prompt: "who should receive this email?",
					data: [
						"default",
						"a specific email list"
					].concat(egroups),
					cb: function(resp) {
						if (resp == "default")
							return send();
						else if (resp == "a specific email list") {
							CT.modal.prompt({
								isTA: true,
								prompt: "please enter a comma-separated list of email addresses",
								cb: function(estring) {
									params.recipients = estring.split(", ");
									send();
								}
							});
						} else {
							params.group = resp;
							send();
						}
					}
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
				], "abs tophalf"),
				user.mail.gallery()
			]);
			CT.panel.triggerList(mailz, user.mail.editor, _.list);
			_.list.firstChild.trigger();
		}, null, null, "-created", null, null, null, "mindata");
	}
};