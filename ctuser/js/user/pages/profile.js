CT.require("CT.all");
CT.require("core");
CT.require("user.core");
CT.require("user.activation");
CT.require("user.profile");
CT.require("edit.core");

CT.onload(function() {
	CT.initCore();
	user.profile.init();
	edit.core.override();
});