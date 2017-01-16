'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = _interopDefault(require('fs'));
var child_process = require('child_process');
var bluebird = require('bluebird');
var readline = _interopDefault(require('readline'));
var obj2gltf = require('obj2gltf');
var glbToB3dm = _interopDefault(require('3d-tiles-tools/lib/glbToB3dm'));
var fsExtra = _interopDefault(require('fs-extra'));
var readlineSync = _interopDefault(require('readline-sync'));
var client = _interopDefault(require('scp2'));
var Cesium = _interopDefault(require('cesium'));
var proj4 = _interopDefault(require('proj4'));

var export2obj = function(config) {
	return new Promise(function(resolve, reject){
		console.log('Exporting data to obj file');
		
		var command = './src/run3dfier.sh '+config.xmin+' '+config.ymin+' '+config.xmax+' '+config.ymax;
		var child = child_process.exec(command, function(err, stdout, stderr){
			if(err != null){
				reject(err);
				//return cb(new Error(err), null);
			}else if(typeof(stderr) != "string"){
				reject(stderr);
				//return cb(new Error(stderr), null);
			}else{
				resolve();
				//return cb(null, stdout);
			}
		});
		//console.log(child);
		child.on('close', function(code) {
		  console.log('run3dfier ended with: ' + code);
		  resolve();
		});
		child.on('error', function(err) {
		  console.log('run3dfier errd with: ' + err);
		  reject(err);
		});
		child.stdout.on('data', function(d) {
		  console.log('run3dfier: ' + d);
	   });
		
		
	});
};

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

var createTileset = function(config) {
	return new Promise(function(resolve, reject){
		console.log('Creating tileset.json NEW');
		fs.readFile('./src/tileset_template.json',function (err,doc){
			if (err) return console.error(err);
			var template = JSON.parse(doc);
			
			//Get lat lon
			var RD = "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.999908 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +no_defs +no_defs";
			var lowerleft = proj4(RD,'WGS84',[config.xmin,config.ymin]);
			var upperright = proj4(RD,'WGS84',[config.xmax,config.ymax]);
			
			//1.get modelmatrix 
			var m = Cesium.Transforms.eastNorthUpToFixedFrame(
				Cesium.Cartesian3.fromDegrees(lowerleft[0],lowerleft[1], 0.0));
			template.root.children[0].transform = [
				m[0],
				m[1],
				m[2],
				m[3],
				m[4],
				m[5],
				m[6],
				m[7],
				m[8],
				m[9],
				m[10],
				m[11],
				m[12],
				m[13],
				m[14],
				m[15]
			];
			
			//set region
			template.root.children[0].boundingVolume.region = [
				lowerleft[0],lowerleft[1],
				upperright[0],upperright[1],
				0,100
			];
			
			
			fs.writeFile('tileset_new.json', JSON.stringify(template), function (err) {
			  if (err) return console.error(err);
			  resolve();
			});
		});
	});
};

exports.export2obj = export2obj;
exports.offsetObj = offsetObj;
exports.obj2gltf = obj2gltf$1;
exports.glb2b3dm = glb2b3dm;
exports.scopy = scopy;
exports.createTileset = createTileset;
