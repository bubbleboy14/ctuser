CT.require("CT.all");
CT.require("core");
CT.require("user.core");

CT.onload(function() {
	CT.initCore();
	user.core.login(core.config.ctuser.login_cb, core.config.ctuser.login_eb);
});