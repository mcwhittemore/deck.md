module.exports = {
	js: [
		__dirname+"/deck.js/extensions/hash/deck.hash.js",
		__dirname+"/deck.js/extensions/menu/deck.menu.js",
		__dirname+"/deck.js/extensions/goto/deck.goto.js",
	    __dirname+"/deck.js/extensions/status/deck.status.js",
	    __dirname+"/deck.js/extensions/navigation/deck.navigation.js",
	    __dirname+"/deck.js/extensions/scale/deck.scale.js"
	],
	coreJS: [
    	__dirname+"/deck.js/core/deck.core.js"
	],
	jqueryJS:[
		__dirname+"/deck.js/jquery-1.7.2.min.js"
	],
	modernizrJS: [
		__dirname+"/deck.js/modernizr.custom.js"
	],
	css: [
	    __dirname+"/deckmd.css",
	    __dirname+"/deck.js/extensions/goto/deck.goto.css",
	    __dirname+"/deck.js/extensions/menu/deck.menu.css",
	    __dirname+"/deck.js/extensions/navigation/deck.navigation.css",
	    __dirname+"/deck.js/extensions/status/deck.status.css",
	    __dirname+"/deck.js/extensions/hash/deck.hash.css",
	    __dirname+"/deck.js/extensions/scale/deck.scale.css",
	    __dirname+"/deck.js/themes/transition/horizontal-slide.css"
	],
	coreCSS:[
		__dirname+"/deck.js/core/deck.core.css"
	],
	tab: "  ",
	sections: [
		"\n# ",
		"\n## "
	],
	attributions:[],
	credit:{
		deckjs:[
			{
				author: "Caleb Troughton",
				link: "https://github.com/imakewebthings/deck.js"
			}
		],
		deckmd:[
			{
				author: "Matthew Chase Whittemore",
				link: "http://www.willrobotsdream.com"
			},
			{
				author:"Ryan Roemer",
				link:"https://github.com/ryan-roemer/deck.js-starter"
			}
		]
	},
	saveJade: false,
	saveHtml: false,
	singleFile: true,
	destination: {
		allStub: "md_to_deckjs",
		jade: undefined,
		html: undefined
	}
}