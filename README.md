# Deck.md

Convert Markdown into a single file Deck.js App.

## Usage

	var deckmd = require("../lib/deckmd");
	var fs = require('fs');

	var content = {
		demo1: {
			path: "demo.md"
		}
	}

	deckmd.renderFile(content, {}, function(err, html, config){
		if(err){
			console.log(err);
		}
		else{
			fs.writeFile("demo.html", html, "utf8");
		}
	});

## API

### renderFiles(files, customConfig, callback)

Attempts to generate the html, css, javascript and data-uris needed to render the passed markdown files into a single file deck.js app.

* files: a string, array, or object representing the file to be rendered
	* string: the file path to be rendered
	* array: a collection of file paths and/or file objects
	* object: a collection of file objects, keyed by a unique name. (Note: This object is slightly different from the use used in render)
		* path: the file path to be rendered
		* attributions: an array of attribution objects (not required).
			* name: the name or title of who is to be attributed
			* link: The url to have the name link too (not required).
* customConfig: an object of config options.
* callback: the function to receive the generated file. Takes three parameters: status, html, config
	* status: object of status info.
		* err: undefined if no error
		* warnings: list of render warnings. If a file can't be found and is not required by the configs, it will be noted here.
		* code: a bunch of status codes yet to be determined
	* html: the generated html
	* config: the config object used in the creation of the deck.js app. This should be used to debug config options passed via the customConfig parameter.

### render(files, customConfig, callback)

Attempts to generate the html, css, javascript and data-uris needed to render the passed markdown strings into a single deck.js app.

* files: a string, array or object representing the file to be rendered
	* string: the markdown text to be rendered
	* array: a collection of markdown strings and/or file objects
	* object: a collection of file objects, keyed by a unique name. (Note: This object is slightly different from the use used in renderFiles)
		* md: the markdown string to be rendered
		* attributions: an array of attribution objects (not required).
			* name: the name or title of who is to be attributed
			* link: The url to have the name link too (not required).
* customConfig: an object of config options.
* callback: the function to receive the generated file. Takes three parameters: status, html, config
	* status: object of status info.
		* err: undefined if no error
		* warnings: list of render warnings. If a file can't be found and is not required by the configs, it will be noted here.
		* code: a bunch of status codes yet to be determined
	* html: the generated html
	* config: the config object used in the creation of the deck.js app. This should be used to debug config options passed via the customConfig parameter.

## Config Options

* destination: an object representing the destination of the html and jade files. Defaults to undefined.
	* path: the path to the folder in which the files will be saved.
	* name: the name of the file as it shale be saved save the extension.
* saveJade: Boolean used to turn on and off the auto saving of the jade files used to render the deck.js app. Defaults to false.
* saveHtml: Boolean used to turn on and off the auto saving of the html file created. Defaults to false.

## Next Steps

### 0.1.0

* Add in attribution code

### 0.2.0

* Simplify the addition of custom styles
* Simplify the addition of deck.js extensions
* Add deck.js version selection options

## Licenses

All code not otherwise specified is Copyright 2013 Matthew Chase Whittemore.
Released under the MIT License.

[deck.js][deckjs] is Copyright Caleb Troughton and dual licensed under the
MIT and GPL licenses.

Deck.md is a derived from [Ryan Roemer's Deck.js Starter Project][rr] licensed user the MIT license.

Included libraries:

* jQuery: MIT and GPL
* Modernizr: MIT and BSD
* CoffeeScript: MIT

[rr]: https://github.com/ryan-roemer/deck.js-starter
[deckjs]: https://github.com/imakewebthings/deck.js
