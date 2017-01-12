var fs = require('fs'),
	readline = require('readline'),
	infile = './data/3dfied_in.obj',
	outfile = './data/3dfied_out.obj',
	offsetx = 121000,
	offsety = 487000;
	
	
var lineReader = readline.createInterface({
  input: fs.createReadStream(infile),
  output: process.stdout,
  terminal: false
});

fd = fs.openSync(outfile, 'w');

lineReader.on('line', function (line) {
	if (line[0] == 'v'){
		arr = line.split(' ');
		arr[1] = parseFloat(arr[1] - offsetx).toFixed(3);
		arr[2] = parseFloat(arr[2] - offsety).toFixed(3);
		line = arr[0] + ' ' + arr[1] + ' ' + arr[3] + ' ' + arr[2]*-1;
	}
	fs.write(fd, line + '\n');
});