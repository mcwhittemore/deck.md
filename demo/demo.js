var deckmd = require("../lib/deckmd");
var fs = require('fs');

//var content = ["demo.md", "demo.md"];
//var content = "demo.md";

var content = {
	demo1: {
		path: "demo.md"
	}
}

var customConfig = {
	destination: {
		allStub: "demo"
	},
	saveJade: true
}

deckmd.renderFile(content, customConfig, function(err, html, config){
	if(err)
		console.log(err);
	else
		fs.writeFile(config.destination.html, html, "utf8");
});