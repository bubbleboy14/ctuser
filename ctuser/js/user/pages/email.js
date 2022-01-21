CT.require("CT.all");
CT.require("CT.rte");
CT.require("core");
CT.require("user.core");

CT.onload(function() {
	CT.initCore();
	user.core.email();
});