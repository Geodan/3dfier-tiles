import fs from "fs";
import {exec} from "child_process";

export default function(config) {
	return new Promise(function(resolve, reject){
		console.log('Exporting data to obj file');
		
		var command = './src/run3dfier.sh '+config.xmin+' '+config.ymin+' '+config.xmax+' '+config.ymax;
		var child = exec(command, function(err, stdout, stderr){
			if(err != null){
				reject(err);
				//return cb(new Error(err), null);
			}else if(typeof(stderr) != "string"){
				reject(stderr);
				//return cb(new Error(stderr), null);
			}else{
				resolve();
				//return cb(null, stdout);
			}
		});
		//console.log(child);
		child.on('close', function(code) {
		  console.log('run3dfier ended with: ' + code);
		  resolve();
		});
		child.on('error', function(err) {
		  console.log('run3dfier errd with: ' + err);
		  reject(err);
		});
		child.stdout.on('data', function(d) {
		  console.log('run3dfier: ' + d);
	   });
		
		
	});
}