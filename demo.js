var deckmd = require("./lib/deckmd");
var fs = require('fs');

var md_file = "fd.md";

var uc = {
	unique_id: "fd",
	saveJade: true
}

deckmd.renderFile(md_file, uc, function(userConfig, err, html){
	fs.writeFile(userConfig.unique_id+".html", html, "utf8");
});