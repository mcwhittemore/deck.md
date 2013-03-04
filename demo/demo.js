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
	unique_id: "demo",
	saveJade: true
}

deckmd.renderFile(content, customConfig, function(err, html, config){
	if(err)
		console.log(err);
	else
		fs.writeFile(config.unique_id+".html", html, "utf8");
});