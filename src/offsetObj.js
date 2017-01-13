import {Promise} from "bluebird";
import readline from "readline";
import fs from "fs";

export default function(config) {
	var infile = config.infile;
	var outfile = config.outfile;
	const offsetx = config.offsetx;
	const offsety = config.offsety;
	
	return new Promise(function(resolve, reject){
		console.log('Setting offset');
		var lineReader = readline.createInterface({
		  input: fs.createReadStream(infile),
		  output: process.stdout,
		  terminal: false
		});
		
		var fd = fs.openSync(outfile, 'w');
		lineReader.on('line', function (line) {
			if (line[0] == 'v'){
				var arr = line.split(' ');
				arr[1] = parseFloat(arr[1] - offsetx).toFixed(3);
				arr[2] = parseFloat(arr[2] - offsety).toFixed(3);
				if (arr[1] == 0) {arr[1] = 0.1};
				if (arr[2] == 0) {arr[2] = 0.1};
				if (arr[3] == 0) {arr[3] = 0.1};
				line = arr[0] + ' ' + arr[1] + ' ' + arr[3] + ' ' + arr[2]*-1;
			}
			fs.write(fd, line + '\n');
		});
		lineReader.on('close',function(){
				resolve({infile: outfile});
		});
	});
	
};