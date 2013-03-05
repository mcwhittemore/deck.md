var config = undefined;
var utils = require("./utils");

module.exports.init = function(c){
	config = c;
	utils.init(config);
}

module.exports.getSections = function(md){
	var sections = md.split(config.sections[0]);
	for(var i=0; i<sections.length; i++){
		sections[i] = utils.addBack(sections[i], config.sections[0], "\n");
	}
	return sections;
}

module.exports.getSlides = function(md){

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
module.exports.h1 = function(md){
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
module.exports.h2 = function(md){
	var title = utils.getFirstLine(md);

	var out = "section.slide\n";
	out+=config.tab+":markdown\n";
	out+=utils.addTab(utils.addTab(md))+"\n";

	return out;
}
