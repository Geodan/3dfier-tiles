var Promise = require('bluebird'),
	fs = require('fs'),
	readline = require('readline'),
	infile = process.argv[2],
	outfile = process.argv[3],
	offsetx = process.argv[4],
	offsety = process.argv[5];

	
	
if (!infile || !outfile || !offsety){
	throw('No in or outfile given');
}

function reproject(){
	return new Promise(function(resolve, reject){
		var lineReader = readline.createInterface({
		  input: fs.createReadStream(infile),
		  output: process.stdout,
		  terminal: false
		});
		
		fd = fs.openSync(outfile, 'w');
		console.log('Offset: ' ,offsetx);
		lineReader.on('line', function (line) {
			if (line[0] == 'v'){
				arr = line.split(' ');
				arr[1] = parseFloat(arr[1] - offsetx).toFixed(3);
				arr[2] = parseFloat(arr[2] - offsety).toFixed(3);
				if (arr[1] == 0) {arr[1] = 0.1};
				if (arr[2] == 0) {arr[2] = 0.1};
				if (arr[3] == 0) {arr[3] = 0.1};
				line = arr[0] + ' ' + arr[1] + ' ' + arr[3] + ' ' + arr[2]*-1;
			}
			fs.write(fd, line + '\n');
		});
		lineReader.on('close',resolve);
	});
}


function togltf(){
		var obj2gltf = require('obj2gltf');
		var convert = obj2gltf.convert;
		var inObj = outfile;
		var outGltf = './data/outfile.gltf';
		var options = {
				binary: true,
				optimizeForCesium: true,
				separate: true,
				embedImage: false // Don't embed image in the converted glTF
		};
		return convert(inObj, outGltf, options);
}

function tob3dm(){
	return new Promise(function(resolve, reject){
		var outGltf = './data/outfile.glb';
		var glbToB3dm = require('3d-tiles-tools/lib/glbToB3dm');
		var fileExists = require('3d-tiles-tools/lib/fileExists');
		var fsExtra = require('fs-extra');
		
		var fsReadFile = Promise.promisify(fsExtra.readFile);
		var fsWriteFile = Promise.promisify(fsExtra.outputFile);
		
		function readGlbWriteB3dm(inputPath, outputPath, force) {
			//outputPath = defaultValue(outputPath, inputPath.slice(0, inputPath.length - 3) + 'b3dm');
			return fileExists(outputPath)
				.then(function(exists) {
					if (!force && exists) {
						console.log('File ' + outputPath + ' already exists. Specify -f or --force to overwrite existing file.');
						reject();
						return;
					}
					return fsReadFile(inputPath)
						.then(function(data) {
							return fsWriteFile(outputPath, glbToB3dm(data));
						});
				});
		}
		readGlbWriteB3dm(outGltf, './data/outfile.b3dm',true);
		resolve();
	});
}

function scopy(){
	return new Promise(function(resolve, reject){
		var client = require('scp2')
		client.scp('./data/outfile.b3dm', 'tilt@192.168.40.2:/var/data/sites/cesium/b3dm_test/', function(err) {
			if (!err){
				resolve();
			}
			else {
				reject(err);
			}
		});
	});
}

reproject()
	.then(togltf)
	.then(tob3dm)
	.then(scopy)
	.then(function(){;
			console.log('Done!');
});
