CT.require("CT.all");
CT.require("CT.rte");
CT.require("core");
CT.require("user.core");
CT.require("user.mail");

CT.onload(function() {
	CT.initCore();
	user.mail.init();
});