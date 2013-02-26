var jade = require("jade");
var fs = require('fs');


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

var getSections = function(txt){
	var sections = txt.split(section);
	for(var i=0; i<sections.length; i++){
		sections[i] = addBack(sections[i], section, "\n");
	}
	return sections;
}

var getSlides = function(txt){

	var slides = [];

	var s1 = txt.split("\n## ");
	
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

var getFirstRow = function(txt){
	var index = txt.indexOf("\n");
	var out = txt.substring(0, index);
	return out.replace(/\n/gm, "");
}

var h1 = function(txt){
/*
section.slide#titlepage
  h1 TITLE
    .subtitle
      :markdown
        SUBTITLE
*/
	var title = getFirstRow(txt);
	var subtitle = txt.replace(title+"\n", "");
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

var h2 = function(txt){
/*
section.slide
  :markdown
    ## H2

    all markdown content until next # or ##
*/

	var title = getFirstRow(txt);

	var out = "section.slide\n";
	out+=tab+":markdown\n";
	out+=addTab(addTab(txt))+"\n";

	return out;
}

var md_file = "test.md";
var jd_file = "test.jade";
var ht_file = "test.html";

//get turn markdown file into string
var mdString = fs.readFileSync(md_file, 'ascii');

//add newline to start of file so getSections will grab the first line too
mdString = "\n"+mdString;

//break file into sections
var sections = getSections(mdString);

var locals = {
	title: undefined,
	js: [],
	css: []
};

var jdString = "";

for(var i=0; i<sections.length; i++){
	if(sections[i]!="# "){
		var slides = getSlides(sections[i]);

		if(locals.title == undefined){
			locals.title = getFirstRow(slides[0]);
			locals.title = locals.title.replace(/^# /, "");
		}

		var th1 = h1(slides[0]);

		jdString+=th1;

		for(var j=1; j<slides.length; j++){
			var th2 = h2(slides[j]);
			jdString+=th2;
		}
	}
}

jdString = "extends layout\n\nblock slides\n"+addTab(jdString);

jdString = jdString.replace(/\t/gm, tab);

fs.writeFile(jd_file, jdString, "utf8");

var jadeback = function(err, data){
	if(err){
		console.log(err);
	}
	else{
		fs.writeFile(ht_file, data, "utf8");
	}
}

jade.render(jdString, {filename: jd_file, locals: locals}, jadeback);