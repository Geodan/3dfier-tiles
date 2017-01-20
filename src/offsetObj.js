import {Promise} from "bluebird";
import fs from "fs";

export default function(config) {
	var infile = config.infile;
	var outfile = config.outfile;
	const offsetx = config.offsetx;
	const offsety = config.offsety;
	
	return new Promise(function(resolve, reject){
		console.log('Setting offset');
		var fd = fs.openSync(outfile, 'w');
		
		var array = fs.readFileSync(infile).toString().split("\n");
		var i;
		for(i in array) {
			var line = array[i];
			//console.log(array[i]);
			if (line[0] == 'v'){
				var arr = line.split(' ');
				arr[1] = (parseFloat(arr[1]) - offsetx).toFixed(3);
				arr[2] = (parseFloat(arr[2]) - offsety).toFixed(3);
				line = arr[0] + ' ' + arr[1] + ' ' + arr[3] + ' ' + arr[2]*-1;
			}
			fs.writeSync(fd, line + '\n');
		}
		fs.closeSync(fd);
		console.log('Done offsetting ', infile);
		resolve(outfile);
	});
};