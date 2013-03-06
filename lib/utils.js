var fs = require("fs");
var config = undefined;

module.exports.init = function(c){
	config = c;
}


module.exports.addTab = function(txt){
	txt = txt.replace(/\n/g, "\n"+config.tab);
	return config.tab+txt;
}

module.exports.addBack = function(txt, add, remove){
	remove = remove || "";
	add = add.replace(remove, "");
	return add+txt;
}

module.exports.getFirstLine = function(md){
	var index = md.indexOf("\n");
	var out = md.substring(0, index);
	return out.replace(/\n/gm, "");
}

module.exports.loadFiles = function(files){
	var result = {};

	for(var i=0; i<files.length; i++){
		var file = files[i];
		var content = fs.readFileSync(file, 'ascii');
		result[file] = content;
	}

	return result;
}

module.exports.getExternalFilePathsObj = function(html){
	var finds = {
		css: {
			find: /url[ ]*\([ ]*"[\w\/_.]*"[ ]*\)/g,
			start: /^url[ ]*\([ ]*"/g,
			end: /"[ ]*\)$/g,
			add: {
				start: 'url("',
				end: '")'
			}
		},
		img: {
			find: /src[ ]*=[ ]*"[:\w\/.\-\%]*"/g,
			start: /^src[ ]*=[ ]*"/g,
			end: /"$/g,
			add: {
				start: 'src="',
				end: '"'
			}
		}
	}

	var paths = {};

	var dataKeys = Object.keys(finds);
	for(var i=0; i<dataKeys.length; i++){
		var key = dataKeys[i];
		var dataItems = html.match(finds[key].find);
		if(dataItems){
			for(var j=0; j<dataItems.length; j++){
				var dataItem = dataItems[j];
				var url = dataItem.replace(finds[key].start, "");
				url = url.replace(finds[key].end, "");

				if(typeof paths[url] == "undefined"){
					paths[url] = {};
				}

				if(typeof paths[url][dataItem]=="undefined"){
					paths[url][dataItem] = {
						add: finds[key].add,
						count: 0
					}
				}

				paths[url][dataItem].count++;
			}
		}
	}

	return paths;
}