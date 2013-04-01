var jade = require('jade');
var fs = require('fs');
var data_uri = require("data-uri");

var config = undefined;

var utils = require("./utils");
var mdToJade = require("./mdToJade");


exports.renderFile = function(files, userConfig, callback){

	/************************************************************
	*********************** FIX FILE OBJ ************************
	************************************************************/

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

	/************************************************************
	*********************** END FILE OBJ ************************
	*************************************************************/

	/************************************************************
	********************** START OPEN MD ************************
	************************************************************/

	var fileNames = Object.keys(files);

	for(var i=0; i<fileNames.length; i++){
		var file = files[fileNames[i]];
		file.md = fs.readFileSync(file.path, 'ascii');
		files[fileNames[i]] = file;
	}

	/************************************************************
	************************ END OPEN MD ************************
	************************************************************/

	/************************************************************
	********************** PUSH TO RENDER ***********************
	************************************************************/

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

	if(config.destination.jade==undefined || config.destination.html == undefined){
		if(config.destination.allStub==undefined){
			destination.destination.allStub = "md_to_deckjs";
		}

		if(config.destination.jade==undefined){
			config.destination.jade= config.destination.allStub+".jade";
		}

		if(config.destination.html==undefined){
			config.destination.html = config.destination.allStub+".html";
		}
	}

	utils.init(config);
	mdToJade.init(config);

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
	var dirty = true;
	while(dirty){
		var oldMd = md;
		md = md.replace(/^\n/, "");
		md = md.replace(/^\r/, "");
		if(md==oldMd){
			dirty = false;
		}
	}
	md = "\n"+md;

	//make sure file ends in \r\n (MAKE SURE WE GET ALL OF THESE)
	dirty = true;
	while(dirty){
		var oldMd = md;
		md = md.replace(/\r\n$/, "");
		if(md==oldMd){
			dirty = false;
		}
	}
	
	md = md+"\r\n";

	/************************************************************
	************************* END MD CONCAT *********************
	************************************************************/

	/*
	**	1. Gather Attributes for all files into one object.
	**	2. Render into a Markdown
	**	3. Append to md
	*/

	/************************************************************
	*********************** START MD TO JADE ********************
	************************************************************/

	var jd = "";

	//break md into sections
	var sections = mdToJade.getSections(md);

	//title
	var title = undefined;

	//break sections into slides
	for(var i=0; i<sections.length; i++){
		if(sections[i]!="# "){
			var slides = mdToJade.getSlides(sections[i]);

			if(title == undefined){
				title = utils.getFirstLine(slides[0]);
				title = title.replace(/^# /, "");
			}

			var th1 = mdToJade.h1(slides[0]);

			jd+=th1;

			for(var j=1; j<slides.length; j++){
				var th2 = mdToJade.h2(slides[j]);
				jd+=th2;
			}
		}
	}

	config.title = title;

	//add jade headers and add indentation
	jd = "extends layout\n\nblock slides\n"+utils.addTab(jd);

	//set all \t to use the config.tab string
	jd = jd.replace(/\t/gm, config.tab);

	//save jade if config asks us to
	if(config.saveJade===true){
		fs.writeFile(config.destination.jade, jd, "utf8");
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
		else if(config.singleFile!==false){
			convertToSingleFile(html, callback);
		}
		else{
			callback(err, html, config);
		}
	}

	jade.render(jd, {filename: __dirname+"/layout.jade", locals: config}, jadeback);

	/************************************************************
	********************** END JADE TO HTML *********************
	************************************************************/

}

var convertToSingleFile = function(html, callback){

	/************************************************************
	********************* START HTML TO APP *********************
	************************************************************/

	var paths = utils.getExternalFilePathsObj(html);

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

	/************************************************************
	********************** END HTML TO APP **********************
	************************************************************/
}

var replaceFilesWithDataURIs = function(results, html, paths, callback){

	/************************************************************
	************** START REPLACE REF WITH DATA URI **************
	************************************************************/

	var urls = Object.keys(results);

	for(var i=0; i<urls.length; i++){
		var url = urls[i];
		var result = results[url];
		if(result.status=="SUCCESS"){
			var uri = result.dataUri;
			var dataItems = Object.keys(paths[url]);
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

	/************************************************************
	*************** END REPLACE REF WITH DATA URI ***************
	************************************************************/
}