CT.require("CT.all");
CT.require("core");
CT.require("user.core");

CT.onload(function() {
	CT.initCore();
	var cfg = core.config.ctuser;
	if (cfg.results.sections) {
		var results = {}, build = function() {
			if (Object.keys(results).length != cfg.results.sections.length)
				return;
			new CT.slider.Slider({
				frames: cfg.results.sections.map(function(s) {
					return {
						label: s.name,
						frames: results[s.name]
					}
				}),
				mode: "chunk",
				parent: "ctmain",
				subMode: "profile",
				bubblePosition: "top"
			});
		};
		cfg.results.sections.forEach(function(s) {
			user.core.all(function(data) {
				results[s.name] = data;
				build();
			}, null, CT.merge(s.filters, cfg.results.filters));
		});
	} else {
		user.core.all(function(users) {
			new CT.slider.Slider({
				frames: users,
				parent: "ctmain",
				mode: "profile"
			});
		}, null, cfg.results.filters);
	}
});