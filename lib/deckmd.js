var jade = require('jade');
var fs = require('fs');
var request = require('request');
var mime = require("mime");

var config = {
	title: undefined,
	js: [
		"deck.js/extensions/hash/deck.hash.js",
		"deck.js/extensions/menu/deck.menu.js",
		"deck.js/extensions/goto/deck.goto.js",
	    "deck.js/extensions/status/deck.status.js",
	    "deck.js/extensions/navigation/deck.navigation.js",
	    "deck.js/extensions/scale/deck.scale.js"
	],
	coreJS: [
    	"deck.js/core/deck.core.js"
	],
	jqueryJS:[
		"deck.js/jquery-1.7.2.min.js"
	],
	modernizrJS: [
		"deck.js/modernizr.custom.js"
	],
	css: [
	    "deckmd.css",
	    "deck.js/extensions/goto/deck.goto.css",
	    "deck.js/extensions/menu/deck.menu.css",
	    "deck.js/extensions/navigation/deck.navigation.css",
	    "deck.js/extensions/status/deck.status.css",
	    "deck.js/extensions/hash/deck.hash.css",
	    "deck.js/extensions/scale/deck.scale.css",
	    "deck.js/themes/transition/horizontal-slide.css"
	],
	coreCSS:[
		"deck.js/core/deck.core.css"
	]
};

var tab = "  ";
var section = "\n# ";
var slide = "\n## ";

var addTab = function(txt){
	txt = txt.replace(/\n/g, "\n"+tab);
	return tab+txt;
}

var addBack = function(txt, add, remove){
	remove = remove || "";
	add = add.replace(remove, "");
	return add+txt;
}

var getFirstLine = function(md){
	var index = md.indexOf("\n");
	var out = md.substring(0, index);
	return out.replace(/\n/gm, "");
}

var loadFiles = function(files, type){
	var configPath = type+"Files";
	config[configPath] = {};

	for(var i=0; i<files.length; i++){
		var file = files[i];
		var content = fs.readFileSync(file, 'ascii');
		config[configPath][file] = content;
	}
}

var getSections = function(md){
	var sections = md.split(section);
	for(var i=0; i<sections.length; i++){
		sections[i] = addBack(sections[i], section, "\n");
	}
	return sections;
}

var getSlides = function(md){

	var slides = [];

	var s1 = md.split("\n## ");
	
	var title_added = false;
	for(var j=0; j<s1.length; j++){
		if(s1[j]!=""){
			if(title_added){
				s1[j] = addBack(s1[j], slide, "\n");
			}
			else{
				title_added = true;
			}

			slides[slides.length] = s1[j];
		}
	}

	return slides;
}

//TURNS THE MARKDOWN FOR H1 SLIDES INTO JADE
var h1 = function(md){
	var title = getFirstLine(md);
	var subtitle = md.replace(title+"\n", "");
	title = title.replace("# ", "");

	var out = "section.slide\n";
	out+=tab+"h1 "+title+"\n";

	if(subtitle!=""&&subtitle!="\n"&&subtitle!="\r"){
		
		subtitle = subtitle.replace("\n", "");
		subtitle = subtitle.replace(/\r/gm, "");

		out+=tab+tab+".subtitle\n";

		out+=tab+tab+tab+":markdown\n";

		out+=addTab(addTab(addTab(addTab(subtitle))))+"\n";
	}
	else{
		out+="\n";
	}
	
	return out;

}

//TURNS THE MARKDOWN FOR H2 SLIDES INTO JADE
var h2 = function(md){
	var title = getFirstLine(md);

	var out = "section.slide\n";
	out+=tab+":markdown\n";
	out+=addTab(addTab(md))+"\n";

	return out;
}

var convertFiles = function(userConfig, html, paths, urls, index, includeLocals, callback){
	var url = urls[index];

	var result = function(err, res, body){
		
		if(!err && res.statusCode==200){

			var data = new Buffer(body).toString('base64');
			var uri = "data:"+res.headers["content-type"]+";base64,"+data;
			var dataItems = Object.keys(paths[url]);

			for(var i=0; i<dataItems.length; i++){
				var dataItem = dataItems[i];
				var newDataItem = paths[url][dataItem].add.start+uri+paths[url][dataItem].add.end;
				for(var j=0; j<paths[url][dataItem].count; j++){
					html = html.replace(dataItem, newDataItem);
				}
			}

		}
		else if(!err){
			console.log(res.statusCode);
		}

		if(index<urls.length-1){
			convertFiles(userConfig, html, paths, urls, index+1, includeLocals, callback);
		}
		else{
			callback(userConfig, undefined, html);
		}
	}

	if(url.search(/http[s]*:\/\//g)>-1){
		request(url, result);
		//result(true, 401, "");
	}
	else if(includeLocals){
		fs.readFile(url, function(err, data){
			var res = {
				statusCode:200,
				headers:{
					"content-type": mime.lookup(url)
				}
			};
			result(err, res, data);
		});
	}
	else{
		result(true, 401, "");
	}
}

var findExternalFiles = function(userConfig, html, callback){

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

	var urls = Object.keys(paths);

	if(urls.length>0){
		convertFiles(userConfig, html, paths, urls, 0, true, callback);
	}
	else{
		callback(userConfig, undefined, html);
	}
}



exports.renderFile = function(path, userConfig, callback){

	if(typeof userConfig == "function"){ 
		callback = userConfig; 
		userConfig={}; 
	}

	if(typeof callback=="undefined"){ 
		callback = function(data){
			console.log(data);
		};
	}

	var md = fs.readFileSync(path, 'ascii');

	exports.render(md, userConfig, callback);

}

exports.renderFileTest = function(path, userConfig, callback){

	if(typeof userConfig == "function"){ 
		callback = userConfig; 
		userConfig={}; 
	}

	if(typeof callback=="undefined"){ 
		callback = function(data){
			console.log(data);
		};
	}

	var md = fs.readFileSync(path, 'ascii');

	var mds = md.split(/\n/);

	for(var i=1; i<=mds.length; i++){

		var parts = mds.slice(0,i);

		var str = parts.join("\n");

		userConfig.unique_id = i+"-"+Date.now()+"-"+Math.random();

		fs.writeFile(userConfig.unique_id+".md", str, "ascii");

		exports.render(str, userConfig, callback);
	}

}

exports.render = function(md, userConfig, callback){
	if(typeof userConfig == "function"){ 
		callback = userConfig; 
		userConfig={}; 
	}

	if(typeof callback=="undefined"){ 
		callback = function(data){
			console.log(data);
		};
	}

	//add newline to start of file so getSections will grab the first line too
	md = "\n"+md;

	//break file into sections
	var sections = getSections(md);

	var jd = "";

	for(var i=0; i<sections.length; i++){
		if(sections[i]!="# "){
			var slides = getSlides(sections[i]);

			if(config.title == undefined){
				config.title = getFirstLine(slides[0]);
				config.title = config.title.replace(/^# /, "");
			}

			var th1 = h1(slides[0]);

			jd+=th1;

			for(var j=1; j<slides.length; j++){
				var th2 = h2(slides[j]);
				jd+=th2;
			}
		}
	}

	jd = "extends layout\n\nblock slides\n"+addTab(jd);

	jd = jd.replace(/\t/gm, tab);

	fs.writeFile(userConfig.unique_id+".jade", jd, "utf8");

	var jadeback = function(err, html){
		if(err){
			console.log(err);
			callback(userConfig, err, html);
		}
		else{
			findExternalFiles(userConfig, html, callback);
		}
	}

	loadFiles(config.css, "css");
	loadFiles(config.coreCSS, "coreCSS");

	loadFiles(config.js, "js");
	loadFiles(config.modernizrJS, "modernizrJS");
	loadFiles(config.jqueryJS, "jqueryJS");
	loadFiles(config.coreJS, "coreJS");

	jade.render(jd, {filename: "layout.jade", locals: config}, jadeback);

}

var md_file = "test.md";

var uc = {
	unique_id: "test"//Date.now()+"-"+Math.random()
}

exports.renderFile(md_file, uc, function(userConfig, err, html){
	fs.writeFile(userConfig.unique_id+".html", html, "utf8");
});