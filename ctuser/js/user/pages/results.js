CT.require("CT.all");
CT.require("core");
CT.require("user.core");

CT.onload(function() {
	CT.initCore();
	user.core.all(function(users) {
		new CT.slider.Slider({
			frames: users,
			parent: "ctmain",
			mode: "profile",
			defaultImg: core.config.ctuser.defaults.img
		});
	}, null, core.config.ctuser.results.filters);
});