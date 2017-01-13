import readlineSync from 'readline-sync';
import client from 'scp2';

export default function(config) {
	var user = config.user;
	var pass = config.pass;
	return new Promise(function(resolve, reject){
		console.log('Copy to webserver (/var/data/sites/cesium/b3dm_test/) NEW');

		var pass = readlineSync.question('Password for ' + user + ': ', {
		  hideEchoBack: true // The typed text on screen is hidden by `*` (default). 
		});
		
		client.scp('./data/*.*', user+':'+pass+'@192.168.40.2:/var/data/sites/cesium/b3dm_test/', function(err) {
			if (!err){
				resolve();
			}
			else {
				reject(err);
			}
		});
		
	});
}