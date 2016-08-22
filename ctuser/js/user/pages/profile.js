CT.require("CT.all");
CT.require("core");
CT.require("user.core");

CT.onload(function() {
	CT.initCore();
	var u = user.core.get();
	if (!u)
		location = "/";
	else if (location.hash) { // view profile
		CT.db.one(location.hash.slice(1), function(data) {
			CT.dom.addContent("ctmain", CT.layout.profile(user.core.prep(data)));
		});
	} else { // edit profile

	}
});