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
				function toWGS(coords){
					return proj4(RD,'WGS84',coords); 
				}
				function toCartesian3(latlon){
					return Cesium.Cartesian3.fromDegrees(latlon[0],latlon[1],0.0);
				}
				var lowerleft 	= toCartesian3(toWGS([bbox[0], bbox[1]]));
				var upperright 	= toCartesian3(toWGS([bbox[2], bbox[3]]));
				var upperleft 	= toCartesian3(toWGS([bbox[0], bbox[3]]));
				var lowerright 	= toCartesian3(toWGS([bbox[2], bbox[1]]));
				var center = {
						x: (lowerright.x - lowerleft.x)/2 + lowerleft.x,
						y: (upperright.y - lowerright.y)/2 + lowerleft.y,
						z: 0.0
				};  
				var ellipsoid = Cesium.Ellipsoid.WGS84;
				var ENU = new Cesium.Matrix3();
				var m = Cesium.Transforms.eastNorthUpToFixedFrame(lowerleft, ellipsoid, ENU);
				//box: "An array of 12 numbers that define an oriented bounding box.  The first three elements define the x, y, and z values for the center of the box.  The next three elements (with indices 3, 4, and 5) define the x axis direction and half-length.  The next three elements (indices 6, 7, and 8) define the y axis direction and half-length.  The last three elements (indices 9, 10, and 11) define the z axis direction and half-length."
				var ll=toWGS([bbox[0],bbox[1]]);
				var ur=toWGS([bbox[2],bbox[3]]);
				var boundingVolume = {
					regionX: [
						Cesium.Math.toRadians(ll[0]),Cesium.Math.toRadians(ll[1]),
						Cesium.Math.toRadians(ur[0]),Cesium.Math.toRadians(ur[1]),
						0,100
					],
					box: [
						bbox[0],bbox[1],0,
						100,0,0,
						0,100,0,
						0,0,20
					]
				};
				var child = {
					//transform: [
					//	m[0],m[1],m[2],m[3],
					//	m[4],m[5],m[6],m[7],
					//	m[8],m[9],m[10],m[11],
					//	m[12],m[13],m[14],m[15]
					//],
					boundingVolume: boundingVolume,
					geometricError: 120,
					content: {
					  url: bbox[0]+"-"+bbox[1]+"-"+bbox[2]+"-"+bbox[3]+".json"
					},
					children: []
				};
				template.root.children.push(child);
				
				var json = {
				  asset: {
					version: "0.0"
				  },
				  geometricError: 0.0,
				  root: {
					boundingVolume: boundingVolume,
					geometricError: 20.0,
					refine: "add",
					children: [{
						boundingVolume:boundingVolume,
					    geometricError: 10.0,
						refine: "replace",
						content: {
						  url: bbox[0]+"-"+bbox[1]+"-"+bbox[2]+"-"+bbox[3]+".b3dm"
						}
					}]
				  }
				};
				
				fs.writeFileSync("./data/"+bbox[0]+"-"+bbox[1]+"-"+bbox[2]+"-"+bbox[3]+".json", JSON.stringify(json));
				
				
			});                               
			
			
			fs.writeFile('./data/tileset.json', JSON.stringify(template), function (err) {
			  if (err) return console.error(err);
			  resolve(tiles);
			});
		});
	});
}