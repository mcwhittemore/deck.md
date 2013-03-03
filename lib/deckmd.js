var jade = require('jade');
var fs = require('fs');
var data_uri = require("data-uri");

var config = undefined;


var addTab = function(txt){
	txt = txt.replace(/\n/g, "\n"+config.tab);
	return config.tab+txt;
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
	var sections = md.split(config.sections[0]);
	for(var i=0; i<sections.length; i++){
		sections[i] = addBack(sections[i], config.sections[0], "\n");
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
				s1[j] = addBack(s1[j], config.sections[1], "\n");
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
	out+=config.tab+"h1 "+title+"\n";

	if(subtitle!=""&&subtitle!="\n"&&subtitle!="\r"){
		
		subtitle = subtitle.replace("\n", "");
		subtitle = subtitle.replace(/\r/gm, "");

		out+=config.tab+config.tab+".subtitle\n";

		out+=config.tab+config.tab+config.tab+":markdown\n";

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
	out+=config.tab+":markdown\n";
	out+=addTab(addTab(md))+"\n";

	return out;
}


var replaceFilesWithDataURIs = function(results, html, paths, callback){

	var urls = Object.keys(results);

	for(var i=0; i<urls.length; i++){
		var url = urls[i];
		var result = results[url];
		if(result.status=="SUCCESS"){
			var uri = result.dataUri;
			var dataItems = paths[url];
			for(var j=0; j<dataItems.length; j++){
				var dataItem = dataItems[j];
				var newDataItem = paths[url][dataItem].add.start+uri+paths[url][dataItem].add.end;
				for(var k=0; k<paths[url][dataItem].count; k++){
					html = html.replace(dataItem, newDataItem);
				}
			}
		}
	}

	callback(config, undefined, html);
}

var findExternalFiles = function(html, callback){

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

		var dataUriResults = function(results){
			replaceFilesWithDataURIs(results, html, paths, callback);
		}

		data_uri.encode(urls,dataUriResults);

	}
	else{
		callback(config, undefined, html);
	}
}



exports.renderFile = function(files, userConfig, callback){

	if(typeof files == "string"){
		files = {
			File_0: {
				path: files
			}
		}
	}
	else if(Object.prototype.toString.call( files ) === '[object Array]'){
		var tmp = {};
		for(var i=0; i<files.length; i++){
			var file = files[i];
			if(typeof file == "object"){
				tmp["File_"+i] = file;
			}
			else{
				tmp["File_"+i] = {
					path: file
				}
			}
		}
		files = tmp;
	}

	var fileNames = Object.keys(files);

	for(var i=0; i<fileNames.length; i++){
		var file = files[fileNames[i]];
		file.md = fs.readFileSync(file.path, 'ascii');
		files[fileNames[i]] = file;
	}

	exports.render(files, userConfig, callback);

}

exports.render = function(files, userConfig, callback){

	/*
		{
			FILE_ID: {
				path: "FILEPATH",
				md_content: "# MARKDOWN CONTENT",
				attributions:[
					{
						author: "MATTHEW WHITTEMORE",
						link: "http://www.willrobotsdream.com"
					},
					{
						author: "CAITLIN WHITTEMORE"
					}
				]
			}
		}
	*/

	config = require("./baseConfig");

	if(typeof userConfig == "function"){ 
		callback = userConfig; 
		userConfig={}; 
	}

	if(typeof files == "string"){
		files = {
			File_0: {
				md: files,
				attributions: config.attributions
			}
		}
	}
	else if(Object.prototype.toString.call( files ) === '[object Array]'){
		var tmp = {};
		for(var i=0; i<files.length; i++){
			var file = files[i];
			if(typeof file == "object"){
				tmp["File_"+i] = file;
			}
			else{
				tmp["File_"+i] = {
					md: file,
					attributions: config.attributions
				}
			}
		}
		files = tmp;
	}

	var md = "";

	var fileNames = Object.keys(files);



	for(var i=0; i<fileNames.length; i++){

		if(md!=""){
			md+="\n";
		}

		md += files[fileNames[i]].md;

	}

	var ucKeys = Object.keys(userConfig);
	for(var i=0; i<ucKeys.length; i++){
		var ucKey = ucKeys[i];
		config[ucKey] = userConfig[ucKey];
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

	jd = jd.replace(/\t/gm, config.tab);

	if(config.saveJade===true){
		fs.writeFile(config.unique_id+".jade", jd, "utf8");
	}

	var jadeback = function(err, html){
		if(err){
			console.log(err);
			callback(config, err, html);
		}
		else{
			findExternalFiles(html, callback);
		}
	}

	loadFiles(config.css, "css");
	loadFiles(config.coreCSS, "coreCSS");

	loadFiles(config.js, "js");
	loadFiles(config.modernizrJS, "modernizrJS");
	loadFiles(config.jqueryJS, "jqueryJS");
	loadFiles(config.coreJS, "coreJS");

	jade.render(jd, {filename: __dirname+"/layout.jade", locals: config}, jadeback);

}