CT.require("CT.all");
CT.require("core");
CT.require("user.core");

CT.onload(function() {
	CT.initCore();
	if (location.hash) { // view profile
		CT.db.one(location.hash.slice(1), function(data) {
			CT.dom.addContent("ctmain", CT.layout.profile(user.core.prep(data)));
		});
	} else { // edit profile
		var omit = ["_label", "active", "admin", "created", "index", "key", "label", "modelName", "modified"],
			base = ["firstName", "lastName", "email"];
		CT.db.withSchema(function(fullSchema) {
			var u = user.core.get(),
				schema = fullSchema[u.modelName],
				blurs = core.config.ctuser.profile.blurs,
				fields = {}, tryIt = function() {
					var f, v, changes = {};
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
					var pwv = CT.dom.getFieldValue("pw"),
						pw2v = CT.dom.getFieldValue("pw2");
					if (pwv || pw2v) {
						if (pwv != pw2v)
							return alert("passwords don't match!");
						if (!CT.parse.validPassword(pwv))
							return alert("password must be at least 6 characters long");
						changes.password = pwv;
					}
					CT.net.post("/_user", { action: "edit", user: u.key, changes: changes },
						"edit failed! :'(", function() {
							user.core.update(changes);
							if ("firstName" in changes)
								CT.dom.setContent(greeting, "Hello, " + u.firstName);
							alert("great!");
						});
				}, greeting = CT.dom.node("Hello, " + u.firstName, "div", "biggerest"),
				pw = CT.dom.smartField({ id: "pw", cb: tryIt, type: "password", blurs: blurs.password }),
				pw2 = CT.dom.smartField({ id: "pw2", cb: tryIt, type: "password", blurs: blurs.password2 }),
				img = CT.db.edit.img({ data: u, cb: user.core.update });
			fields.blurb = CT.dom.smartField({ id: "blurb", isTA: true, classname: "w1", blurs: blurs.blurb });
			CT.dom.addContent("ctmain", CT.dom.node([
				greeting, base.map(function(p) {
					fields[p] = CT.dom.smartField({ id: p, cb: tryIt, blurs: blurs[p], value: u[p] });
					return fields[p];
				}), [pw, pw2], img, fields.blurb, CT.dom.button("Update", tryIt)
			], "div", "padded"));
		});
	}
});