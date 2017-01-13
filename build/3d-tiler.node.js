'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var bluebird = require('bluebird');
var readline = _interopDefault(require('readline'));
var fs = _interopDefault(require('fs'));
var obj2gltf = require('obj2gltf');
var glbToB3dm = _interopDefault(require('3d-tiles-tools/lib/glbToB3dm'));
var fsExtra = _interopDefault(require('fs-extra'));
var readlineSync = _interopDefault(require('readline-sync'));
var client = _interopDefault(require('scp2'));

var offsetObj = function(config) {
	var infile = config.infile;
	var outfile = config.outfile;
	const offsetx = config.offsetx;
	const offsety = config.offsety;
	
	return new bluebird.Promise(function(resolve, reject){
		console.log('Setting offset');
		var lineReader = readline.createInterface({
		  input: fs.createReadStream(infile),
		  output: process.stdout,
		  terminal: false
		});
		
		var fd = fs.openSync(outfile, 'w');
		lineReader.on('line', function (line) {
			if (line[0] == 'v'){
				var arr = line.split(' ');
				arr[1] = parseFloat(arr[1] - offsetx).toFixed(3);
				arr[2] = parseFloat(arr[2] - offsety).toFixed(3);
				if (arr[1] == 0) {arr[1] = 0.1;}
				if (arr[2] == 0) {arr[2] = 0.1;}
				if (arr[3] == 0) {arr[3] = 0.1;}
				line = arr[0] + ' ' + arr[1] + ' ' + arr[3] + ' ' + arr[2]*-1;
			}
			fs.write(fd, line + '\n');
		});
		lineReader.on('close',function(){
				resolve({infile: outfile});
		});
	});
	
};

var obj2gltf$1 = function(config) {
		var inObj = config.infile;
		console.log('Obj2gltf NEW');
		var obj2gltf$$1 = require('obj2gltf');
		var convert = obj2gltf$$1.convert;
		var outGltf = './data/outfile.gltf';
		var options = {
				binary: true,
				optimizeForCesium: true,
				separate: true,
				embedImage: false // Don't embed image in the converted glTF
		};
		return convert(inObj, outGltf, options);
};

var glb2b3dm = function(config) {
	return new bluebird.Promise(function(resolve, reject){
		console.log('Glb2b3dm NEW');
		var outGltf = './data/outfile.glb';
		
		var fsReadFile = bluebird.Promise.promisify(fsExtra.readFile);
		var fsWriteFile = bluebird.Promise.promisify(fsExtra.outputFile);
		
		function readGlbWriteB3dm(inputPath, outputPath, force) {
			return fsReadFile(inputPath)
				.then(function(data) {
					return fsWriteFile(outputPath, glbToB3dm(data));
				});
		}
		readGlbWriteB3dm(outGltf, './data/outfile.b3dm',true);
		resolve();//TT: this resolve is likely too early
	});
};

var scopy = function(config) {
	var user = config.user;
	var pass = config.pass;
	return new Promise(function(resolve, reject){
		console.log('Copy to webserver (/var/data/sites/cesium/b3dm_test/) NEW');

		var pass = readlineSync.question('Password for ' + user + ': ', {
		  hideEchoBack: true // The typed text on screen is hidden by `*` (default). 
		});
		
		client.scp('./data/*.*', user+':'+pass+'@192.168.40.2:/var/data/sites/cesium/b3dm_test/', function(err) {
			if (!err){
				resolve();
			}
			else {
				reject(err);
			}
		});
		
	});
};

exports.offsetObj = offsetObj;
exports.obj2gltf = obj2gltf$1;
exports.glb2b3dm = glb2b3dm;
exports.scopy = scopy;
