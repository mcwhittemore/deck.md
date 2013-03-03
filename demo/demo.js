var deckmd = require("../lib/deckmd");
var fs = require('fs');

var md_file = "demo.md";

var uc = {
	unique_id: "demo",
	saveJade: true
}

deckmd.renderFile(md_file, uc, function(userConfig, err, html){
	if(err)
		console.log(err);
	else
		fs.writeFile(userConfig.unique_id+".html", html, "utf8");
});