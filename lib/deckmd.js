var jade = require('jade');
var fs = require('fs');
var data_uri = require("data-uri");

var config = undefined;

var utils = require("./utils");

var getSections = function(md){
	var sections = md.split(config.sections[0]);
	for(var i=0; i<sections.length; i++){
		sections[i] = utils.addBack(sections[i], config.sections[0], "\n");
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
				s1[j] = utils.addBack(s1[j], config.sections[1], "\n");
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
	var title = utils.getFirstLine(md);
	var subtitle = md.replace(title+"\n", "");
	title = title.replace("# ", "");

	var out = "section.slide\n";
	out+=config.tab+"h1 "+title+"\n";

	if(subtitle!=""&&subtitle!="\n"&&subtitle!="\r"){
		
		subtitle = subtitle.replace("\n", "");
		subtitle = subtitle.replace(/\r/gm, "");

		out+=config.tab+config.tab+".subtitle\n";

		out+=config.tab+config.tab+config.tab+":markdown\n";

		out+=utils.addTab(utils.addTab(utils.addTab(utils.addTab(subtitle))))+"\n";
	}
	else{
		out+="\n";
	}
	
	return out;

}

//TURNS THE MARKDOWN FOR H2 SLIDES INTO JADE
var h2 = function(md){
	var title = utils.getFirstLine(md);

	var out = "section.slide\n";
	out+=config.tab+":markdown\n";
	out+=utils.addTab(utils.addTab(md))+"\n";

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

	callback(undefined, html, config);
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
		callback(undefined, html, config);
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

	/************************************************************
	************************ START CONFIG ***********************
	************************************************************/

	config = require("./baseConfig");

	if(typeof userConfig == "function"){ 
		callback = userConfig; 
		userConfig={}; 
	}

	var ucKeys = Object.keys(userConfig);
	for(var i=0; i<ucKeys.length; i++){
		var ucKey = ucKeys[i];
		config[ucKey] = userConfig[ucKey];
	}

	utils.init(config);

	/************************************************************
	************************ END CONFIG *************************
	*************************************************************



	/************************************************************
	*********************** FIX FILE OBJ ************************
	*************************************************************
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
	*************************************************************
	*************************************************************/

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

	/************************************************************
	************************* END FILE OBJ **********************
	************************************************************/

	/************************************************************
	************************ START MD CONCAT ********************
	************************************************************/

	var md = "";

	var fileNames = Object.keys(files);

	for(var i=0; i<fileNames.length; i++){

		if(md!=""){
			md+="\n";
		}

		md += files[fileNames[i]].md;

	}

	if(typeof callback=="undefined"){ 
		callback = function(err, html, configsUsed){
			console.log(html);
		};
	}

	//add newline to start of file so getSections will grab the first line too
	md = "\n"+md;

	/************************************************************
	************************* END MD CONCAT *********************
	************************************************************/

	/************************************************************
	*********************** START MD TO JADE ********************
	************************************************************/

	var jd = "";

	//break md into sections
	var sections = getSections(md);

	//break sections into slides
	for(var i=0; i<sections.length; i++){
		if(sections[i]!="# "){
			var slides = getSlides(sections[i]);

			if(config.title == undefined){
				config.title = utils.getFirstLine(slides[0]);
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

	//add jade headers and add indentation
	jd = "extends layout\n\nblock slides\n"+utils.addTab(jd);

	//set all \t to use the config.tab string
	jd = jd.replace(/\t/gm, config.tab);

	//save jade if config asks us to
	if(config.saveJade===true){
		fs.writeFile(config.unique_id+".jade", jd, "utf8");
	}

	/************************************************************
	*********************** END MD TO JADE **********************
	************************************************************/

	/************************************************************
	*************** START CSS AND JS REFS TO TXT ****************
	************************************************************/

	config.cssFiles = utils.loadFiles(config.css);
	config.coreCSSFiles = utils.loadFiles(config.coreCSS);

	config.jsFiles = utils.loadFiles(config.js);
	config.modernizrJSFiles = utils.loadFiles(config.modernizrJS);
	config.jqueryJSFiles = utils.loadFiles(config.jqueryJS);
	config.coreJSFiles = utils.loadFiles(config.coreJS);

	/************************************************************
	***************** END CSS AND JS REFS TO TXT ****************
	************************************************************/

	/************************************************************
	********************* START JADE TO HTML ********************
	************************************************************/

	var jadeback = function(err, html){
		if(err){
			console.log(err);
			callback(err, html, config);
		}
		else{
			findExternalFiles(html, callback);
		}
	}

	jade.render(jd, {filename: __dirname+"/layout.jade", locals: config}, jadeback);

	/************************************************************
	********************** END JADE TO HTML *********************
	************************************************************/

}