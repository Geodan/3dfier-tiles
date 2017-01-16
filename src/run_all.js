var 
	xmin = process.argv[2],
	ymin = process.argv[3],
	xmax = process.argv[4],
	ymax = process.argv[5];

var tool = require('../build/3d-tiler.node.js');	
	
if (!ymax){
	throw('coordinates missing');
}
/*
tool.export2obj({
		xmin: xmin,
		ymin: ymin,
		xmax: xmax,
		ymax: ymax
})
.then(function(){

	tool.offsetObj({
		infile:'./data/models/'+xmin+'-'+ymin+'-'+xmax+'-'+ymax+'.obj',
		outfile: './data/3dfied_out.obj',
		offsetx: xmin, 
		offsety: ymin
	})
	.then(tool.obj2gltf)
	.then(tool.glb2b3dm)
	.then(tool.createTileset)
	.then(function(){
		tool.scopy({user: 'tilt'});
	})
	
	.then(function(){;
		console.log('Done!');
}).catch(function(e){
	console.warn(e);
});*/
tool.createTileset({
		xmin: xmin, 
		ymin: ymin,
		
});