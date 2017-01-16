export default function(bbox, tilesize) {
	var diffx = bbox[2] - bbox[0];
	var diffy = bbox[3] - bbox[1];
	
	var ntilesx = Math.ceil(diffx/tilesize);
	var ntilesy = Math.ceil(diffy/tilesize);
	
	var tiles = [];
	return new Promise(function(resolve, reject){
		for (let i=0; i<ntilesx; i++){
			for (let j=0; j<ntilesy; j++){
				var tile = [
					bbox[0] + (tilesize * i),
					bbox[1] + (tilesize * j),
					bbox[0] + (tilesize * (i+1)),
					bbox[1] + (tilesize * (j+1))
				]
				tiles.push(tile);
			}
		}
		resolve(tiles);
	});
	
}