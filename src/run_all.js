var 
	xmin = parseInt(process.argv[2]),
	ymin = parseInt(process.argv[3]),
	xmax = parseInt(process.argv[4]),
	ymax = parseInt(process.argv[5]),
	tilesize = parseInt(process.argv[6]);
const computecluster = require('compute-cluster');

var tool = require('../build/3d-tiler.node.js');	

if (!ymax){
	console.warn('coordinates missing');
}

var cc = new computecluster({
  module: './src/worker.js',
  max_processes: 4,
  max_backlog: -1
});


tool.splitTiles([xmin, ymin, xmax, ymax],tilesize)
	.then(tiles=>{
		console.log(tiles);
		return tool.createTileset({
			tiles: tiles
		})
	}).then(tiles=>{
		//return null; //FIXME
		var toRun = tiles.length;
		console.log('Exporting ' + tiles.length + ' tiles');
		
		for (var i = 0; i < tiles.length; i++) {
			var cfg = {
				xmin: tiles[i][0],
				ymin: tiles[i][1],
				xmax: tiles[i][2],
				ymax: tiles[i][3]
			};
			
			cc.enqueue(cfg, function(err, r) {
				if (err) console.log("an error occured:", err);
				else console.log("tile ", r);
				console.log(toRun+' to go...');
				if (--toRun === 0) {
					console.log('All done!');
					cc.exit();
				}
			});
		}
	})
	.catch(e=>{
			console.warn(e);
	});


	
	
	
