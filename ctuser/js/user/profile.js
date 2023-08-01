var pcfg = core.config.ctuser.profile;
pcfg.cc && CT.require("CT.cc", true);
if (!pcfg.fopts)
	pcfg.fopts = {};
if (!pcfg.classes)
	pcfg.classes = {};

user.profile = {
	_: {
		nodes: {},
		edit: function(changes) {
			var _ = user.profile._, u = user.core.get();
			CT.net.post("/_user", {
				action: "edit",
				user: u.key,
				changes: changes
			}, "edit failed! :'(", function() {
				user.core.update(changes);
				if ("firstName" in changes)
					CT.dom.setContent(_.nodes.greeting, "Hello, " + u.firstName);
				alert("great!");
			});
		},
		submit: function() {
			var _ = user.profile._, f, v, changes = {},
				fields = _.fields, modopts = _.modopts,
				pwv = CT.dom.getFieldValue("pw"),
				pw2v = CT.dom.getFieldValue("pw2");
			for (f in fields) {
				v = CT.dom.getFieldValue(f);
				if (u[f] != v) {
					if (!v)
						return alert("please complete all required fields");
					if ((f == "email") && !CT.parse.validEmail(v))
						return alert("please provide a valid email");
					changes[f] = v;
				}
			}
			if (modopts && modopts.checkboxes) for (f in modopts.checkboxes) {
				v = modopts.checkboxes[f].node.isChecked();
				if (u[f] != v)
					changes[f] = v;
			}
			if (pwv || pw2v) {
				if (pwv != pw2v)
					return alert("passwords don't match!");
				if (!CT.parse.validPassword(pwv))
					return alert("password must be at least 6 characters long");
				changes.password = pwv;
			}
			_.edit(changes);
		},
		delAcc: function() {
			var u = user.core.get();
			confirm(pcfg.delMem) && CT.net.post({
				spinner: true,
				path: "/_user",
				params: {
					action: "delmem",
					p: prompt("Please enter your password"),
					e: u.email,
					k: u.key
				},
				cb: function() {
					alert("ok, you're deleted!");
					user.core.logout();
				}
			});
		},
		field: function(p) {
			var _ = user.profile._, fields = _.fields;
			fields[p] = CT.dom.smartField(CT.merge({
				id: p,
				cb: _.submit,
				blurs: pcfg.blurs[p],
				value: user.core.get(p),
				classname: pcfg.classes[p]
			}, pcfg.fopts[p]));
			return fields[p];
		}
	},
	view: function(ukey) {
		document.body.classList.add("ctuser-profile-view");
		CT.db.one(ukey, function(data) {
			CT.dom.addContent("ctmain", CT.layout.profile(user.core.prep(data)));
		});
	},
	edit: function() {
		var _ = user.profile._, omit = pcfg.omit,
			base = ["firstName", "lastName", "email"];
		omit.includes("cc") || omit.push("cc"); // handled differently...
		omit.includes("handles") || omit.push("handles");
		CT.db.withSchema(function(fullSchema) {
			var u = user.core.get(), extras = [],
				schema = fullSchema[u.modelName],
				model = core.config.ctuser.model,
				modopts = _.modopts = model[u.modelName] || model["*"],
				blurs = pcfg.blurs, clz = pcfg.classes,
				fields = _.fields = {}, tryIt = _.submit,
				greeting = _.nodes.greeting = CT.dom.div("Hello, " + u.firstName, "biggerest"),
				pw = CT.dom.smartField({ id: "pw", cb: tryIt, type: "password",
					blurs: blurs.password, classname: clz.pw }),
				pw2 = CT.dom.smartField({ id: "pw2", cb: tryIt, type: "password",
					blurs: blurs.password2, classname: clz.pw2 }),
				img = CT.db.edit.media({ data: u, cb: user.core.update,
					parentClass: clz.img || "wm1-3 right" });
			fields.blurb = CT.dom.smartField({ id: "blurb", isTA: true,
				classname: clz.blurb || "w1", blurs: blurs.blurb, value: u.blurb });
			if (modopts) {
				user.core.fields(modopts, extras, true);
				if (modopts.selects)
					for (var s in modopts.selects)
						fields[s] = modopts.selects[s].node;
			}
			for (var p in schema) {
				if ((p in fields) || (omit.indexOf(p) != -1) || (base.indexOf(p) != -1)
					|| (modopts && modopts.checkboxes && (p in modopts.checkboxes)))
					continue;
				var ptype = schema[p], i;
				if (p == "sms")
					i = user.activation.setter(u, _.edit, pcfg.smsbutt, clz.sms);
				else
					i = CT.db.edit.input(p, ptype, u[p], u.modelName, { key: u.key, label: true });
				extras.push(i);
			}
			pcfg.handles && extras.push(CT.dom.div(CT.db.edit.input("handles",
				"list", u.handles, u.modelName, { key: u.key,
				label: true }), "bordered padded margined round"));
			if (pcfg.cc) {
				var ccnode = CT.dom.div();
				extras.push(ccnode);
				new CT.cc.Switcher({ node: ccnode });
			}
			var connodes = [img, base.map(_.field), [pw, pw2]];
			pcfg.blurbtitle && connodes.push(CT.dom.div(pcfg.blurbtitle, clz.blurbtitle));
			connodes.push(fields.blurb);
			connodes.push(extras);
			pcfg.nohi || connodes.unshift(greeting);
			pcfg.delMem && connodes.push(CT.dom.button("Delete Account",
				_.delAcc, clz.delbutt || "right red"));
			connodes.push(CT.dom.button("Update", tryIt, clz.upbutt));
			if (pcfg.custom)
				connodes = connodes.concat(pcfg.custom());
			CT.dom.addContent("ctmain", CT.dom.div(connodes, "padded"));
		});
	},
	init: function() {
		location.hash ? user.profile.view(location.hash.slice(1))
			: user.profile.edit();
	}
};