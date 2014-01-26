var express = require('express');
var request = require('request');
var app = express();

app.use('/', function(req, res) {
        url = 'http://127.0.0.1:9000' + req.url;
        console.log(url);
        req.pipe(request(url)).pipe(res);
});

app.use('/api', function(req, res) {
        url = 'http://127.0.0.1:9001' + req.url;
        console.log(url);
        req.pipe(request(url)).pipe(res);
});

app.use('/api', function(req, res) {
        url = 'http://127.0.0.1:5984/libremap-dev/_design/libremap-api/_rewrite' + req.url;
        console.log(url);
        req.pipe(request(url)).pipe(res);
});

app.listen(80);