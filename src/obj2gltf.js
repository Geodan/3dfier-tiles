import obj2gltf from "obj2gltf"

export default function(config) {
		var inObj = config.infile;
		console.log('Obj2gltf NEW');
		var obj2gltf = require('obj2gltf');
		var convert = obj2gltf.convert;
		var outGltf = config.outfile;
		var options = {
				binary: true,
				optimizeForCesium: true,
				separate: true,
				embedImage: false // Don't embed image in the converted glTF
		};
		return convert(inObj, outGltf, options);
}