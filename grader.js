#!/usr/bin/env node

/*
Automatically grade files for the presence of specified HTML tags/attributes.
Teaches command line application development and basic DOM parsing.
Uses commander.js and cheerio.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('../restler');
var sys = require('util');

var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if (!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertUrlExists = function(url) {
    // TODO missing check
    var instr = url.toString();
    return instr;
};

var bufferFromFile = function(htmlfile) {
    var buffer = fs.readFileSync(htmlfile);
    return buffer;
};

var bufferFromUrl = function(url) {
    rest.get(url).on('complete', function(result) {
        if (result instanceof Error) {
            sys.puts('Error: ' + result.message);
            this.retry(5000); // try again after 5 sec
        } else {
            fs.writeFileSync("tmp.html", result);
        }
    });
    var buffer = fs.readFileSync("tmp.html");
    return buffer;
};

var loadChecks = function(checksfile) {
    var buffer = fs.readFileSync(checksfile);
    return JSON.parse(buffer);
};

var checkHtmlFile = function(buffer, checksfile) {
    $ = cheerio.load(buffer);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for (var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if (require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'URL for index.html', clone(assertUrlExists), null)
        .parse(process.argv);

    var buffer;
    if (program.url) {
        buffer = bufferFromUrl(program.url);
    } else {
        buffer = bufferFromFile(program.file);
    }
    var checks = program.checks;
    var checkJson = checkHtmlFile(buffer, checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
} else {
    exports.checkHtmlFile = checkHtmlFile;
}

