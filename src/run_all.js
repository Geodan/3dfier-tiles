var 
	xmin = parseInt(process.argv[2]),
	ymin = parseInt(process.argv[3]),
	xmax = parseInt(process.argv[4]),
	ymax = parseInt(process.argv[5]);
const computecluster = require('compute-cluster');

var tool = require('../build/3d-tiler.node.js');	

if (!ymax){
	console.warn('coordinates missing');
}

function step6(){
	return ;
}


var cc = new computecluster({
  module: './src/worker.js'
});


tool.splitTiles([xmin, ymin, xmax, ymax],500).then(function(tiles){
	var toRun = tiles.length;
	console.log('Exporting ' + tiles.length + ' tiles');
	for (var i = 0; i < tiles.length; i++) {
		var cfg = {
			xmin: tiles[i][0],
			ymin: tiles[i][1],
			xmax: tiles[i][2],
			ymax: tiles[i][3]
		};
		console.log(cfg);
		
		cc.enqueue(cfg, function(err, r) {
				if (err) console.log("an error occured:", err);
				else console.log("Done: ", r);
				if (--toRun === 0) {
					tool.createTileset({
						tiles: tiles
					}).then(d=>{
						Promise.resolve();
						//tool.scopy({user: 'tilt'})
					}).then(d=>{
						console.log('All done!');
					}).catch(function(e){
						console.warn(e);
					});
					cc.exit();
				}
		});
	}
});


	
	
	
