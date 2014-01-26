var http = require('http');
var httpProxy = require('http-proxy');

httpProxy.createServer({
	hostnameOnly: true,
	router: {
		'libremap.freifunk-franken.de/' 		: '127.0.0.1:9000',
		'libremap.freifunk-franken.de/netmon/' 	: '127.0.0.1:9001',
		'libremap.freifunk-franken.de/api/' 	: '127.0.0.1:5984/libremap-dev/_design/libremap-api/_rewrite'
	}
}).listen(80);
