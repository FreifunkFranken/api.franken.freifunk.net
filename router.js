var http = require('http');
var httpProxy = require('http-proxy');

var domain = "libremap.freifunk-franken.de";

httpProxy.createServer({
	hostnameOnly: true,
	router: {
		domain + '/' 			: '127.0.0.1:9000',
		domain + '/netmon/' 	: '127.0.0.1:9001',
		domain + '/api/' 		: '127.0.0.1:5984/libremap-dev/_design/libremap-api/_rewrite'
	}
}).listen(80);
