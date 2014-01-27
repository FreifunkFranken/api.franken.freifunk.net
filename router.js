var bouncy = require('bouncy');

var server = bouncy(function (req, res, bounce) {
	//console.log(req.headers);
	if (req.headers.host === 'libremap.freifunk-franken.de') {
		bounce(9000);
	} else {
		res.statusCode = 404;
		res.end('no such host');
	}
});
server.listen(80);
