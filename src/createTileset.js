import fs from "fs";
import Cesium from "cesium";
import proj4 from "proj4";

export default function(config) {
	return new Promise(function(resolve, reject){
		console.log('Creating tileset.json NEW');
		fs.readFile('./src/tileset_template.json',function (err,doc){
			if (err) return console.error(err);
			var template = JSON.parse(doc);
			var tiles = config.tiles;
			
			tiles.forEach(function(bbox){
				//Get lat lon
				var RD = "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.999908 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +no_defs +no_defs";
				var lowerleft = proj4(RD,'WGS84',[bbox[0], bbox[1]]);
				var upperright = proj4(RD,'WGS84',[bbox[2], bbox[3]]);
				
				var m = Cesium.Transforms.eastNorthUpToFixedFrame(
					Cesium.Cartesian3.fromDegrees(lowerleft[0],lowerleft[1], 0.0)
				);
				
				var child = {
					transform: [
						m[0],m[1],m[2],m[3],
						m[4],m[5],m[6],m[7],
						m[8],m[9],m[10],m[11],
						m[12],m[13],m[14],m[15]
					],
					boundingVolume: {
						region: [
							Cesium.Math.toRadians(lowerleft[0]),Cesium.Math.toRadians(lowerleft[1]),
							Cesium.Math.toRadians(upperright[0]),Cesium.Math.toRadians(upperright[1]),
							0,100
						]
					},
					geometricError: 120,
					content: {
					  url: bbox[0]+"-"+bbox[1]+"-"+bbox[2]+"-"+bbox[3]+".b3dm"
					},
					children: []
				};
				template.root.children.push(child);
			});                               
			
			
			fs.writeFile('./data/tileset.json', JSON.stringify(template), function (err) {
			  if (err) return console.error(err);
			  resolve(tiles);
			});
		});
	});
}