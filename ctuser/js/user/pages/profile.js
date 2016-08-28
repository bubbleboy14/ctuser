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

	}
});