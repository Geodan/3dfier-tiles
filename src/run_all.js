var 
	xmin = parseInt(process.argv[2]),
	ymin = parseInt(process.argv[3]),
	xmax = parseInt(process.argv[4]),
	ymax = parseInt(process.argv[5]);

var tool = require('../build/3d-tiler.node.js');	

const tmpdir = '/tmp';


if (!ymax){
	throw('coordinates missing');
}

function step5(){
	
}
function step6(){
	return tool.scopy({user: 'tilt'});
}

function done(){
	console.log('Done!');
}


var promisearr = [];
var tiles = tool.splitTiles([121000,486600,121470,486800],200);

tiles.then(function(tiles){
	return Promise.all(tiles.map(function(tile){
		const xmin = tile[0];
		const ymin = tile[1];
		const xmax = tile[2];
		const ymax = tile[3];
		console.log(tile);
		var sequence = Promise.resolve();
		sequence.then(d=>{
			tool.export2obj({xmin: xmin, ymin: ymin, xmax: xmax, ymax: ymax});
		}).then(d=>{
			tool.offsetObj({
				infile: './data/models/' + xmin + '-' + ymin + '-' + xmax + '-' + ymax + '.obj',
				outfile: './data/models/' + xmin + '-' + ymin + '-' + xmax + '-' + ymax + '_offset.obj',
				offsetx: xmin, 
				offsety: ymin
			})
		}).then(d=>{
			tool.obj2gltf({
				infile: './data/models/' + xmin + '-' + ymin + '-' + xmax + '-' + ymax + '_offset.obj',
				outfile: './data/models/' + xmin + '-' + ymin + '-' + xmax + '-' + ymax + '.gltf',
			});
		}).then(d=>{
			tool.glb2b3dm({
				infile: './data/models/' + xmin + '-' + ymin + '-' + xmax + '-' + ymax + '.glb',
				outfile: './data/' + xmin + '-' + ymin + '-' + xmax + '-' + ymax + '.b3dm',
			});
		});
		return sequence();
	}))
	.then(d=>{
		console.log(tiles);
		tool.createTileset({
			tiles: tiles
		});
	}
	)
	//.then(step6)
	.then(done)
	.catch(function(e){
		console.warn(e);
	});
});