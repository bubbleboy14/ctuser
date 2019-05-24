CT.require("CT.all");
CT.require("core");
CT.require("user.core");
CT.require("user.activation");

CT.onload(function() {
	CT.initCore();
	user.activation.init();
});