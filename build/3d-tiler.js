Geodan 2017
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('fs'), require('child_process'), require('bluebird'), require('readline'), require('obj2gltf'), require('3d-tiles-tools/lib/glbToB3dm'), require('fs-extra'), require('readline-sync'), require('scp2'), require('cesium'), require('proj4')) :
	typeof define === 'function' && define.amd ? define(['exports', 'fs', 'child_process', 'bluebird', 'readline', 'obj2gltf', '3d-tiles-tools/lib/glbToB3dm', 'fs-extra', 'readline-sync', 'scp2', 'cesium', 'proj4'], factory) :
	(factory((global.tiler = global.tiler || {}),global.fs,global.child_process,global.bluebird,global.readline,global.obj2gltf,global.glbToB3dm,global.fsExtra,global.readlineSync,global.client,global.Cesium,global.proj4));
}(this, (function (exports,fs,child_process,bluebird,readline,obj2gltf,glbToB3dm,fsExtra,readlineSync,client,Cesium,proj4) { 'use strict';

fs = 'default' in fs ? fs['default'] : fs;
readline = 'default' in readline ? readline['default'] : readline;
glbToB3dm = 'default' in glbToB3dm ? glbToB3dm['default'] : glbToB3dm;
fsExtra = 'default' in fsExtra ? fsExtra['default'] : fsExtra;
readlineSync = 'default' in readlineSync ? readlineSync['default'] : readlineSync;
client = 'default' in client ? client['default'] : client;
Cesium = 'default' in Cesium ? Cesium['default'] : Cesium;
proj4 = 'default' in proj4 ? proj4['default'] : proj4;

var splitTiles = function(bbox, tilesize) {
	var diffx = bbox[2] - bbox[0];
	var diffy = bbox[3] - bbox[1];
	
	var ntilesx = Math.ceil(diffx/tilesize);
	var ntilesy = Math.ceil(diffy/tilesize);
	
	var tiles = [];
	return new Promise(function(resolve, reject){
		for (let i=0; i<ntilesx; i++){
			for (let j=0; j<ntilesy; j++){
				var tile = [
					bbox[0] + (tilesize * i),
					bbox[1] + (tilesize * j),
					bbox[0] + (tilesize * (i+1)),
					bbox[1] + (tilesize * (j+1))
				];
				tiles.push(tile);
			}
		}
		resolve(tiles);
	});
	
};

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
				resolve(outfile);
		});
	});
	
};

var obj2gltf$1 = function(config) {
		var inObj = config.infile;
		console.log('Obj2gltf NEW');
		var obj2gltf$$1 = require('obj2gltf');
		var convert = obj2gltf$$1.convert;
		var outGltf = config.outfile;
		var options = {
				binary: true,
				optimizeForCesium: true,
				separate: true,
				embedImage: false // Don't embed image in the converted glTF
		};
		return convert(inObj, outGltf, options).then(d=>{
			console.log('resolving',outGltf);
			return outGltf.replace('gltf','glb');
		});
};

var glb2b3dm = function(config) {
	return new bluebird.Promise(function(resolve, reject){
		console.log('Glb2b3dm NEW');
		var infile = config.infile;
		var outfile = config.outfile;
		var fsReadFile = bluebird.Promise.promisify(fsExtra.readFile);
		var fsWriteFile = bluebird.Promise.promisify(fsExtra.outputFile);
		
		function readGlbWriteB3dm(inputPath, outputPath, force) {
			return fsReadFile(inputPath)
				.then(function(data) {
					return fsWriteFile(outputPath, glbToB3dm(data));
				});
		}
		readGlbWriteB3dm(infile, outfile,true);
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
		
		client.scp('./data/tileset.json', user+':'+pass+'@192.168.40.2:/var/data/sites/cesium/b3dm_test/', function(err) {
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
			var tiles = config.tiles;
			
			tiles.forEach(function(bbox){
				//Get lat lon
				var RD = "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.999908 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +no_defs +no_defs";
				var lowerleft = proj4(RD,'WGS84',[bbox[0], bbox[1]]);
				var upperright = proj4(RD,'WGS84',[bbox[2], bbox[3]]);
				
				var m = Cesium.Transforms.eastNorthUpToFixedFrame(
					Cesium.Cartesian3.fromDegrees(lowerleft[0],lowerleft[1], 0.0)
				);
				
				var child = {
					transform: [
						m[0],m[1],m[2],m[3],
						m[4],m[5],m[6],m[7],
						m[8],m[9],m[10],m[11],
						m[12],m[13],m[14],m[15]
					],
					boundingVolume: {
						region: [
							Cesium.Math.toRadians(lowerleft[0]),Cesium.Math.toRadians(lowerleft[1]),
							Cesium.Math.toRadians(upperright[0]),Cesium.Math.toRadians(upperright[1]),
							0,100
						]
					},
					geometricError: 120,
					content: {
					  url: bbox[0]+"-"+bbox[1]+"-"+bbox[2]+"-"+bbox[3]+".b3dm"
					},
					children: []
				};
				template.root.children.push(child);
			});                               
			
			
			fs.writeFile('./data/tileset.json', JSON.stringify(template), function (err) {
			  if (err) return console.error(err);
			  resolve(tiles);
			});
		});
	});
};

exports.splitTiles = splitTiles;
exports.export2obj = export2obj;
exports.offsetObj = offsetObj;
exports.obj2gltf = obj2gltf$1;
exports.glb2b3dm = glb2b3dm;
exports.scopy = scopy;
exports.createTileset = createTileset;

Object.defineProperty(exports, '__esModule', { value: true });

})));
