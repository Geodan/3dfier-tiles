var tool = require('../build/3d-tiler.node.js');

process.on('message', function(m) {
  
	var xmin = m.xmin;
	var ymin = m.ymin;
	var xmax = m.xmax;
	var ymax = m.ymax;
	console.log('Worker!', xmin, ymin, xmax, ymax);
	
	tool.export2obj({xmin: xmin, ymin: ymin, xmax: xmax, ymax: ymax})
		.then(d=>{
			return tool.offsetObj({
				infile: './data/models/' + xmin + '-' + ymin + '-' + xmax + '-' + ymax + '.obj',
				outfile: './data/models/' + xmin + '-' + ymin + '-' + xmax + '-' + ymax + '_offset.obj',
				offsetx: xmin, 
				offsety: ymin
			})
		}).then(d=>{
			return tool.obj2gltf({
				infile: './data/models/' + xmin + '-' + ymin + '-' + xmax + '-' + ymax + '_offset.obj',
				outfile: './data/models/' + xmin + '-' + ymin + '-' + xmax + '-' + ymax + '.gltf',
			});
		}).then(d=>{
			return tool.glb2b3dm({
				infile: './data/models/' + xmin + '-' + ymin + '-' + xmax + '-' + ymax + '.glb',
				outfile: './data/' + xmin + '-' + ymin + '-' + xmax + '-' + ymax + '.b3dm',
			});
		}).then(d=>{
			process.send('complete');
		});
		
	//process.send('complete');
});