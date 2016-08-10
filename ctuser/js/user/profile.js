CT.require("CT.all");
CT.require("user.core");

CT.onload(function() {
	var u = user.core.get();
	if (!u)
		location = "/";
	else if (location.hash) { // view profile
		CT.db.one(location.hash.slice(1), function(data) {
			CT.dom.setContent(document.body, CT.layout.profile(data));
		});
	} else { // edit profile

	}
});