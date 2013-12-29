process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var express = require('express');
var moment = require('moment');
var xml2js = require('xml2js');
var rest = require('restler'); //also requires xml2js
var async = require('async');
var app = express();

var settings =  {
	baseUrl: "https://netmon.freifunk-franken.de",
	apiMaxParallelRequests: 1, //TODO ask netmon developers what they think is best here; ERROR: Multible request return the same data
	apiMaxPageLimit: 50
}

/**
 * TODO
 * @param res
 * @param code
 * @param error
 * @param reason
 * @returns error object
 */
function _showError(res, code, error, reason) {
	var e = {
		error: error,
		reason: reason,
	};
	res.statusCode = code;
	res.send(e);
	return e;
}

/**
 * cleanup of unnecessary arrays:
 * "key": [ "value" ] ==> "key": "value"
 * @param obj
 * @returns clean object
 */
function _cleanObject(obj) {
	var object = {};
	for (var key in obj) {
		if (Object.keys(obj[key]).length===1) {
			var val = obj[key][0];
			if (val && val.length>0) { object[key] = val; }
		} else if (Object.keys(obj[key]).length>1) {
			object[key] = _cleanObject(obj[key]);
		}
	}
	return object;
}

/**
 * Creates a query string from an key-value object: ?key1=value1&key2=value2
 * @param params
 * @returns {String}
 */
function _createQueryList(params) {
	var query = "?";
	for (var key in params) {
		query += key + "=" + params[key] + "&";
	}
	return query.slice(0, -1);
}

/**
 * TODO
 * @param router
 * @returns api compatible router object
 */
function _createRouterNode(router) {
	router = _cleanObject(router);
	var node = {
		"api_rev": "1.0",
		"type": "router",
		"hostname": router.hostname,
		"ctime" : moment.unix(router.create_date).format(),
		"mtime" : moment().format(),
		"lat": router.latitude,
		"lon": router.longitude,
		"community": "Freifunk/Franken",
		"attributes": {
			"netmon": {
				"id": router.router_id,
				"url": settings.baseUrl + "/router.php?router_id=" + router.router_id,
			}
		}
	};
	if (router.description && router.description.length>0) { node.site = router.description; }
	return node;
}

/** **************************************************************************
 * get all nodes
 */
app.get('/nodes', function(req, res) {
	console.log("REQUEST /nodes" + _createQueryList(req.query));
	var routerlist = [];
	
	//Filter "unwanted" url-parameters
	if (req.query.limit !== undefined) {
		return _showError(res, 400, "invalid parameter", "the parameter 'limit' is not allowed because it is used internaly");
		//alternative: delete req.query['limit'];
	}
	if (req.query.offset !== undefined) {
		return _showError(res, 400, "invalid parameter", "the parameter 'offset' is not allowed because it is used internaly");
		//alternative: delete req.query['offset'];
	}
	
	var queue = async.queue(function(offset, callback) {
		var parameterList = _createQueryList(req.query);
		parameterList = (parameterList.length > 0) ? parameterList + "&" : "?";
		var url = settings.baseUrl + "/api/rest/routerlist" + parameterList + "sort_by=router_id&offset=" + offset + "&limit=" + settings.apiMaxPageLimit;
		console.log("get data from netmon: " + url);
		rest.get(url).once('success', function(data, response) {
			try {
				if (!data.netmon_response || !data.netmon_response.routerlist) {
					throw _showError(res, 500, "data.netmon_response.routerlist is undefined", "here was an error loading data from url: " + url);
				}
				//routerlist.push(data.netmon_response.routerlist[0].router);
				var rs = data.netmon_response.routerlist[0].router;
				rs.forEach(function(router) {
					routerlist.push(router);
				});
				callback(offset);
			} catch (err) {
				console.error("ERROR: ", err);
			}
		});
	}, settings.apiMaxParallelRequests);
	
	//When the queue is emptied we want to check if we're done
	queue.drain = function(err) {
		//TODO error handling
		var nodes = [];
		routerlist.forEach(function(router) {
			var node = _createRouterNode(router);
			node.attributes.user = _cleanObject(router.user[0]);
			node.attributes.chipset = _cleanObject(router.chipset[0]);
			node.attributes.statusdata = _cleanObject(router.statusdata[0]);
			nodes.push(node);
		});
		res.json(nodes);
		console.log("FINISHED delivering list with " + nodes.length + " nodes\n");
	};
	
	rest.get(settings.baseUrl + "/api/rest/routerlist?limit=0").once('success', function(data, response) {
		var avlNodeCount = data.netmon_response.routerlist[0].$.total_count;
		var n = 0;
		while ( n < avlNodeCount) {
			queue.push(n);
			n += settings.apiMaxPageLimit;
		}
	});
});


/** **************************************************************************
 * get node data by (netmon) id
 */
app.get('/node/:id', function(req, res) {
	console.log("REQUEST /node/" + req.params.id);
	var router = null;
	var interfaces = null;
	
	async.parallel([
		function(callback) {
			var queryUrl = settings.baseUrl + "/api/rest/router/" + req.params.id;
			console.log("get data from netmon: " + queryUrl);
			rest.get(queryUrl).once('success', function(data, response) {
				if (data.netmon_response === undefined || data.netmon_response.router === undefined) {
					return _showError(res, 404, "not_found", data.netmon_response.request[0].error_message[0] || data);
				}
				router = data.netmon_response.router[0];
				callback();
			}).once('fail', function(data, response) {
				return _showError(res, 404, "not_found", data.netmon_response.request[0].error_message[0] || data);
			});
		}
		/*TODO get more node information, function(callback) { ... } */
	], function(err) {
		//TODO error handling
		var node = _createRouterNode(router);
		res.json(node);
		console.log("FINISHED delivering node data\n");
	});
});

app.listen(9001);
