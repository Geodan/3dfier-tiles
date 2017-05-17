import obj2gltf from "obj2gltf"

export default function(config) {
		var inObj = config.infile;
		console.log('Obj2gltf');
		var obj2gltf = require('obj2gltf');
		var outGltf = config.outfile;
		var options = {
				binary: true,
				optimizeForCesium: true,
				embedImage: false // Don't embed image in the converted glTF
		};
		
		return obj2gltf(inObj, outGltf, options).then(d=>{
			return outGltf;
		}).catch(e=>{
			console.error('Error',e);
		});
}