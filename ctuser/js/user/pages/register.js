CT.require("CT.all");
CT.require("core");
CT.require("user.core");

CT.onload(function() {
	CT.initCore();
	var cfg = core.config.ctuser.register, _join = function() {
		user.core.join(cfg.model && cfg.model != "ctuser"
			&& { utype: cfg.model }, cfg.redirect);
	};
	if (cfg.password) {
		(new CT.modal.Prompt({
			noClose: true,
			style: "password",
			transition: "slide",
			cb: function(pw) {
				if (pw != cfg.password)
					window.location = "/";
				_join();
			}
		})).show();
	} else
		_join();
});