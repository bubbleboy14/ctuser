user.activation = {
	activate: function() {
		CT.dom.setContent("ctmain", CT.dom.div([
			CT.dom.div("Success", "biggest"),
			"Great! Your account is now active :)"
		], "centered"));
		CT.net.post({
			path: "/_user",
			params: {
				action: "activate",
				key: user.activation._u
			}
		});
	},
	confirm: function() {
		CT.dom.setContent("ctmain", CT.dom.div([
			CT.dom.div("Please Enter Code", "biggest"),
			"We just texted you a code. Please enter it below.",
			CT.parse.numOnly(CT.dom.smartField({
				blurs: ["enter code here", "what's the code?"],
				cb: function(val) {
					if (parseInt(val) == user.activation._code)
						user.activation.activate();
				}
			}), false, true),
			[
				CT.dom.span("Didn't receive a text? Click"),
				CT.dom.pad(),
				CT.dom.link("here", user.activation.sms),
				CT.dom.pad(),
				CT.dom.span("to try again :)")
			]
		], "centered"));
	},
	sms: function() {
		var carrier = CT.dom.select(["at&t", "verizon", "tmobile", "sprint"]),
			num = CT.parse.numOnly(CT.dom.smartField({
				blurs: ["what's your phone number?", "5551234567", "# please"]
			}), false, true);
		CT.dom.setContent("ctmain", CT.dom.div([
			CT.dom.div("SMS Confirmation", "biggest"),
			"We'll text you a code!",
			CT.dom.div([
				"Phone Number?",
				num
			], "bordered padded margined round"),
			CT.dom.div([
				"Carrier?",
				carrier
			], "bordered padded margined round"),
			CT.dom.button("submit", function() {
				if (num.value.length != 10)
					return alert("please use a 10-digit phone number");
				user.activation._code = CT.data.random(10000);
				CT.net.post({
					path: "/_user",
					params: {
						action: "sms",
						number: num.value,
						carrier: carrier.value,
						code: user.activation._code
					},
					cb: user.activation.confirm
				});
			})
		], "centered"));
	},
	init: function() {
		user.activation._u = location.hash.slice(1);
		location.hash = "";
		if (!user.activation._u)
			location = core.config.ctuser.redir || "/";
		var rnode = CT.dom.div(null, "centered");
		CT.recaptcha.build(core.config.ctuser.recaptcha, rnode);
		CT.dom.setContent("ctmain", CT.dom.div([
			CT.dom.div("are you a real person?", "biggest"),
			rnode, CT.dom.button("submit", function() {
				CT.recaptcha.submit(user.activation.sms, null, "/_user", {
					action: "recaptcha"
				});
			})
		], "centered"));
	}
};