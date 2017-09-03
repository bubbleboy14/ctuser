CT.require("CT.all");
CT.require("core");
CT.require("user.core");
CT.require("edit.core");

CT.onload(function() {
	CT.initCore();
	var admin = user.core.get("admin"),
		userType = user.core.get("modelName"),
		cfg = core.config.ctuser.results;
	user.core.results((admin && cfg.admin) ||
		(userType && cfg[userType] || cfg.user) ||
		cfg["*"] || cfg);
	edit.core.override();
});