var 
	infile = process.argv[2],
	outfile = process.argv[3],
	offsetx = process.argv[4],
	offsety = process.argv[5]
	user = process.argv[6];
	
	
var tool = require('../build/3d-tiler.node.js');	
	
if (!infile || !outfile || !offsety){
	throw('No in or outfile given');
}

tool.offsetObj({
	infile:infile,
	outfile: './data/3dfied_out.obj',
	offsetx: offsetx, 
	offsety: offsety
	}).then(tool.obj2gltf)
	.then(tool.glb2b3dm)
	.then(tool.createTileset)
	.then(function(){
			tool.scopy({user: user})
	})
	.then(function(){;
		console.log('Done!');
}).catch(function(e){
	console.warn(e);
});