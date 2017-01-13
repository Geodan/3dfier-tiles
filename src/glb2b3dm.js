import {Promise} from 'bluebird';
import glbToB3dm from '3d-tiles-tools/lib/glbToB3dm';
import fsExtra from 'fs-extra'; 

export default function(config) {
	return new Promise(function(resolve, reject){
		console.log('Glb2b3dm NEW');
		var outGltf = './data/outfile.glb';
		
		var fsReadFile = Promise.promisify(fsExtra.readFile);
		var fsWriteFile = Promise.promisify(fsExtra.outputFile);
		
		function readGlbWriteB3dm(inputPath, outputPath, force) {
			return fsReadFile(inputPath)
				.then(function(data) {
					return fsWriteFile(outputPath, glbToB3dm(data));
				});
		}
		readGlbWriteB3dm(outGltf, './data/outfile.b3dm',true);
		resolve();//TT: this resolve is likely too early
	});
}