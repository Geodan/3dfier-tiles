var fs = require('fs'),
	readline = require('readline'),
	infile = process.argv[2],
	outfile = process.argv[3],
	offset = process.argv[4];

	
	
if (!infile || !outfile){
	throw('No in or outfile given');
}
/*	
var lineReader = readline.createInterface({
  input: fs.createReadStream(infile),
  output: process.stdout,
  terminal: false
});

fd = fs.openSync(outfile, 'w');

lineReader.on('line', function (line) {
	if (line[0] == 'v'){
		arr = line.split(' ');
		arr[1] = parseFloat(arr[1] - offset[0]).toFixed(3);
		arr[2] = parseFloat(arr[2] - offset[1]).toFixed(3);
		line = arr[0] + ' ' + arr[1] + ' ' + arr[3] + ' ' + arr[2]*-1;
	}
	fs.write(fd, line + '\n');
});

/************/
/*
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
convert(inObj, outGltf, options)
    .then(function() {
        console.log('Converted model');
    });
    
/************/
var outGltf = './data/outfile.glb';
var glbToB3dm = require('3d-tiles-tools/lib/glbToB3dm');
var fileExists = require('3d-tiles-tools/lib/fileExists');
var fsExtra = require('fs-extra');
var Promise = require('bluebird');
var fsReadFile = Promise.promisify(fsExtra.readFile);
var fsWriteFile = Promise.promisify(fsExtra.outputFile);

function readGlbWriteB3dm(inputPath, outputPath, force) {
    //outputPath = defaultValue(outputPath, inputPath.slice(0, inputPath.length - 3) + 'b3dm');
    return fileExists(outputPath)
        .then(function(exists) {
            if (!force && exists) {
                console.log('File ' + outputPath + ' already exists. Specify -f or --force to overwrite existing file.');
                return;
            }
            return fsReadFile(inputPath)
                .then(function(data) {
                    return fsWriteFile(outputPath, glbToB3dm(data));
                });
        });
}
readGlbWriteB3dm(outGltf, './data/outfile.b3dm',true);