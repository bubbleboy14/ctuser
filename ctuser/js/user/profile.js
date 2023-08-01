var pcfg = core.config.ctuser.profile;
pcfg.cc && CT.require("CT.cc", true);

user.profile = {
	_: {
		nodes: {},
		base: ["firstName", "lastName", "email"],
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
		del: function() {
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
		},
		input: function(p) {
			var _ = user.profile._, u = user.core.get();
			return CT.db.edit.input(p, _.schema[p], u[p],
				u.modelName, { key: u.key, label: true });
		},
		handles: function() {
			var _ = user.profile._, cont = CT.dom.div(), wrapper = CT.dom.div([

				CT.dom.button("reorder", function() {

				}, "right"),
				cont
			], "bordered padded margined round");
			wrapper.update = () => CT.dom.setContent(cont, _.input("handles"));
			wrapper.update();
			return wrapper;
		},
		extras: function() {
			var _ = user.profile._, u = user.core.get(), extras = [],
				modopts = _.modopts, fields = _.fields;
			if (modopts) {
				user.core.fields(modopts, extras, true);
				if (modopts.selects)
					for (var s in modopts.selects)
						fields[s] = modopts.selects[s].node;
			}
			for (var p in _.schema) {
				if ((p in fields) || (pcfg.omit.indexOf(p) != -1) || (_.base.indexOf(p) != -1)
					|| (modopts && modopts.checkboxes && (p in modopts.checkboxes)))
					continue;
				extras.push((p == "sms") ? user.activation.setter(u,
					_.edit, pcfg.smsbutt, pcfg.classes.sms) : _.input(p));
			}
			pcfg.handles && extras.push(_.handles());
			if (pcfg.cc) {
				var ccnode = CT.dom.div();
				extras.push(ccnode);
				new CT.cc.Switcher({ node: ccnode });
			}
			return extras;
		},
		form: function(fullSchema) {
			var _ = user.profile._, u = user.core.get();
				schema = _.schema = fullSchema[u.modelName],
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
			var connodes = [img, _.base.map(_.field), [pw, pw2]];
			pcfg.blurbtitle && connodes.push(CT.dom.div(pcfg.blurbtitle, clz.blurbtitle));
			connodes.push(fields.blurb);
			connodes.push(_.extras());
			pcfg.nohi || connodes.unshift(greeting);
			pcfg.delMem && connodes.push(CT.dom.button("Delete Account",
				_.del, clz.delbutt || "right red"));
			connodes.push(CT.dom.button("Update", tryIt, clz.upbutt));
			if (pcfg.custom)
				connodes = connodes.concat(pcfg.custom());
			return CT.dom.div(connodes, "padded");
		},
		ipcfg: function() {
			var omit = pcfg.omit;
			omit.includes("cc") || omit.push("cc"); // handled differently...
			omit.includes("handles") || omit.push("handles");
			if (!pcfg.fopts)
				pcfg.fopts = {};
			if (!pcfg.classes)
				pcfg.classes = {};
		}
	},
	view: function(ukey) {
		document.body.classList.add("ctuser-profile-view");
		CT.db.one(ukey, data => CT.dom.addMain(CT.layout.profile(user.core.prep(data))));
	},
	edit: function() {
		var _ = user.profile._;
		_.ipcfg();
		CT.db.withSchema(fullSchema => CT.dom.addMain(_.form(fullSchema)));
	},
	init: function() {
		location.hash ? user.profile.view(location.hash.slice(1))
			: user.profile.edit();
	}
};