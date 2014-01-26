var http = require('http');
var httpProxy = require('http-proxy');

var settings = {
	domain: "libremap.freifunk-franken.de",
	libremapWebUi_port: 9000,
	frankenApi_port: 9001
}

httpProxy.createServer({
	hostnameOnly: true,
	router: {
		settings.domain + '/' 			: '127.0.0.1:' + settings.libremapWebUi_port,
		settings.domain + '/netmon/' 	: '127.0.0.1:' + settings.frankenApi_port,
		settings.domain + '/api/' 		: '127.0.0.1:5984/libremap-dev/_design/libremap-api/_rewrite'
	}
}).listen(80);
