Geodan 2017
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('fs'), require('child_process'), require('bluebird'), require('obj2gltf'), require('3d-tiles-tools/lib/glbToB3dm'), require('fs-extra'), require('readline-sync'), require('scp2'), require('cesium'), require('proj4')) :
	typeof define === 'function' && define.amd ? define(['exports', 'fs', 'child_process', 'bluebird', 'obj2gltf', '3d-tiles-tools/lib/glbToB3dm', 'fs-extra', 'readline-sync', 'scp2', 'cesium', 'proj4'], factory) :
	(factory((global.tiler = global.tiler || {}),global.fs,global.child_process,global.bluebird,global.obj2gltf,global.glbToB3dm,global.fsExtra,global.readlineSync,global.client,global.Cesium,global.proj4));
}(this, (function (exports,fs,child_process,bluebird,obj2gltf,glbToB3dm,fsExtra,readlineSync,client,Cesium,proj4) { 'use strict';

fs = 'default' in fs ? fs['default'] : fs;
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
		var fd = fs.openSync(outfile, 'w');
		
		var array = fs.readFileSync(infile).toString().split("\n");
		var i;
		for(i in array) {
			var line = array[i];
			//console.log(array[i]);
			if (line[0] == 'v'){
				var arr = line.split(' ');
				arr[1] = (parseFloat(arr[1]) - offsetx).toFixed(3);
				arr[2] = (parseFloat(arr[2]) - offsety).toFixed(3);
				line = arr[0] + ' ' + arr[1] + ' ' + arr[3] + ' ' + arr[2]*-1;
			}
			fs.writeSync(fd, line + '\n');
		}
		fs.closeSync(fd);
		console.log('Done offsetting ', infile);
		resolve(outfile);
	});
};

var obj2gltf$1 = function(config) {
		var inObj = config.infile;
		console.log('Obj2gltf');
		var obj2gltf$$1 = require('obj2gltf');
		var outGltf = config.outfile;
		var options = {
				binary: true,
				optimizeForCesium: true,
				embedImage: false // Don't embed image in the converted glTF
		};
		
		return obj2gltf$$1(inObj, outGltf, options).then(d=>{
			return outGltf;
		}).catch(e=>{
			console.error('Error',e);
		});
};

var glb2b3dm = function(config) {
	console.log('Glb2b3dm');
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
	return readGlbWriteB3dm(infile, outfile,true);
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
				function toWGS(coords){
					return proj4(RD,'WGS84',coords); 
				}
				function toCartesian3(latlon){
					return Cesium.Cartesian3.fromDegrees(latlon[0],latlon[1],0.0);
				}
				var lowerleft 	= toCartesian3(toWGS([bbox[0], bbox[1]]));
				var upperright 	= toCartesian3(toWGS([bbox[2], bbox[3]]));
				var upperleft 	= toCartesian3(toWGS([bbox[0], bbox[3]]));
				var lowerright 	= toCartesian3(toWGS([bbox[2], bbox[1]]));
				var center = {
						x: (lowerright.x - lowerleft.x)/2 + lowerleft.x,
						y: (upperright.y - lowerright.y)/2 + lowerleft.y,
						z: 0.0
				};  
				var ellipsoid = Cesium.Ellipsoid.WGS84;
				var ENU = new Cesium.Matrix3();
				var m = Cesium.Transforms.eastNorthUpToFixedFrame(lowerleft, ellipsoid, ENU);
				//box: "An array of 12 numbers that define an oriented bounding box.  The first three elements define the x, y, and z values for the center of the box.  The next three elements (with indices 3, 4, and 5) define the x axis direction and half-length.  The next three elements (indices 6, 7, and 8) define the y axis direction and half-length.  The last three elements (indices 9, 10, and 11) define the z axis direction and half-length."
				var ll=toWGS([bbox[0],bbox[1]]);
				var ur=toWGS([bbox[2],bbox[3]]);
				var boundingVolume = {
					regionX: [
						Cesium.Math.toRadians(ll[0]),Cesium.Math.toRadians(ll[1]),
						Cesium.Math.toRadians(ur[0]),Cesium.Math.toRadians(ur[1]),
						0,100
					],
					box: [
						bbox[0],bbox[1],0,
						100,0,0,
						0,100,0,
						0,0,20
					]
				};
				var child = {
					//transform: [
					//	m[0],m[1],m[2],m[3],
					//	m[4],m[5],m[6],m[7],
					//	m[8],m[9],m[10],m[11],
					//	m[12],m[13],m[14],m[15]
					//],
					boundingVolume: boundingVolume,
					geometricError: 120,
					content: {
					  url: bbox[0]+"-"+bbox[1]+"-"+bbox[2]+"-"+bbox[3]+".json"
					},
					children: []
				};
				template.root.children.push(child);
				
				var json = {
				  asset: {
					version: "0.0"
				  },
				  geometricError: 0.0,
				  root: {
					boundingVolume: boundingVolume,
					geometricError: 20.0,
					refine: "add",
					children: [{
						boundingVolume:boundingVolume,
					    geometricError: 10.0,
						refine: "replace",
						content: {
						  url: bbox[0]+"-"+bbox[1]+"-"+bbox[2]+"-"+bbox[3]+".b3dm"
						}
					}]
				  }
				};
				
				fs.writeFileSync("./data/"+bbox[0]+"-"+bbox[1]+"-"+bbox[2]+"-"+bbox[3]+".json", JSON.stringify(json));
				
				
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
